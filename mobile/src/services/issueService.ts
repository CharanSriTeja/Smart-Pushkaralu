
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { apiRequest, API_BASE_URL, getInMemoryAccessToken } from './api';
import { IssueReport, IssueUpdate, CreateIssueDTO } from '../types/issues';

const LOCAL_TICKETS_KEY = 'sp_my_ticket_numbers';
const DEVICE_FP_KEY = 'sp_device_fingerprint';

async function getOrGenerateDeviceFingerprint(): Promise<string> {
  try {
    let fp = await SecureStore.getItemAsync(DEVICE_FP_KEY);
    if (!fp) {
      fp = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await SecureStore.setItemAsync(DEVICE_FP_KEY, fp);
    }
    return fp;
  } catch {
    return 'mobile_client_device';
  }
}

export async function getSavedTicketNumbers(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(LOCAL_TICKETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTicketNumber(ticketNo: string): Promise<void> {
  try {
    const list = await getSavedTicketNumbers();
    if (!list.includes(ticketNo)) {
      list.unshift(ticketNo);
      await SecureStore.setItemAsync(LOCAL_TICKETS_KEY, JSON.stringify(list.slice(0, 50)));
    }
  } catch (err) {
    console.warn('[issueService] Failed to save ticket number:', err);
  }
}

export class IssueService {
  /**
   * Compresses image client-side to ensure swift upload on weak festival cellular connectivity
   */
  static async compressPhoto(uri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (err) {
      console.warn('[IssueService] Compression fallback:', err);
      return uri;
    }
  }

  /**
   * Uploads compressed photo to server (strips EXIF server-side)
   */
  static async uploadPhoto(uri: string): Promise<string> {
    const compressedUri = await this.compressPhoto(uri);

    const formData = new FormData();
    const filename = compressedUri.split('/').pop() || 'issue.jpg';

    // Handle React Native FormData file shape
    if (Platform.OS === 'web') {
      const res = await fetch(compressedUri);
      const blob = await res.blob();
      formData.append('photo', blob, filename);
    } else {
      formData.append('photo', {
        uri: compressedUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
    }

    const token = getInMemoryAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const uploadResponse = await fetch(`${API_BASE_URL}/v1/issues/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to upload photo');
    }

    const data = await uploadResponse.json();
    return data.photo_url;
  }

  /**
   * Reports a grievance with duplicate detection
   */
  static async reportIssue(dto: CreateIssueDTO): Promise<{
    ticket_no: string;
    is_duplicate: boolean;
    duplicate_of?: string;
    message?: string;
    issue: IssueReport;
  }> {
    const fingerprint = await getOrGenerateDeviceFingerprint();

    const response = await apiRequest<{
      success: boolean;
      ticket_no: string;
      is_duplicate: boolean;
      duplicate_of?: string;
      message?: string;
      issue: IssueReport;
    }>('/v1/issues', {
      method: 'POST',
      headers: {
        'x-device-fingerprint': fingerprint,
      },
      body: JSON.stringify({
        ...dto,
        device_fingerprint: fingerprint,
      }),
    });

    // Save ticket locally so user can always track it
    if (response.ticket_no) {
      await saveTicketNumber(response.ticket_no);
    }

    return response;
  }

  /**
   * Fetches issues reported by this user or device
   */
  static async getMyIssues(): Promise<IssueReport[]> {
    const fingerprint = await getOrGenerateDeviceFingerprint();
    let serverIssues: IssueReport[] = await apiRequest<{ issues: IssueReport[] }>(
      `/v1/issues/mine?device_fingerprint=${encodeURIComponent(fingerprint)}`,
      {
        headers: {
          'x-device-fingerprint': fingerprint,
        },
      }
    ).then((r) => r.issues || []).catch(() => [] as IssueReport[]);

    // Also check any locally saved tickets that might have been reported while guest
    const localTickets = await getSavedTicketNumbers();
    const knownTicketNos = new Set(serverIssues.map((i) => i.ticket_no));

    const missingTickets = localTickets.filter((t) => !knownTicketNos.has(t));
    if (missingTickets.length > 0) {
      const extraResults = await Promise.all(
        missingTickets.slice(0, 10).map((t) =>
          this.getIssueByTicket(t)
            .then((res) => res.issue)
            .catch(() => null)
        )
      );
      for (const item of extraResults) {
        if (item) serverIssues.push(item);
      }
    }

    // Sort newest first
    serverIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return serverIssues;
  }

  /**
   * Public tracking by ticket number with sanitized timeline
   */
  static async getIssueByTicket(
    ticketNo: string
  ): Promise<{ issue: IssueReport; timeline: IssueUpdate[] }> {
    return apiRequest<{ issue: IssueReport; timeline: IssueUpdate[] }>(
      `/v1/issues/${encodeURIComponent(ticketNo.trim())}`
    );
  }
}
