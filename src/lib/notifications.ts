import { db } from "@/lib/db";

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  return db.notification.create({ data: params });
}

export async function notifyMany(
  userIds: string[],
  params: Omit<Parameters<typeof notifyUser>[0], "userId">,
) {
  const unique = [...new Set(userIds)];
  await db.notification.createMany({
    data: unique.map((userId) => ({ userId, ...params })),
  });
}
