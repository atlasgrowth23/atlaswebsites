// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import { portalDb } from "../../../lib/portalDb";
import bcrypt from "bcryptjs";
import { serialize } from "cookie";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { slug, username, password } = req.body as {
    slug: string; username: string; password: string;
  };

  const preview = await portalDb.getPreviewUser(slug);

  if (!preview || new Date() > new Date(preview.expires_at))
    return res.status(403).send("Preview expired");

  const ok =
    username === preview.username &&
    (await bcrypt.compare(password, preview.password_hash));

  if (!ok) return res.status(401).send("Bad credentials");

  // sign simple session value (=slug) with HMAC
  const token = Buffer.from(
    `${slug}.${crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(slug)
      .digest("hex")}`
  ).toString("base64");

  res.setHeader(
    "Set-Cookie",
    serialize("session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 14 * 24 * 3600
    })
  );
  res.redirect(`/portal/${slug}`);
}