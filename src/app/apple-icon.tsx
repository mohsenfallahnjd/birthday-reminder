import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b",
        borderRadius: 40,
      }}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="10" y="32" width="44" height="22" rx="6" fill="#fafafa" />
        <rect x="14" y="26" width="36" height="8" rx="4" fill="#e4e4e7" />
        <rect x="30" y="12" width="4" height="16" rx="2" fill="#fafafa" />
        <circle cx="32" cy="10" r="5" fill="#fbbf24" />
      </svg>
    </div>,
    { ...size },
  );
}
