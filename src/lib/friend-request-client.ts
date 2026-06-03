export type FriendRequestResult = {
  ok: boolean;
  data: { id?: string; error?: string };
};

const REQUEST_TIMEOUT_MS = 12_000;

export async function postFriendRequest(
  body: { userId: string } | { email: string },
): Promise<FriendRequestResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, data: { error: "Request timed out. Try again." } };
    }
    return { ok: false, data: { error: "Could not reach server" } };
  }
  clearTimeout(timeout);

  let data: { id?: string; error?: string } = {};
  try {
    data = (await res.json()) as { id?: string; error?: string };
  } catch {
    data = { error: "Invalid response from server" };
  }

  return { ok: res.ok, data };
}
