import { put } from "@vercel/blob";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("لطفاً وارد شوید", 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("فایل یافت نشد");
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return jsonError("ذخیره‌سازی فایل پیکربندی نشده", 503);
  }

  const blob = await put(`proofs/${user.id}-${Date.now()}-${file.name}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return jsonOk({ url: blob.url });
}
