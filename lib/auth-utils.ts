import { NextRequest } from 'next/server';

export interface AuthSession {
  userId: string;
  email: string;
  role: 'admin' | 'builder' | 'vendor' | 'worker';
  firstName: string;
  lastName: string;
}

// Parse session from request (mock implementation - replace with real session management)
export function getSessionFromRequest(req: NextRequest): AuthSession | null {
  // This is a placeholder - in production, use iron-session or similar
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    // In production, verify JWT token and extract session data
    const token = authHeader.substring(7);
    // For now, return null - implement proper JWT verification
    return null;
  } catch (error) {
    return null;
  }
}

// Check if user has specific role
export function hasRole(session: AuthSession | null, roles: string[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

// Audit log helper
export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes: Record<string, any>,
  req?: NextRequest
) {
  try {
    // Import here to avoid circular dependencies
    const AuditLog = (await import('./models/AuditLog')).default;
    
    await AuditLog.create({
      userId,
      action,
      entity,
      entityId,
      changes,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.headers.get('user-agent') || '',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
