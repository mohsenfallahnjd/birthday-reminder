import { getVapidPublicKey, isPushConfigured } from "@/lib/push";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const publicKey = getVapidPublicKey();
  return jsonOk({
    configured: isPushConfigured(),
    publicKey,
  });
}
