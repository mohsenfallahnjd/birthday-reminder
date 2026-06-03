export type FriendRequestResult = {
  ok: boolean;
  data: { id?: string; error?: string };
};

export async function postFriendRequest(
  body: { userId: string } | { email: string },
): Promise<FriendRequestResult> {
  const res = await fetch("/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  let data: { id?: string; error?: string } = {};
  try {
    data = (await res.json()) as { id?: string; error?: string };
  } catch {
    data = { error: "Invalid response from server" };
  }

  return { ok: res.ok, data };
}
