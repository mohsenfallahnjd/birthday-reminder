"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Icon } from "@/components/icon";
import { useDateSystem } from "@/lib/date-system-context";
import {
  JALALI_MONTHS,
  GREGORIAN_MONTHS,
  jalaliDaysInMonth,
  gregorianDaysInMonth,
  gregorianToJalali,
  jalaliToGregorian,
  formatBirthdayBySystem,
} from "@/lib/jalali";

type ContactReminder = {
  id: string;
  name: string;
  birthMonth: number;
  birthDay: number;
  daysBefore: number;
};

const DAYS_OPTIONS = [
  { value: 0, label: "On the day" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "1 week before" },
  { value: 14, label: "2 weeks before" },
];

export function ContactReminderManager({
  initial,
}: {
  initial: ContactReminder[];
}) {
  const system = useDateSystem();
  const isGregorian = system === "gregorian";

  const months = isGregorian ? GREGORIAN_MONTHS : JALALI_MONTHS;
  const daysInMonth = (m: number) =>
    isGregorian ? gregorianDaysInMonth(m) : jalaliDaysInMonth(m);

  const [contacts, setContacts] = useState<ContactReminder[]>(initial);
  const [name, setName] = useState("");
  // inputMonth/Day track what the user sees (could be Gregorian or Jalali)
  const [inputMonth, setInputMonth] = useState(1);
  const [inputDay, setInputDay] = useState(1);
  const [daysBefore, setDaysBefore] = useState(1);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function add() {
    if (!name.trim()) { setError("Enter a name."); return; }
    setError("");
    setAdding(true);

    // Always store as Jalali
    const { month: jMonth, day: jDay } = isGregorian
      ? gregorianToJalali(inputMonth, inputDay)
      : { month: inputMonth, day: inputDay };

    const res = await fetch("/api/contact-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), birthMonth: jMonth, birthDay: jDay, daysBefore }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setError(data.error ?? "Could not add contact"); return; }
    setContacts((prev) => [...prev, data]);
    setName("");
    setInputMonth(1);
    setInputDay(1);
    setDaysBefore(1);
  }

  async function remove(id: string) {
    setDeletingId(id);
    await fetch(`/api/contact-reminders/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-foreground">Add a contact</p>

        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom, Ali, ..."
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Birth month</Label>
            <select
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
              value={inputMonth}
              onChange={(e) => {
                const m = Number(e.target.value);
                setInputMonth(m);
                if (inputDay > daysInMonth(m)) setInputDay(daysInMonth(m));
              }}
            >
              {months.map((label, i) => (
                <option key={label} value={i + 1}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Birth day</Label>
            <select
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
              value={inputDay}
              onChange={(e) => setInputDay(Number(e.target.value))}
            >
              {Array.from({ length: daysInMonth(inputMonth) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>Remind me</Label>
          <select
            className="mt-1.5 h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
            value={daysBefore}
            onChange={(e) => setDaysBefore(Number(e.target.value))}
          >
            {DAYS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="button"
          variant="primary"
          onClick={add}
          loading={adding}
          loadingText="Adding…"
          className="w-full"
        >
          <Icon name="cake" size={14} className="mr-2 text-white" />
          Add contact
        </Button>
      </div>

      {contacts.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden shadow-sm">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                  <Icon name="cake" size={11} className="shrink-0 opacity-70" />
                  {formatBirthdayBySystem(c.birthMonth, c.birthDay, null, system)}
                  <span className="text-muted/50">·</span>
                  {c.daysBefore === 0 ? "on the day" : `${c.daysBefore}d before`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={deletingId === c.id}
                className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Icon name="trash" size={14} className="text-current" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {contacts.length === 0 && (
        <p className="text-sm text-muted text-center py-2">No contacts yet.</p>
      )}
    </div>
  );
}
