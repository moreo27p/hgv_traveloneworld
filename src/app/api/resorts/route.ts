import { NextResponse } from "next/server";
import { fetchResorts } from "@/lib/resorts";

export async function GET() {
  try {
    const { resorts, source } = await fetchResorts();
    return NextResponse.json({ ok: true, resorts, source });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg, resorts: [] }, { status: 500 });
  }
}
