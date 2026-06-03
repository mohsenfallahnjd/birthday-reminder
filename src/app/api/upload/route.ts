import { put } from "@vercel/blob";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("File not found");
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return jsonError("File storage not configured", 503);
  }

  const blob = await put(`proofs/${user.id}-${Date.now()}-${file.name}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return jsonOk({ url: blob.url });
}
