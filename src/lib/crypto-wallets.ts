export const CRYPTO_COINS = [
  { id: "btc",  label: "Bitcoin",  symbol: "BTC",  emoji: "₿" },
  { id: "eth",  label: "Ethereum", symbol: "ETH",  emoji: "Ξ" },
  { id: "usdt", label: "Tether",   symbol: "USDT", emoji: "₮" },
  { id: "bnb",  label: "BNB",      symbol: "BNB",  emoji: "⬡" },
  { id: "sol",  label: "Solana",   symbol: "SOL",  emoji: "◎" },
  { id: "trx",  label: "TRON",     symbol: "TRX",  emoji: "⚡" },
  { id: "ton",  label: "TON",      symbol: "TON",  emoji: "💎" },
] as const;

export type CoinId = (typeof CRYPTO_COINS)[number]["id"];

export type CryptoAddresses = Partial<Record<CoinId, string>>;

export function parseCryptoAddresses(raw: unknown): CryptoAddresses {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: CryptoAddresses = {};
  for (const coin of CRYPTO_COINS) {
    const val = (raw as Record<string, unknown>)[coin.id];
    if (typeof val === "string" && val.trim()) result[coin.id] = val.trim();
  }
  return result;
}
