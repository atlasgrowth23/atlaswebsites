import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import { hexToHsl } from '@/lib/utils';
import { getContrastColor, generatePalette } from '@/lib/colors';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  company?: Company;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'HVAC Services | Professional Heating and Cooling',
  description = 'Professional HVAC services including installation, maintenance, and repair for residential and commercial properties.',
  company,
}) => {
  // Create CSS variables for company colors with fallbacks
  const style: Record<string, string> = {};

  // Set default colors
  const primaryColor = company?.primary_color || "#2563EB";
  const secondaryColor = company?.secondary_color || "#DC2626";

  // Calculate HSL values for CSS variables
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);

  // Calculate contrast colors for text on primary/secondary backgrounds
  const onPrimary = getContrastColor(primaryColor);
  const onSecondary = getContrastColor(secondaryColor);

  // Set CSS variables
  style['--primary'] = primaryHsl;
  style['--secondary'] = secondaryHsl;
  style['--on-primary'] = onPrimary;
  style['--on-secondary'] = onSecondary;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* Google Font - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen flex flex-col" style={style}>
        {children}
      </div>
    </>
  );
};

export default Layout;