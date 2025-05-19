// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import { portalDb } from "../../../lib/portalDb";
import { serialize } from "cookie";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Parse JSON body for fetch requests or form data for form submissions
  let body = req.body;
  
  // Handle both JSON and form data submissions
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // Not JSON, might be URL encoded form data
      console.log('Login request body is not JSON:', body);
    }
  }

  console.log('Login attempt with body:', body);

  // Extract the slug - the only thing we really need for our simplified preview login
  const { slug } = body as { slug: string; username?: string; password?: string };

  if (!slug) {
    console.log('Missing slug');
    return res.status(400).send("Missing company ID");
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

  // For preview accounts, we'll auto-authenticate based on the slug only
  // This simplifies the login process for prospects
  console.log(`Auto-authenticating preview account for: ${slug}`);
  
  // Normal production code would verify the password here

  console.log(`Successful login for ${slug}`);

  // Sign simple session value (=slug) with HMAC
  const token = Buffer.from(
    `${slug}.${crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(slug)
      .digest("hex")}`
  ).toString("base64");

  // Set the cookie with more specific settings to ensure it's saved properly
  res.setHeader(
    "Set-Cookie",
    serialize("session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 14 * 24 * 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    })
  );
  
  // Add some debugging info
  console.log(`Setting cookie and redirecting to /portal/${slug}`);
  
  // Redirect to the portal with full URL
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = req.headers.host || "localhost:5000";
  res.redirect(302, `${protocol}://${host}/portal/${slug}`);
}