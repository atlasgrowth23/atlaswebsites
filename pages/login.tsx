// pages/login.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { portalDb } from "../lib/portalDb";

interface Props {
  slug: string;
  username: string;
  password: string;
}

export default function LoginAuto({ slug, username, password }: Props) {
  return (
    <>
      <Head><title>Logging you in…</title></Head>
      <form
        id="autoForm"
        method="POST"
        action="/api/auth/login"
        style={{ display: "none" }}
      >
        <input name="slug" value={slug} readOnly />
        <input name="username" value={username} readOnly />
        <input name="password" value={password} readOnly />
      </form>
      <p style={{ textAlign: "center", marginTop: "3rem" }}>
        Redirecting to your portal…
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById("autoForm").submit();`
        }}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const slug = query.slug as string;
  if (!slug) return { notFound: true };

  const preview = await portalDb.getPreviewUser(slug);
  if (!preview) return { notFound: true };

  // For security, we only include password from the query parameter
  // and never store it in our server-side code
  const password = query.pwd as string || ""; 
  
  return { props: { slug, username: preview.username, password } };
};