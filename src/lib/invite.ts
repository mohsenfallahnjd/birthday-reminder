/** Short path friends can open to join a group (redirects to Groups with code filled). */
export function groupJoinPath(inviteCode: string) {
  const code = inviteCode.trim();
  return `/join/${encodeURIComponent(code)}`;
}

export function groupJoinUrl(inviteCode: string, origin: string) {
  const base = origin.replace(/\/$/, "");
  return `${base}${groupJoinPath(inviteCode)}`;
}

export function groupInviteShareMessage(
  groupName: string,
  inviteCode: string,
  origin: string,
) {
  const url = groupJoinUrl(inviteCode, origin);
  return `Join "${groupName}" on Birthday\nCode: ${inviteCode}\n${url}`;
}
