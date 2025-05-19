// scripts/seedPreview.ts
import { db } from "../lib/replitDb";
import bcrypt from "bcryptjs";
import fs from "fs";
import { randomUUID } from "crypto";

interface Company { slug: string; name: string; /* … */ }

const companies: Company[] = JSON.parse(
  fs.readFileSync("./data/companies.json", "utf8")
);

(async () => {
  const lines: string[] = ["slug,username,password"];
  for (const c of companies) {
    const username = `${c.slug}-preview`;
    const password = randomUUID().slice(0, 8); // 8-char throw-away
    const passwordHash = await bcrypt.hash(password, 10);

    await db.set(`company:${c.slug}`, c);
    await db.set(`previewUser:${c.slug}`, {
      username,
      passwordHash,
      expires: Date.now() + 14 * 24 * 3600 * 1000 // 14 days
    });

    lines.push(`${c.slug},${username},${password}`);
  }
  fs.writeFileSync("./preview_creds.csv", lines.join("\n"));
  console.log("✅ seeded preview users -> preview_creds.csv");
})();