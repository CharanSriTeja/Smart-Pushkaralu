import { can } from './auth.js';
import { userHasPermission } from '../services/user.js';

/**
 * Re-export granular permission check middleware for backwards compatibility.
 * All route-level checks enforce permissions via userHasPermission.
 */
export const checkPermission = can;

export async function verifyUserPermission(userId: string, permissionName: string): Promise<boolean> {
  return userHasPermission(userId, '', permissionName);
}

