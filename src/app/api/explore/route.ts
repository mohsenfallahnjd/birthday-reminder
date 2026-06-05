import { requireUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const user = await requireUserOrThrow();

		// Get search query from URL params
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q")?.toLowerCase() || "";

		// Fetch all users except the current user
		const users = await db.user.findMany({
			where: {
				id: {
					not: user.id,
				},
				...(query
					? {
							OR: [
								{ name: { contains: query, mode: "insensitive" } },
								{ email: { contains: query, mode: "insensitive" } },
							],
						}
					: {}),
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

		return jsonOk({ users: usersWithStatus });
	} catch (error) {
		console.error("Explore API error:", error);
		return jsonError("Failed to fetch users");
	}
}
