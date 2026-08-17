import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runPoll } from "@/lib/poll";

function isAuthorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.cronSecret}`;

  const headerBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);
  if (headerBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(headerBuf, expectedBuf);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPoll();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[/api/poll] unhandled error", err);
    return NextResponse.json(
      { error: "Internal error running poll", detail: String(err) },
      { status: 500 }
    );
  }
}
