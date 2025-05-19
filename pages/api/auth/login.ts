// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import { portalDb } from "../../../lib/portalDb";
import { serialize } from "cookie";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Log the entire request body for debugging
  console.log('Login attempt with body:', req.body);

  const { slug, username, password } = req.body as {
    slug: string; username: string; password: string;
  };

  if (!slug || !password) {
    console.log('Missing slug or password');
    return res.status(400).send("Missing required fields");
  }

  // Get the preview user
  const preview = await portalDb.getPreviewUser(slug);
  if (!preview) {
    console.log(`No preview user found for slug: ${slug}`);
    return res.status(404).send("Company not found");
  }

  if (new Date() > new Date(preview.expires_at)) {
    console.log(`Preview expired for slug: ${slug}`);
    return res.status(403).send("Preview expired");
  }

  // Verify the password
  const isValid = await portalDb.verifyCredentials(slug, password);
  if (!isValid) {
    console.log(`Invalid credentials for slug: ${slug}`);
    return res.status(401).send("Bad credentials");
  }

  console.log(`Successful login for ${slug}`);

  // Sign simple session value (=slug) with HMAC
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