import { IssuesRepository } from './issues.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { FCMService } from '../../services/fcm.service.js';
import {
  CreateIssueDTO,
  IssueReport,
  IssueStatus,
  IssueUpdate,
  IssueFilterParams,
} from '../../types/issues.js';

export const VALID_STATUSES: IssueStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
  'rejected',
];

export const VALID_CATEGORIES = [
  'sanitation',
  'road',
  'water',
  'lighting',
  'crowd',
  'other',
] as const;

export class IssuesService {
  /**
   * Reports a new issue with duplicate detection
   */
  static async reportIssue(
    dto: CreateIssueDTO,
    reporter?: { id?: string | null; phone?: string | null }
  ): Promise<{
    ticket_no: string;
    is_duplicate: boolean;
    duplicate_of?: string;
    message?: string;
    issue: IssueReport;
  }> {
    // 1. Run duplicate check: within 100 meters and last 30 minutes
    const duplicate = await IssuesRepository.findDuplicate(
      dto.category,
      dto.lat,
      dto.lng,
      30, // 30 minutes
      100 // 100 meters
    );

    if (duplicate) {
      await IssuesRepository.incrementDuplicateCount(duplicate.ticket_no);
      return {
        ticket_no: duplicate.ticket_no,
        is_duplicate: true,
        duplicate_of: duplicate.ticket_no,
        message: `A similar ${dto.category} issue was recently reported at this location. You are tracking existing Ticket #${duplicate.ticket_no}.`,
        issue: duplicate,
      };
    }

    // 2. Create new report
    const newIssue = await IssuesRepository.createIssue(dto, reporter);
    return {
      ticket_no: newIssue.ticket_no,
      is_duplicate: false,
      issue: newIssue,
    };
  }

  /**
   * Public tracking by ticket number with sanitized timeline
   */
  static async getIssueByTicketNo(
    ticketNo: string
  ): Promise<{ issue: IssueReport; timeline: IssueUpdate[] }> {
    const issue = await IssuesRepository.findByTicketNo(ticketNo);
    if (!issue) {
      throw new Error(`Issue with ticket number "${ticketNo}" not found.`);
    }

    // Public view: internal notes stripped
    const timeline = await IssuesRepository.getTimeline(issue.id, false);

    return {
      issue,
      timeline,
    };
  }

  /**
   * Fetches issues reported by the user or device
   */
  static async getMyIssues(params: {
    reporterId?: string | null;
    deviceToken?: string | null;
    deviceFingerprint?: string | null;
  }): Promise<IssueReport[]> {
    return IssuesRepository.findMyIssues(params);
  }

