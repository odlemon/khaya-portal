/**
 * Temporary: download staff login credentials while email delivery is unreliable.
 * Remove when credential emails are stable again.
 */

export interface StaffCredentialsPayload {
  email: string;
  password: string;
  portal: string;
  roleName: string;
  mustChangePassword?: boolean;
}

export function downloadStaffCredentialsTxt(credentials: StaffCredentialsPayload) {
  const generatedAt = new Date().toISOString();
  const content = [
    'Khayalami Staff Login Credentials',
    '=================================',
    `Email:    ${credentials.email}`,
    `Password: ${credentials.password}`,
    `Portal:   ${credentials.portal}`,
    `Role:     ${credentials.roleName}`,
    '',
    'You must change your password on first login.',
    `Generated: ${generatedAt}`,
    '',
  ].join('\n');

  const localPart = credentials.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
  const date = generatedAt.slice(0, 10).replace(/-/g, '');
  const filename = `staff-credentials-${localPart}-${date}.txt`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** If credentials are present, download .txt and return a toast message. */
export function handleStaffCredentialsResponse(data: {
  emailSent?: boolean;
  credentials?: StaffCredentialsPayload | null;
} | null | undefined): string | null {
  if (!data?.credentials?.email || !data.credentials.password) return null;

  downloadStaffCredentialsTxt(data.credentials);

  if (data.emailSent === true) {
    return 'Credentials emailed and downloaded as a backup file.';
  }
  return 'Email not sent — credentials file downloaded. Share it securely with the staff member.';
}
