"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import {
  PRESET_AVATARS,
  parsePresetAvatar,
  presetAvatarUrl,
  type PresetAvatarId,
} from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function AvatarPicker({
  name,
  initialAvatarUrl,
  onChange,
}: {
  name: string;
  initialAvatarUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(initialAvatarUrl);
  const currentPreset = parsePresetAvatar(selected);

  function pickPreset(id: PresetAvatarId) {
    const url = presetAvatarUrl(id);
    setSelected(url);
    onChange(url);
  }

  function pickInitials() {
    setSelected(null);
    onChange(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted-subtle/40 p-4">
        <UserAvatar name={name} avatarUrl={selected} size="xl" />
        <div>
          <p className="text-sm font-medium text-foreground">Current avatar</p>
          <p className="mt-0.5 text-xs text-muted">
            {currentPreset
              ? `${currentPreset.label} icon`
              : "Initials from your name"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground mb-2">Choose an avatar</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          <button
            type="button"
            title="Use initials"
            onClick={pickInitials}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-xl border-2 bg-white text-xs font-medium transition-all hover:scale-105",
              selected === null
                ? "border-foreground ring-2 ring-foreground/15"
                : "border-border hover:border-foreground/20",
            )}
          >
            <UserAvatar name={name} avatarUrl={null} size="md" />
            <span className="mt-1 text-[10px] text-muted">ABC</span>
          </button>
          {PRESET_AVATARS.map((a) => {
            const url = presetAvatarUrl(a.id);
            const isSelected = selected === url;
            return (
              <button
                key={a.id}
                type="button"
                title={a.label}
                onClick={() => pickPreset(a.id)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl border-2 transition-all hover:scale-105",
                  isSelected
                    ? "ring-2 ring-offset-2"
                    : "border-transparent hover:border-border",
                )}
                style={
                  isSelected
                    ? { borderColor: a.ring, outlineColor: a.ring }
                    : { backgroundColor: a.bg }
                }
              >
                <span className="text-2xl" role="img" aria-label={a.label}>
                  {a.emoji}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
