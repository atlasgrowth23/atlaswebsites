import React from 'react';
import Head from 'next/head';
import { Company } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  company?: Company;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  description,
  company 
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {company && (
          <>
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:locale" content="en_US" />
          </>
        )}
      </Head>
      <main>{children}</main>
    </>
  );
};

export default Layout;