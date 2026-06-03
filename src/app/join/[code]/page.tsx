import { redirect } from "next/navigation";

/** Short invite link: /join/ABC123 → Groups join form with code prefilled */
export default async function JoinRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/groups?code=${encodeURIComponent(code)}`);
}
