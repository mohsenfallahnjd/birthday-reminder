/** True when Vercel Blob can authenticate (OIDC or legacy read-write token). */
export function isBlobStorageConfigured() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  return Boolean(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
}
