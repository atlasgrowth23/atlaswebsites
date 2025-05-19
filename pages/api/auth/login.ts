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

  console.log('Login attempt:', { slug: body.slug });

  const { slug, username, password } = body as {
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
    return res.status(401).send("Invalid password");
  }

  console.log(`Successful login for ${slug}`);

  // Sign simple session value (=slug) with HMAC
  const token = Buffer.from(
    `${slug}.${crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(slug)
      .digest("hex")}`
  ).toString("base64");

  // Set the cookie
  res.setHeader(
    "Set-Cookie",
    serialize("session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 14 * 24 * 3600,
      sameSite: "lax"
    })
  );
  
  // Redirect to the portal
  res.redirect(302, `/portal/${slug}`);
}