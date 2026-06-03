import { put } from "@vercel/blob";
import { requireUser } from "@/lib/auth";
import { isBlobStorageConfigured } from "@/lib/blob";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in", 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("File not found");
  }

  if (!isBlobStorageConfigured()) {
    return jsonError(
      "File storage not configured. Link a Blob store on Vercel, then run: vercel env pull",
      503,
    );
  }

  try {
    const blob = await put(`proofs/${user.id}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    return jsonOk({ url: blob.url });
  } catch (err) {
    console.error("[upload]", err);
    return jsonError("Upload failed. Check Blob env vars and try again.", 500);
  }
}
