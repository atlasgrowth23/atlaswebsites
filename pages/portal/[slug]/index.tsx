// pages/portal/[slug]/index.tsx
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import crypto from "crypto";
import { portalDb } from "../../../lib/portalDb";

interface Props { 
  companyName: string; 
  slug: string;
  companyData: any;
}

export default function Portal({ companyName, companyData }: Props) {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 40 }}>
      <h1>🏠 {companyName} – Dashboard Portal</h1>
      <p>✅ You are authenticated. Welcome to your HVAC business dashboard.</p>
      
      <div style={{ marginTop: 40 }}>
        <h2>Company Information</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><strong>Location:</strong> {companyData.city}, {companyData.state}</li>
          <li><strong>Phone:</strong> {companyData.phone || 'N/A'}</li>
          <li><strong>Rating:</strong> {companyData.rating} ({companyData.reviews} reviews)</li>
          <li><strong>Website:</strong> {companyData.site || 'N/A'}</li>
        </ul>
      </div>
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

  const company = await portalDb.getCompany(slug);
  if (!company) {
    return { notFound: true };
  }
  
  return { 
    props: { 
      companyName: company.name || slug, 
      slug,
      companyData: {
        city: company.city || 'N/A',
        state: company.state || 'N/A',
        phone: company.phone || 'N/A',
        rating: company.rating || 0,
        reviews: company.reviews || 0,
        site: company.site || ''
      }
    } 
  };
};