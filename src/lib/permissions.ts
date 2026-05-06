/**
 * Role-based permission matrix.
 *
 * Defined as data, not as scattered if/else throughout routes. Add a new
 * action: add it here. Change a role's powers: edit one row.
 *
 * Conventions:
 *   - OWNER: full clinic admin. Manages users, edits website, all settings.
 *            Cannot delete patient data (no role can — append-only by design).
 *   - DOCTOR: edits consultation cards (their domain). Reads everything in
 *             clinic. Cannot edit website / users / clinic settings.
 *   - STAFF:  reception. Can read everything, can create/accept/reschedule
 *             appointments, cannot touch consultations or website.
 *
 * Patient & Card rows are NEVER deleted. There's no `patient.delete`.
 * If you want to remove data, do it via DB tools — that's intentional.
 */
import { Role } from '@prisma/client';

// Every action the app does. Keep this list in one place.
export type Action =
  // User management
  | 'user.read'
  | 'user.create'
  | 'user.update'
  | 'user.deactivate'
  // Clinic settings & website
  | 'settings.read'
  | 'settings.update'
  | 'website.read'
  | 'website.update'
  // Doctors
  | 'doctor.read'
  | 'doctor.create'
  | 'doctor.update'
  | 'doctor.deactivate'
  // Services
  | 'service.read'
  | 'service.create'
  | 'service.update'
  | 'service.deactivate'
  // Patients (no delete — append-only)
  | 'patient.read'
  | 'patient.create'
  | 'patient.update'
  // Cards
  | 'card.read'
  | 'card.create'              // new appointment from CMS
  | 'card.transition.approve'  // request -> appointment
  | 'card.transition.start'    // appointment -> consultation
  | 'card.transition.cancel'   // any -> cancelled / no_show / rejected
  | 'card.consultation.edit'   // notes, attachments, follow-ups
  // Reviews
  | 'review.read'
  | 'review.create'
  | 'review.update'
  | 'review.deactivate'
  // Media
  | 'media.read'
  | 'media.upload'
  // Audit
  | 'audit.read'
  // Backup
  | 'backup.run';

const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  OWNER: new Set<Action>([
    'user.read', 'user.create', 'user.update', 'user.deactivate',
    'settings.read', 'settings.update',
    'website.read', 'website.update',
    'doctor.read', 'doctor.create', 'doctor.update', 'doctor.deactivate',
    'service.read', 'service.create', 'service.update', 'service.deactivate',
    'patient.read', 'patient.create', 'patient.update',
    'card.read', 'card.create',
    'card.transition.approve', 'card.transition.start',
    'card.transition.cancel', 'card.consultation.edit',
    'review.read', 'review.create', 'review.update', 'review.deactivate',
    'media.read', 'media.upload',
    'audit.read',
    'backup.run',
  ]),
  DOCTOR: new Set<Action>([
    // Read-most, edit consultations.
    'settings.read',
    'website.read',
    'doctor.read',
    'service.read',
    'patient.read', 'patient.update',
    'card.read',
    'card.transition.start',
    'card.transition.cancel',
    'card.consultation.edit',
    'review.read',
    'media.read', 'media.upload',
    'audit.read',
  ]),
  STAFF: new Set<Action>([
    // Reception. Manage incoming requests + appointments. No consultation edits.
    'settings.read',
    'website.read',
    'doctor.read',
    'service.read',
    'patient.read', 'patient.create', 'patient.update',
    'card.read', 'card.create',
    'card.transition.approve',
    'card.transition.cancel',
    'review.read',
    'media.read',
  ]),
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role].has(action);
}

export class ForbiddenError extends Error {
  constructor(public action: Action, public role: Role) {
    super(`Role ${role} cannot perform ${action}`);
    this.name = 'ForbiddenError';
  }
}

/**
 * Throws ForbiddenError if the role lacks the action. Caller catches it
 * and returns a 403. Use this at the top of CMS route handlers.
 */
export function requirePermission(role: Role, action: Action): void {
  if (!can(role, action)) throw new ForbiddenError(action, role);
}
