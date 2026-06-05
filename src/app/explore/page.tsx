import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app-section";
import { ExploreGrid } from "@/components/explore-grid";

export const metadata = {
	title: "Explore People",
	description: "Discover and connect with people",
};

export default async function ExplorePage() {
	const user = await requireUserOrThrow();

	// Fetch all users except the current user
	const users = await db.user.findMany({
		where: {
			id: {
				not: user.id,
			},
		},
		select: {
			id: true,
			name: true,
			email: true,
			avatarUrl: true,
			birthMonth: true,
			birthDay: true,
			birthYear: true,
			_count: {
				select: {
					memberships: true,
					birthdayCeremonies: true,
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});

	// Get current user's friend IDs
	const friendships = await db.friendship.findMany({
		where: {
			OR: [{ userId: user.id }, { friendId: user.id }],
			status: "ACCEPTED",
		},
		select: {
			userId: true,
			friendId: true,
		},
	});

	const friendIds = new Set(
		friendships.map((f) => (f.userId === user.id ? f.friendId : f.userId)),
	);

	// Add friendship status to each user
	const usersWithStatus = users.map((u) => ({
		...u,
		isFriend: friendIds.has(u.id),
		groupCount: u._count.memberships,
		ceremonyCount: u._count.birthdayCeremonies,
	}));

	return (
		<div className="page">
			<PageHeader
				title="Explore People"
				description="Discover and connect with people in the community"
			/>

			<ExploreGrid users={usersWithStatus} currentUserId={user.id} />
		</div>
	);
}
