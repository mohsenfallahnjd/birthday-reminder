import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { parseCryptoAddresses } from "@/lib/crypto-wallets";

export async function POST(request: Request) {
  const user = await requireUserOrThrow();
  const body = await parseJson<unknown>(request);
  const addresses = parseCryptoAddresses(body);

  await db.user.update({
    where: { id: user.id },
    data: { cryptoAddresses: addresses },
  });

  return jsonOk({ ok: true });
}
