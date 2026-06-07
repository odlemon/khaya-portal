type ParticipantLike = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

type SenderIdLike =
  | string
  | {
      _id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
    }
  | null
  | undefined;

function normalizeRoleKey(role?: string): string {
  return (role || '').trim().toLowerCase().replace(/\s+/g, '_');
}

export function roleLabel(role?: string): string {
  const r = normalizeRoleKey(role);
  if (r.includes('tenant')) return 'Tenant';
  if (r.includes('landlord')) return 'Landlord';
  if (r.includes('admin')) return 'Khayalami Admin';
  return 'Participant';
}

export function roleBadgeClasses(role?: string): string {
  const r = normalizeRoleKey(role);
  if (r.includes('tenant')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (r.includes('landlord')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (r.includes('admin')) return 'bg-slate-200 text-slate-800 border-slate-300';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function nameFromParticipant(p?: ParticipantLike | null): string {
  if (!p) return '';
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return name || p.email || '';
}

export function getSenderDisplayName(
  senderId: SenderIdLike,
  senderRole: string | undefined,
  participants?: ParticipantLike[]
): string {
  if (senderId && typeof senderId === 'object') {
    const fromPopulated = nameFromParticipant(senderId as ParticipantLike);
    if (fromPopulated) return fromPopulated;
  }

  const id =
    typeof senderId === 'string'
      ? senderId
      : senderId && typeof senderId === 'object'
        ? senderId._id
        : undefined;

  if (id && participants?.length) {
    const match = participants.find((p) => p._id === id);
    const fromList = nameFromParticipant(match);
    if (fromList) return fromList;
  }

  return roleLabel(senderRole);
}

export function formatLastMessagePreview(
  content: string,
  senderId: string | undefined,
  participants?: ParticipantLike[],
  currentUserId?: string
): string {
  if (!content) return '';
  let prefix = '';
  if (senderId && participants?.length) {
    const sender = participants.find((p) => p._id === senderId);
    const name = nameFromParticipant(sender);
    if (name) prefix = `${name}: `;
    else if (sender?.role) prefix = `${roleLabel(sender.role)}: `;
  }
  if (!prefix && senderId && currentUserId && String(senderId) === String(currentUserId)) {
    prefix = 'You: ';
  }
  return `${prefix}${content}`;
}
