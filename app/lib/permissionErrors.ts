import { toast } from 'react-hot-toast';

export const PERMISSION_DENIED = 'PERMISSION_DENIED';

export class PermissionDeniedError extends Error {
  required: string[];

  constructor(message: string, required: string[] = []) {
    super(message);
    this.name = 'PermissionDeniedError';
    this.required = required;
  }
}

export function toastPermissionDenied(message?: string) {
  toast.error(message || "You don't have access to this feature.");
}

export function isPermissionDeniedBody(body: Record<string, unknown>): boolean {
  return body.code === PERMISSION_DENIED;
}
