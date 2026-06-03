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
      title: "تولد نزدیک است!",
      body: `تا ${r.daysBefore} روز دیگر تولد ${name} است. وقت هدیه و جشن است!`,
      link: r.groupId ? `/groups/${r.groupId}` : "/people",
    });
    sent++;
  }

  return jsonOk({ sent });
}
