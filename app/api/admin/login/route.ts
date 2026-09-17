import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, checkCredentials } from "@/lib/admin/auth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (await isRateLimited(`admin-login:${clientIp(request)}`, 5, 300)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { username, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !checkCredentials(username, password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
