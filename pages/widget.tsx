import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Widget from '@/components/widget/Widget';

export default function WidgetPage() {
  const router = useRouter();
  const { company, primary, accent } = router.query;

  // Default colors if not provided
  const primaryColor = (primary as string) || '#0066FF';
  const accentColor = (accent as string) || '#F6AD55';
  const companySlug = (company as string) || '';

  return (
    <>
      <Head>
        <title>HVAC Lead Widget</title>
        <meta name="robots" content="noindex" />
        <style>{`
          :root {
            --widget-primary: ${primaryColor};
            --widget-accent: ${accentColor};
          }
          
          html, body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: transparent;
          }
          
          #widget-container {
            padding: 0;
            width: 100%;
            height: 100%;
            min-height: 400px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
        `}</style>
      </Head>
      
      <div id="widget-container">
        <Widget 
          companySlug={companySlug} 
          primaryColor={primaryColor} 
          accentColor={accentColor} 
        />
      </div>
    </>
  );
}