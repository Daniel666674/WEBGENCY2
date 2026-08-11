import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireApi();
  if (denied) return denied;

  try {
    const rows = await db.select().from(users).orderBy(asc(users.createdAt));
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
