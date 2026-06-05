"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { useRouter } from "@/lib/navigation";

type Props = {
	personId: string;
	personEmail: string;
	isFriend: boolean;
	isPending: boolean;
	pendingDirection: "sent" | "received" | null;
	friendshipId: string | null;
};

export function PersonActions({
	personId,
	personEmail,
	isFriend: initialIsFriend,
	isPending: initialIsPending,
	pendingDirection: initialDirection,
	friendshipId,
}: Props) {
	const router = useRouter();
	const [isFriend, setIsFriend] = useState(initialIsFriend);
	const [isPending, setIsPending] = useState(initialIsPending);
	const [direction, setDirection] = useState(initialDirection);
	const [loading, setLoading] = useState(false);

	async function handleAddFriend() {
		try {
			setLoading(true);
			const res = await fetch("/api/people", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ friendEmail: personEmail }),
			});
			const data = await res.json();
			if (data.error) {
				alert(data.error);
			} else {
				setIsPending(true);
				setDirection("sent");
			}
		} catch {
			alert("Failed to send friend request");
		} finally {
			setLoading(false);
		}
	}

	async function handleAccept() {
		try {
			setLoading(true);
			const res = await fetch("/api/people/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ friendId: personId }),
			});
			const data = await res.json();
			if (data.error) {
				alert(data.error);
			} else {
				setIsFriend(true);
				setIsPending(false);
				setDirection(null);
				router.refresh();
			}
		} catch {
			alert("Failed to accept request");
		} finally {
			setLoading(false);
		}
	}

	if (isFriend) {
		return (
			<div className="inline-flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-medium">
				<Icon name="heart" className="w-4 h-4" />
				Friends
			</div>
		);
	}

	if (isPending && direction === "sent") {
		return (
			<div className="inline-flex items-center gap-2 text-sm text-muted bg-muted-subtle px-4 py-2 rounded-full">
				<Icon name="clock" className="w-4 h-4" />
				Friend request sent
			</div>
		);
	}

	if (isPending && direction === "received") {
		return (
			<Button onClick={handleAccept} loading={loading} loadingText="Accepting…">
				<Icon name="user-plus" className="w-4 h-4 mr-2" />
				Accept Friend Request
			</Button>
		);
	}

	return (
		<Button onClick={handleAddFriend} loading={loading} loadingText="Sending…">
			<Icon name="user-plus" className="w-4 h-4 mr-2" />
			Add Friend
		</Button>
	);
}
