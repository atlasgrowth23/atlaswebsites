// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import crypto from "crypto";

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/portal")) return;

  const slug = req.nextUrl.pathname.split("/")[2] || "";
  const session = parse(req.headers.get("cookie") || "").session || "";

  const [val, sig] = Buffer.from(session, "base64").toString().split(".");
  const good =
    val === slug &&
    crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(val)
      .digest("hex") === sig;

  if (!good) {
    return NextResponse.redirect(
      new URL(`/login?slug=${slug}`, req.nextUrl.origin)
    );
  }
}