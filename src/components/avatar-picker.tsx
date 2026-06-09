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
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted-subtle/40 px-3 py-2.5">
        <UserAvatar name={name} avatarUrl={selected} size="md" />
        <div>
          <p className="text-xs font-medium text-foreground">
            {currentPreset ? `${currentPreset.label} icon` : "Initials from your name"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium text-muted mb-1.5">Choose avatar</p>
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
          <button
            type="button"
            title="Use initials"
            onClick={pickInitials}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-lg border-2 bg-white transition-all hover:scale-105",
              selected === null
                ? "border-foreground ring-1 ring-foreground/15"
                : "border-border hover:border-foreground/20",
            )}
          >
            <UserAvatar name={name} avatarUrl={null} size="sm" />
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
                  "flex aspect-square items-center justify-center rounded-lg border-2 transition-all hover:scale-105",
                  isSelected
                    ? "ring-1 ring-offset-1"
                    : "border-transparent hover:border-border",
                )}
                style={
                  isSelected
                    ? { borderColor: a.ring, outlineColor: a.ring }
                    : { backgroundColor: a.bg }
                }
              >
                <span className="text-lg" role="img" aria-label={a.label}>
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
