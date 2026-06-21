import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { formatJalaliBirthday } from "@/lib/jalali";
import { getCurrency } from "@/lib/currency";
import { MoneyDisplay } from "@/components/money-display";
import { PersonActions } from "./person-actions";
import Link from "next/link";

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await db.user.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: person?.name ?? "Person" };
}

export default async function PersonPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUserOrThrow();
  const { id } = await params;
  const currency = await getCurrency();

  const person = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      isSuperAdmin: true,
      avatarUrl: true,
      birthMonth: true,
      birthDay: true,
      birthYear: true,
      createdAt: true,
      _count: { select: { memberships: true, birthdayCeremonies: true } },
      wishlistItems: {
        where: { ceremonyId: null },
        select: {
          id: true,
          title: true,
          link: true,
          ogImage: true,
          ogDescription: true,
          cost: true,
        },
        orderBy: { createdAt: "desc" },
      },
      memberships: { select: { group: { select: { id: true, name: true } } } },
    },
  });

  if (!person) notFound();

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { userId: currentUser.id, friendId: id },
        { userId: id, friendId: currentUser.id },
      ],
    },
    select: { status: true, userId: true, id: true },
  });

  const isFriend = friendship?.status === "ACCEPTED";
  const isPending = friendship?.status === "PENDING";
  const pendingDirection =
    isPending && friendship
      ? friendship.userId === currentUser.id
        ? "sent"
        : "received"
      : null;

  const currentUserGroups = await db.groupMember.findMany({
    where: { userId: currentUser.id },
    select: { groupId: true },
  });
  const currentUserGroupIds = new Set(currentUserGroups.map((m) => m.groupId));
  const mutualGroups = person.memberships
    .filter((m) => currentUserGroupIds.has(m.group.id))
    .map((m) => m.group);

  const firstName = person.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-white pb-6 pt-10">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-accent/8 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-pink-300/10 blur-2xl"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-pink-400 to-accent/60"
          aria-hidden
        />

        <div className="relative mx-auto max-w-lg px-5">
          {/* Back */}
          <Link
            href="/people"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted no-underline transition-colors hover:text-foreground"
          >
            <Icon name="chevron-left" size={14} />
            People
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <UserAvatar
                name={person.name}
                avatarUrl={person.avatarUrl}
                size="xl"
                accentColor="#4f46e5"
              />
              {person.isSuperAdmin && (
                <>
                  <style>{"@keyframes crownBob{0%,100%{transform:translateX(-50%) translateY(0) rotate(-5deg)}50%{transform:translateX(-50%) translateY(-4px) rotate(5deg)}}"}</style>
                  <span className="absolute -top-4 left-1/2 select-none text-2xl" style={{ animation: "crownBob 2s ease-in-out infinite" }}>👑</span>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold leading-tight text-foreground">
                {person.name}
              </h1>
              {person.isSuperAdmin && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200 shrink-0">Creator</span>
              )}
              </div>
              {person.birthMonth && person.birthDay && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="cake" size={13} className="shrink-0 opacity-60" />
                  {formatJalaliBirthday(
                    person.birthMonth,
                    person.birthDay,
                    person.birthYear ?? undefined,
                  )}
                </p>
              )}

              {/* stat chips */}
              <div className="mt-2 flex flex-wrap gap-2">
                {person._count.birthdayCeremonies > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    <Icon name="party" size={11} className="text-current" />
                    {person._count.birthdayCeremonies} part
                    {person._count.birthdayCeremonies !== 1 ? "ies" : "y"}
                  </span>
                )}
                {mutualGroups.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Icon name="users" size={11} className="text-current" />
                    {mutualGroups.length} mutual group
                    {mutualGroups.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Friendship action */}
          {currentUser.id !== person.id && (
            <div className="mt-5">
              <PersonActions
                personId={person.id}
                personEmail={person.email}
                isFriend={isFriend}
                isPending={isPending}
                pendingDirection={pendingDirection}
                friendshipId={friendship?.id ?? null}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-5 pb-20 pt-5">
        {/* Mutual groups */}
        {mutualGroups.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon name="users" size={14} className="text-accent" />
              Mutual groups
            </h2>
            <div className="flex flex-wrap gap-2">
              {mutualGroups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent no-underline transition-colors hover:bg-accent/20"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Wishlist */}
        {(isFriend || currentUser.id === person.id) ? (
          <section className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon name="gift" size={14} className="text-accent" />
                {firstName}&apos;s wishlist
              </h2>
              {person.wishlistItems.length > 0 && (
                <span className="rounded-full bg-muted-subtle px-2.5 py-0.5 text-xs font-medium text-muted">
                  {person.wishlistItems.length} item
                  {person.wishlistItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {person.wishlistItems.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-3xl mb-2">🎁</p>
                <p className="text-sm text-muted">
                  {firstName} hasn&apos;t added any gifts yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {person.wishlistItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    {item.ogImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.ogImage}
                        alt={item.title}
                        className="h-12 w-12 flex-shrink-0 rounded-xl border border-border object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm font-medium text-foreground no-underline line-clamp-1 hover:text-accent transition-colors"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {item.title}
                        </p>
                      )}
                      {item.ogDescription && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                          {item.ogDescription}
                        </p>
                      )}
                    </div>
                    {item.cost > 0 && (
                      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                        <MoneyDisplay amount={item.cost} currency={currency} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted-subtle">
              <Icon name="lock" size={20} className="text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Wishlist is private
            </p>
            <p className="mt-1 text-xs text-muted">
              Add {firstName} as a friend to see their wishlist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
