// scripts/seedPreview.ts
import { portalDb } from "../lib/portalDb";
import { queryMany } from "../lib/db";
import bcrypt from "bcryptjs";
import fs from "fs";
import { randomUUID } from "crypto";

interface Company { 
  id: string; 
  name: string; 
  slug: string;
  // other fields
}

(async () => {
  // Get companies directly from the database
  console.log("Getting companies from database...");
  const companies = await queryMany('SELECT * FROM companies WHERE slug IS NOT NULL');
  console.log(`Found ${companies.length} companies with slugs.`);
  
  const lines: string[] = ["slug,username,password"];
  for (const c of companies) {
    const username = `${c.slug}-preview`;
    const password = randomUUID().slice(0, 8); // 8-char throw-away
    const passwordHash = await bcrypt.hash(password, 10);

    await portalDb.setPreviewUser(c.slug, {
      username,
      passwordHash,
      expires: Date.now() + 14 * 24 * 3600 * 1000 // 14 days
    });

    lines.push(`${c.slug},${username},${password}`);
  }
  fs.writeFileSync("./preview_creds.csv", lines.join("\n"));
  console.log("✅ seeded preview users -> preview_creds.csv");
  
  process.exit(0);
})().catch(error => {
  console.error("Error seeding preview users:", error);
  process.exit(1);
});