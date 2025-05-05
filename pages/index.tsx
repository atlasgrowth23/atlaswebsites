import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/shared/Layout';

const Home: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>HVAC Contractor Websites | Home</title>
        <meta name="description" content="Professional websites for HVAC contractors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">HVAC Contractor Website Platform</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional websites for HVAC contractors using Next.js and Supabase
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Static Site Generation</CardTitle>
              <CardDescription>Fast loading, SEO-friendly websites</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Our platform utilizes Next.js Static Site Generation for optimal performance and search engine visibility.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/#features">Learn More</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customizable Templates</CardTitle>
              <CardDescription>Professional designs for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Choose from professionally designed templates specifically created for HVAC contractors.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/#templates">View Templates</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>Showcase your reputation</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Display customer reviews and testimonials to build trust with potential clients.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/#reviews">See Examples</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild>
            <Link href="/example-company">View Example Site</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
