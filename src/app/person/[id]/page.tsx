import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { Icon } from "@/components/icon";
import { formatJalaliBirthday } from "@/lib/jalali";
import { PersonActions } from "./person-actions";
import Link from "next/link";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const person = await db.user.findUnique({ where: { id }, select: { name: true } });
	return { title: person?.name ?? "Person" };
}

export default async function PersonPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const currentUser = await requireUserOrThrow();
	const { id } = await params;

	const person = await db.user.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			email: true,
			avatarUrl: true,
			birthMonth: true,
			birthDay: true,
			birthYear: true,
			createdAt: true,
			_count: {
				select: {
					memberships: true,
					birthdayCeremonies: true,
				},
			},
			wishlistItems: {
				where: { ceremonyId: null },
				select: { id: true, title: true, link: true, ogImage: true, ogDescription: true, cost: true },
				orderBy: { createdAt: "desc" },
			},
			memberships: {
				select: { group: { select: { id: true, name: true } } },
			},
		},
	});

	if (!person) notFound();

	// Friendship status
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

	// Mutual groups
	const currentUserGroups = await db.groupMember.findMany({
		where: { userId: currentUser.id },
		select: { groupId: true },
	});
	const currentUserGroupIds = new Set(currentUserGroups.map((m) => m.groupId));
	const mutualGroups = person.memberships
		.filter((m) => currentUserGroupIds.has(m.group.id))
		.map((m) => m.group);

	return (
		<div className="page max-w-2xl mx-auto">
			{/* Back */}
			<div className="mb-6">
				<Link
					href="/explore"
					className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
				>
					<Icon name="chevron-left" className="w-4 h-4" />
					Back to Explore
				</Link>
			</div>

			{/* Hero card */}
			<div className="bg-white border border-border rounded-2xl p-8 mb-6 text-center shadow-sm">
				<div className="flex justify-center mb-4">
					<UserAvatar
						name={person.name}
						avatarUrl={person.avatarUrl}
						size="xl"
					/>
				</div>
				<h1 className="text-2xl font-bold mb-1">{person.name}</h1>
				<p className="text-sm text-muted mb-4">{person.email}</p>

				{/* Birthday */}
				{person.birthMonth && person.birthDay && (
					<div className="inline-flex items-center gap-1.5 text-sm bg-accent/10 text-accent px-3 py-1.5 rounded-full mb-4">
						<Icon name="cake" className="w-4 h-4" />
						{formatJalaliBirthday(
							person.birthMonth,
							person.birthDay,
							person.birthYear,
						)}
					</div>
				)}

				{/* Stats row */}
				<div className="flex justify-center gap-6 text-sm mb-6">
					<div className="text-center">
						<p className="font-semibold text-lg">{person._count.memberships}</p>
						<p className="text-muted text-xs">Groups</p>
					</div>
					<div className="w-px bg-border" />
					<div className="text-center">
						<p className="font-semibold text-lg">{person._count.birthdayCeremonies}</p>
						<p className="text-muted text-xs">Parties</p>
					</div>
					{mutualGroups.length > 0 && (
						<>
							<div className="w-px bg-border" />
							<div className="text-center">
								<p className="font-semibold text-lg">{mutualGroups.length}</p>
								<p className="text-muted text-xs">Mutual Groups</p>
							</div>
						</>
					)}
				</div>

				{/* Friendship action */}
				<PersonActions
					personId={person.id}
					personEmail={person.email}
					isFriend={isFriend}
					isPending={isPending}
					pendingDirection={pendingDirection}
					friendshipId={friendship?.id ?? null}
				/>
			</div>

			{/* Mutual groups */}
			{mutualGroups.length > 0 && (
				<section className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
					<h2 className="font-semibold mb-3 flex items-center gap-2">
						<Icon name="users" className="w-4 h-4 text-accent" />
						Mutual Groups
					</h2>
					<div className="flex flex-wrap gap-2">
						{mutualGroups.map((g) => (
							<Link
								key={g.id}
								href={`/groups/${g.id}`}
								className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full hover:bg-accent/20 transition-colors"
							>
								{g.name}
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Wishlist (only visible to friends) */}
			{isFriend && (
				<section className="bg-white border border-border rounded-2xl p-6 shadow-sm">
					<h2 className="font-semibold mb-3 flex items-center gap-2">
						<Icon name="gift" className="w-4 h-4 text-accent" />
						Wishlist
					</h2>
					{person.wishlistItems.length === 0 ? (
						<p className="text-sm text-muted">No wishlist items yet.</p>
					) : (
						<ul className="space-y-3">
							{person.wishlistItems.map((item) => (
								<li
									key={item.id}
									className="flex items-center gap-3 p-3 rounded-xl border border-border hover:shadow-sm transition-shadow"
								>
									{item.ogImage && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={item.ogImage}
											alt={item.title}
											className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-border"
											onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
										/>
									)}
									<div className="flex-1 min-w-0">
										{item.link ? (
											<a
												href={item.link}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-medium hover:text-accent transition-colors line-clamp-1 block"
											>
												{item.title}
											</a>
										) : (
											<p className="text-sm font-medium line-clamp-1">{item.title}</p>
										)}
										{item.ogDescription && (
											<p className="text-xs text-muted line-clamp-1 mt-0.5">{item.ogDescription}</p>
										)}
									</div>
									{item.cost > 0 && (
										<span className="flex-shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
											{item.cost.toLocaleString()} T
										</span>
									)}
								</li>
							))}
						</ul>
					)}
				</section>
			)}

			{!isFriend && (
				<p className="text-center text-sm text-muted py-4">
					<Icon name="lock" className="w-4 h-4 inline mr-1 -mt-0.5" />
					Add {person.name} as a friend to see their wishlist.
				</p>
			)}
		</div>
	);
}
