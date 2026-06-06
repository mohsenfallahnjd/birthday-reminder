"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReminderButton({
  targetUserId,
  groupId,
  initialSet = false,
}: {
  targetUserId: string;
  groupId?: string;
  initialSet?: boolean;
}) {
  const [done, setDone] = useState(initialSet);
  const [loading, setLoading] = useState(false);

  async function setReminder() {
    setLoading(true);
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, groupId, daysBefore: 3 }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={setReminder}
      disabled={done}
      loading={loading}
      loadingText="Saving…"
    >
      {done ? "Reminder on" : "Remind 3 days before"}
    </Button>
  );
}
