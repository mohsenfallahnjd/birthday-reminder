import { db } from "@/lib/db";
import { isBirthdayWithinDays } from "@/lib/jalali";
import { notifyUser } from "@/lib/notifications";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const reminders = await db.reminder.findMany({
    include: {
      target: true,
      owner: true,
    },
  });

  const contactReminders = await db.contactReminder.findMany();

  let sent = 0;

  for (const r of reminders) {
    const { birthMonth, birthDay, name } = r.target;
    if (!birthMonth || !birthDay) continue;
    if (!isBirthdayWithinDays(birthMonth, birthDay, r.daysBefore)) continue;

    const existing = await db.notification.findFirst({
      where: {
        userId: r.ownerId,
        type: "birthday_reminder",
        body: { contains: name },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) continue;

    await notifyUser({
      userId: r.ownerId,
      type: "birthday_reminder",
      title: "Birthday coming up!",
      body: `${name}'s birthday is in ${r.daysBefore} day(s). Time to plan a gift!`,
      link: r.groupId ? `/groups/${r.groupId}` : "/people",
    });
    sent++;
  }

  for (const r of contactReminders) {
    if (!isBirthdayWithinDays(r.birthMonth, r.birthDay, r.daysBefore)) continue;

    const existing = await db.notification.findFirst({
      where: {
        userId: r.ownerId,
        type: "birthday_reminder",
        body: { contains: r.name },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) continue;

    await notifyUser({
      userId: r.ownerId,
      type: "birthday_reminder",
      title: "Birthday coming up!",
      body: `${r.name}'s birthday is in ${r.daysBefore} day(s). Time to plan a gift!`,
      link: "/people",
    });
    sent++;
  }

  return jsonOk({ sent });
}
