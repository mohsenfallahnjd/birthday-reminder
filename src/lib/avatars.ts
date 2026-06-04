/** Built-in profile avatars — stored in User.avatarUrl as `preset:<id>` */

export const PRESET_AVATARS = [
  { id: "cake", label: "Cake", bg: "#fce7f3", ring: "#db2777", emoji: "🎂" },
  { id: "party", label: "Party", bg: "#ede9fe", ring: "#7c3aed", emoji: "🎉" },
  { id: "gift", label: "Gift", bg: "#dbeafe", ring: "#2563eb", emoji: "🎁" },
  { id: "balloon", label: "Balloon", bg: "#ffedd5", ring: "#ea580c", emoji: "🎈" },
  { id: "star", label: "Star", bg: "#fef9c3", ring: "#ca8a04", emoji: "⭐" },
  { id: "heart", label: "Heart", bg: "#ffe4e6", ring: "#e11d48", emoji: "❤️" },
  { id: "sun", label: "Sun", bg: "#fef3c7", ring: "#d97706", emoji: "☀️" },
  { id: "moon", label: "Moon", bg: "#e0e7ff", ring: "#4f46e5", emoji: "🌙" },
  { id: "flower", label: "Flower", bg: "#dcfce7", ring: "#16a34a", emoji: "🌸" },
  { id: "cat", label: "Cat", bg: "#f3e8ff", ring: "#9333ea", emoji: "🐱" },
  { id: "dog", label: "Dog", bg: "#ffedd5", ring: "#c2410c", emoji: "🐶" },
  { id: "sparkle", label: "Sparkle", bg: "#cffafe", ring: "#0891b2", emoji: "✨" },
] as const;

export type PresetAvatarId = (typeof PRESET_AVATARS)[number]["id"];

const PRESET_PREFIX = "preset:";

export function presetAvatarUrl(id: PresetAvatarId) {
  return `${PRESET_PREFIX}${id}`;
}

export function parsePresetAvatar(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith(PRESET_PREFIX)) return null;
  const id = avatarUrl.slice(PRESET_PREFIX.length);
  return PRESET_AVATARS.find((a) => a.id === id) ?? null;
}

export function isValidAvatarUrl(value: string | null | undefined) {
  if (value === null || value === undefined) return true;
  if (value === "") return true;
  const preset = parsePresetAvatar(value);
  return preset !== null;
}

export function randomPresetAvatar() {
  const pick = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
  return presetAvatarUrl(pick.id);
}

export function nameToAccentColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hues = ["#e11d48", "#ea580c", "#059669", "#0891b2", "#2563eb", "#7c3aed", "#db2777"];
  return hues[Math.abs(hash) % hues.length];
}

export function personInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
