import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Stack } from '@/components/ui/stack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function PortalDemo() {
  const router = useRouter();
  const { company } = router.query;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    
    fetch('/api/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ company })
    })
      .then(async (response) => {
        if (response.ok) {
          router.replace(`/${company}/portal`);
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to login to demo');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Network error');
        setLoading(false);
      });
  }, [company, router]);

  return (
    <Container maxWidth="sm" className="mt-24">
      <Stack spacing="lg" align="center" className="p-8 bg-surface rounded-lg shadow-md">
        <Heading level={1} size="2xl">Loading Demo...</Heading>
        
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <Text size="lg">Preparing your demo experience</Text>
          </div>
        ) : (
          <div className="text-center">
            <Text size="lg" color="error" className="mt-4">{error}</Text>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Return Home
            </button>
          </div>
        )}
      </Stack>
    </Container>
  );
}