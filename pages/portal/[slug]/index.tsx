// pages/portal/[slug]/index.tsx
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import crypto from "crypto";
import { db } from "../../../lib/replitDb";

interface Props { companyName: string; slug: string; }

export default function Portal({ companyName }: Props) {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 40 }}>
      <h1>🏠 {companyName} – Dashboard Portal</h1>
      <p>✅ You are authenticated. Welcome to your HVAC business dashboard.</p>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
  const slug = params!.slug as string;
  const session = parse(req.headers.cookie || "").session || "";
  const [val, sig] = Buffer.from(session, "base64").toString().split(".");
  const good =
    val === slug &&
    crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(val)
      .digest("hex") === sig;

  if (!good) {
    return { redirect: { destination: `/login?slug=${slug}`, permanent: false } };
  }

  const company = await db.get<{ name: string }>(`company:${slug}`);
  return { props: { companyName: company?.name || slug, slug } };
};