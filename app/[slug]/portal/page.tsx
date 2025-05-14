import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function PortalPage({ params }: PageProps) {
  // Redirect to the messages page by default
  redirect(`/${params.slug}/portal/messages`);
}