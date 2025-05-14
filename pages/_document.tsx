import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* Template view tracking script */}
        <script src="/js/template-tracker.js" async defer />
      </body>
    </Html>
  );
}