// pages/login.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { db } from "../lib/replitDb";

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

  const preview = await db.get<{ username: string; passwordHash: string }>(
    `previewUser:${slug}`
  );
  if (!preview) return { notFound: true };

  // For actual use, replace this with password: query.pwd
  const password = query.pwd as string || ""; 
  
  return { props: { slug, username: preview.username, password } };
};