  /**
   * Admin: List issues with filters & pagination
   */
  static async adminListIssues(filters: IssueFilterParams): Promise<{
    issues: IssueReport[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 20, 1), 100);
    const result = await IssuesRepository.listIssues({ ...filters, page, limit });
    return {
      issues: result.issues,
      total: result.total,
      page,
      limit,
    };
  }

  /**
   * Admin: Detailed issue view including internal notes and audit history
   */
  static async adminGetIssue(id: string): Promise<{
    issue: IssueReport;
    timeline: IssueUpdate[];
    auditLogs: any[];
  }> {
    const issue = await IssuesRepository.findById(id);
    if (!issue) {
      throw new Error(`Issue not found with ID "${id}".`);
    }

    const timeline = await IssuesRepository.getTimeline(issue.id, true);
    const { logs } = await AuditService.getLogs({
      entityType: 'issue_report',
      entityId: issue.id,
      limit: 50,
    });

    return {
      issue,
      timeline,
      auditLogs: logs,
    };
  }

  /**
   * Admin: Status transition with mandatory audit logging and FCM notification
   */
  static async adminUpdateStatus(params: {
    issueId: string;
    newStatus: IssueStatus;
    reason: string;
    adminUser: { userId: string; phone: string };
    publicNote?: string | null;
    internalNote?: string | null;
    resolutionPhotoUrl?: string | null;
    ipAddress?: string | null;
  }): Promise<{ issue: IssueReport; update: IssueUpdate }> {
    if (!VALID_STATUSES.includes(params.newStatus)) {
      throw new Error(`Invalid status "${params.newStatus}". Valid: ${VALID_STATUSES.join(', ')}.`);
    }

    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('A reason is strictly required for updating issue status in audit logs.');
    }

    const existing = await IssuesRepository.findById(params.issueId);
    if (!existing) {
      throw new Error(`Issue not found with ID "${params.issueId}".`);
    }

    const oldStatus = existing.status;

    // 1. Update issue status
    const updated = await IssuesRepository.updateStatus(existing.id, params.newStatus);
    if (!updated) {
      throw new Error('Failed to update issue status.');
    }

    // 2. Insert timeline update
    const update = await IssuesRepository.addUpdate({
      issue_id: existing.id,
      status: params.newStatus,
      public_note: params.publicNote || `Status updated to ${params.newStatus.replace('_', ' ')}.`,
      internal_note: params.internalNote || null,
      resolution_photo_url: params.resolutionPhotoUrl || null,
      updated_by_admin_id: params.adminUser.userId,
    });

    // 3. Record audit log (mandatory)
    await AuditService.record({
      adminId: params.adminUser.userId,
      adminEmail: params.adminUser.phone,
      action: 'ISSUE_STATUS_UPDATE',
      entityType: 'issue_report',
      entityId: existing.id,
      oldValues: { status: oldStatus },
      newValues: {
        status: params.newStatus,
        public_note: params.publicNote,
        internal_note: params.internalNote,
        resolution_photo_url: params.resolutionPhotoUrl,
      },
      reason: params.reason.trim(),
      ipAddress: params.ipAddress || null,
    });

    // 4. Send FCM Push Notification to reporter
    try {
      await FCMService.sendIssueStatusNotification({
        ticketNo: existing.ticket_no,
        status: params.newStatus,
        reporterDeviceToken: existing.reporter_device_token,
        reporterId: existing.reporter_id,
        publicNote: params.publicNote || undefined,
      });
    } catch (err: any) {
      console.warn('[IssuesService] Failed to dispatch FCM push notification:', err.message);
    }

    return { issue: updated, update };
  }

  /**
   * Admin: Add timeline update without changing status or with optional status change
   */
  static async adminAddTimelineUpdate(params: {
    issueId: string;
    reason: string;
    adminUser: { userId: string; phone: string };
    status?: IssueStatus;
    publicNote?: string | null;
    internalNote?: string | null;
    resolutionPhotoUrl?: string | null;
    ipAddress?: string | null;
  }): Promise<{ issue: IssueReport; update: IssueUpdate }> {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('A reason is strictly required for administrative updates in audit logs.');
    }

    const existing = await IssuesRepository.findById(params.issueId);
    if (!existing) {
      throw new Error(`Issue not found with ID "${params.issueId}".`);
    }

    const targetStatus = params.status || existing.status;
    let updatedIssue = existing;

    if (params.status && params.status !== existing.status) {
      if (!VALID_STATUSES.includes(params.status)) {
        throw new Error(`Invalid status "${params.status}".`);
      }
      const upd = await IssuesRepository.updateStatus(existing.id, params.status);
      if (upd) updatedIssue = upd;
    }

    const update = await IssuesRepository.addUpdate({
      issue_id: existing.id,
      status: targetStatus,
      public_note: params.publicNote || null,
      internal_note: params.internalNote || null,
      resolution_photo_url: params.resolutionPhotoUrl || null,
      updated_by_admin_id: params.adminUser.userId,
    });

    // Audit log
    await AuditService.record({
      adminId: params.adminUser.userId,
      adminEmail: params.adminUser.phone,
      action: 'ISSUE_TIMELINE_UPDATE',
      entityType: 'issue_report',
      entityId: existing.id,
      oldValues: { status: existing.status },
      newValues: {
        status: targetStatus,
        public_note: params.publicNote,
        internal_note: params.internalNote,
        resolution_photo_url: params.resolutionPhotoUrl,
      },
      reason: params.reason.trim(),
      ipAddress: params.ipAddress || null,
    });

    // FCM Notification
    if (params.publicNote || (params.status && params.status !== existing.status)) {
      try {
        await FCMService.sendIssueStatusNotification({
          ticketNo: existing.ticket_no,
          status: targetStatus,
          reporterDeviceToken: existing.reporter_device_token,
          reporterId: existing.reporter_id,
          publicNote: params.publicNote || undefined,
        });
      } catch (err: any) {
        console.warn('[IssuesService] Failed to dispatch FCM push notification:', err.message);
      }
    }

    return { issue: updatedIssue, update };
  }
}

