"use client";

import { useState } from "react";
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
	friendshipId: _friendshipId,
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
			<div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm">
				<span className="text-base">🤝</span>
				Friends
			</div>
		);
	}

	if (isPending && direction === "sent") {
		return (
			<div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-muted-subtle px-4 py-2.5 text-sm font-medium text-muted shadow-sm">
				<Icon name="clock" className="w-4 h-4" />
				Request sent · waiting
			</div>
		);
	}

	if (isPending && direction === "received") {
		return (
			<button
				type="button"
				onClick={handleAccept}
				disabled={loading}
				className="inline-flex items-center gap-2 rounded-2xl border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
			>
				<Icon name="user-plus" className="w-4 h-4" />
				{loading ? "Accepting…" : "Accept friend request"}
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={handleAddFriend}
			disabled={loading}
			className="inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/8 px-5 py-2.5 text-sm font-semibold text-accent shadow-sm transition-colors hover:bg-accent/15 disabled:opacity-50"
		>
			<Icon name="user-plus" className="w-4 h-4" />
			{loading ? "Sending…" : "Add friend"}
		</button>
	);
}
