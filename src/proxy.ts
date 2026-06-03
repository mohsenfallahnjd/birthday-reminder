import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const COOKIE = "birthday_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-in-production",
);

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/wishlist",
  "/groups",
  "/people",
  "/notifications",
  "/ceremonies",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    const next = `${pathname}${request.nextUrl.search}`;
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/wishlist",
    "/groups",
    "/groups/:path*",
    "/people",
    "/notifications",
    "/ceremonies",
    "/ceremonies/:path*",
  ],
};
