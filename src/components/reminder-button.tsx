"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReminderButton({
  targetUserId,
  groupId,
}: {
  targetUserId: string;
  groupId?: string;
}) {
  const [done, setDone] = useState(false);

  async function setReminder() {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, groupId, daysBefore: 3 }),
    });
    setDone(true);
  }

  return (
    <Button size="sm" variant="outline" onClick={setReminder} disabled={done}>
      {done ? "Reminder on" : "Remind 3 days before"}
    </Button>
  );
}
