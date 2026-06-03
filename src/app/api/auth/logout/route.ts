import { destroySession } from "@/lib/auth";
import { NextResponse } from "next/server";

async function logout(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}

export async function POST(request: Request) {
  return logout(request);
}

export async function GET(request: Request) {
  return logout(request);
}
