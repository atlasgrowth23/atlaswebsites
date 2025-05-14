import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* Template view tracking script */}
        <script src="/js/template-tracker.js" async defer />
      </body>
    </Html>
  );
}