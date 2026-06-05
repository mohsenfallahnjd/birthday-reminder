import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import type { NextRequest } from "next/server";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
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
					select: {
						id: true,
						title: true,
						link: true,
						cost: true,
					},
					orderBy: { createdAt: "desc" },
				},
				memberships: {
					select: {
						group: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!person) return jsonError("Person not found", 404);

		// Friendship status
		const friendship = await db.friendship.findFirst({
			where: {
				OR: [
					{ userId: currentUser.id, friendId: id },
					{ userId: id, friendId: currentUser.id },
				],
			},
			select: { status: true, userId: true },
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
		const currentUserGroupIds = new Set(
			currentUserGroups.map((m) => m.groupId),
		);
		const mutualGroups = person.memberships
			.filter((m) => currentUserGroupIds.has(m.group.id))
			.map((m) => m.group);

		return jsonOk({
			person: {
				id: person.id,
				name: person.name,
				email: person.email,
				avatarUrl: person.avatarUrl,
				birthMonth: person.birthMonth,
				birthDay: person.birthDay,
				birthYear: person.birthYear,
				createdAt: person.createdAt,
				groupCount: person._count.memberships,
				ceremonyCount: person._count.birthdayCeremonies,
				wishlistItems: isFriend ? person.wishlistItems : [],
				mutualGroups,
				isFriend,
				isPending,
				pendingDirection,
			},
		});
	} catch (error) {
		console.error("Person API error:", error);
		return jsonError("Failed to fetch person");
	}
}
