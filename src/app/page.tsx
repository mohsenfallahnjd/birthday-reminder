import { Link } from "@/components/link";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="page">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">
        Birthdays · Wishlists · Group gifts
      </p>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Remember every birthday.
        <br />
        Split gifts simply.
      </h1>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Jalali dates, friend groups, wishlists with prices, and a treasurer who approves
        payments. Pay any amount you can.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {session ? (
          <Link href="/dashboard" variant="button">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/register" variant="button">
              Get started
            </Link>
            <Link href="/login" variant="ghost">
              Log in
            </Link>
          </>
        )}
      </div>

      <ul className="mt-16 divide-y divide-border border-t border-border">
        {[
          ["Jalali calendar", "Persian date picker for reminders"],
          ["Groups & friends", "Invite by code or email"],
          ["Wishlist & pooling", "Links, prices, proof, treasurer approval"],
        ].map(([title, desc]) => (
          <li key={title} className="py-4">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-0.5 text-sm text-muted">{desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
