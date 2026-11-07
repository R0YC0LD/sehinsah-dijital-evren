import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { readClickStats } from "@/lib/concerts/clicks";
import { readSyncStatus } from "@/lib/concerts/source";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [stats, sync] = await Promise.all([readClickStats(), readSyncStatus().catch(() => null)]);
  return NextResponse.json({ ...stats, sync });
}
