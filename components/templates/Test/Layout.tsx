
import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Company } from '@/types';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  company: Company;
}

const Layout: React.FC<LayoutProps> = ({ children, title, description, company }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header company={company} />
        <main className="flex-grow">
          {children}
        </main>
        <Footer company={company} />
      </div>
    </>
  );
};

export default Layout;
