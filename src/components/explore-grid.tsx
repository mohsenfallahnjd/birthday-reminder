"use client";

import { useState } from "react";
import { UserAvatar } from "./user-avatar";
import { Button } from "./ui/button";
import { Icon } from "./icon";
import { Input } from "./ui/input";
import Link from "next/link";
import { formatJalaliBirthday } from "@/lib/jalali";

type ExploreUser = {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	birthMonth: number | null;
	birthDay: number | null;
	birthYear: number | null;
	isFriend: boolean;
	groupCount: number;
	ceremonyCount: number;
};

type Props = {
	users: ExploreUser[];
	currentUserId: string;
};

export function ExploreGrid({ users: initialUsers, currentUserId }: Props) {
	const [users, setUsers] = useState(initialUsers);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);

	const filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(search.toLowerCase()) ||
			user.email.toLowerCase().includes(search.toLowerCase()),
	);

	const handleAddFriend = async (userId: string) => {
		try {
			setLoading(true);
			const response = await fetch("/api/people", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ friendEmail: users.find((u) => u.id === userId)?.email }),
			});

			const data = await response.json();

			if (data.error) {
				alert(data.error);
			} else {
				// Update the user's friend status
				setUsers(
					users.map((u) => (u.id === userId ? { ...u, isFriend: true } : u)),
				);
			}
		} catch (error) {
			alert("Failed to send friend request");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="relative">
				<Icon
					name="search"
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
				/>
				<Input
					type="search"
					placeholder="Search by name or email..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-10"
				/>
			</div>

			{filteredUsers.length === 0 ? (
				<div className="text-center py-12 text-muted">
					<Icon name="users" className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<p>No people found</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredUsers.map((user) => (
						<Link
							key={user.id}
							href={`/person/${user.id}`}
							className="block group"
						>
							<div className="bg-white border border-border rounded-xl p-6 transition-all hover:shadow-md hover:border-accent">
								<div className="flex items-start justify-between mb-4">
									<UserAvatar
										name={user.name}
										avatarUrl={user.avatarUrl}
										size="xl"
									/>
									{user.isFriend && (
										<div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
											<Icon name="heart" className="w-3 h-3" />
											<span>Friend</span>
										</div>
									)}
								</div>

								<h3 className="font-semibold text-lg mb-1 group-hover:text-accent transition-colors">
									{user.name}
								</h3>

								{user.birthMonth && user.birthDay && (
									<p className="text-sm text-muted mb-3">
										<Icon
											name="cake"
											className="w-4 h-4 inline mr-1 -mt-0.5"
										/>
										{formatJalaliBirthday(
											user.birthMonth,
											user.birthDay,
											user.birthYear,
										)}
									</p>
								)}

								<div className="flex items-center gap-4 text-xs text-muted mb-4">
									<div className="flex items-center gap-1">
										<Icon name="users" className="w-3.5 h-3.5" />
										<span>{user.groupCount} groups</span>
									</div>
									<div className="flex items-center gap-1">
										<Icon name="party" className="w-3.5 h-3.5" />
										<span>{user.ceremonyCount} parties</span>
									</div>
								</div>

								{!user.isFriend && (
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={(e) => {
											e.preventDefault();
											handleAddFriend(user.id);
										}}
										disabled={loading}
									>
										<Icon name="user-plus" className="w-4 h-4 mr-2" />
										Add Friend
									</Button>
								)}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
