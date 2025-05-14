import { redirect } from 'next/navigation';

export default function PortalPage({ params }: { params: { slug: string } }) {
  // Redirect to the messages page by default
  redirect(`/${params.slug}/portal/messages`);
}