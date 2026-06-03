import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  const notification = await db.notification.create({ data: params });

  sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    url: params.link,
  }).catch(() => {});

  return notification;
}

export async function notifyMany(
  userIds: string[],
  params: Omit<Parameters<typeof notifyUser>[0], "userId">,
) {
  const unique = [...new Set(userIds)];
  await db.notification.createMany({
    data: unique.map((userId) => ({ userId, ...params })),
  });

  await Promise.all(
    unique.map((userId) =>
      sendPushToUser(userId, {
        title: params.title,
        body: params.body,
        url: params.link,
      }).catch(() => {}),
    ),
  );
}
