import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Stack } from '@/components/ui/stack';
import { Grid } from '@/components/ui/grid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSmsOptIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/sms-opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Successfully opted in! You\'ll receive SMS updates from Atlas Growth.');
        setPhoneNumber('');
      } else {
        setMessage(`❌ ${data.error || 'Failed to opt in. Please try again.'}`);
      }
    } catch (error) {
      setMessage('❌ Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Atlas Growth - CRM & Reputation Management for Home Service Businesses</title>
        <meta name="description" content="Transform your home service business with Atlas Growth's comprehensive CRM, Google review automation, and reputation management platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <Container>
            <div className="flex justify-between items-center py-4">
              <Heading level={3} className="text-blue-600 font-bold">
                Atlas Growth
              </Heading>
              <div className="flex gap-4">
                <Link href="/dashboard" passHref>
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button>Get Started</Button>
              </div>
            </div>
          </Container>
        </nav>

        {/* Hero Section */}
        <Container className="py-20 text-center">
          <Stack spacing="xl">
            <div>
              <Heading level={1} size="4xl" className="text-gray-900 mb-6">
                Grow Your Home Service Business with 
                <span className="text-blue-600"> Atlas Growth</span>
              </Heading>
              <Text size="xl" className="text-gray-600 max-w-4xl mx-auto">
                Complete CRM and reputation management platform designed specifically for home service businesses. 
                Automate Google reviews, manage customer relationships, and grow your business with our proven system.
              </Text>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Watch Demo
              </Button>
            </div>
          </Stack>
        </Container>

        {/* Features Section */}
        <Container className="py-16">
          <div className="text-center mb-12">
            <Heading level={2} size="3xl" className="text-gray-900 mb-4">
              Everything Your Home Service Business Needs
            </Heading>
            <Text size="lg" className="text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform helps HVAC, plumbing, electrical, and other home service businesses thrive
            </Text>
          </div>

          <Grid cols={1} mdCols={2} lgCols={3} gap="lg">
            <Card className="border border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <Heading level={3} size="lg" className="text-gray-900 mb-2">
                  Google Review Automation
                </Heading>
                <Text className="text-gray-600">
                  Automatically request and manage Google reviews from satisfied customers. Boost your online reputation with our proven review generation system.
                </Text>
              </CardContent>
            </Card>

            <Card className="border border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <Heading level={3} size="lg" className="text-gray-900 mb-2">
                  Complete CRM System
                </Heading>
                <Text className="text-gray-600">
                  Track leads, manage customer relationships, and automate follow-ups. Our CRM is built specifically for home service businesses.
                </Text>
              </CardContent>
            </Card>

            <Card className="border border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <Heading level={3} size="lg" className="text-gray-900 mb-2">
                  Reputation Management
                </Heading>
                <Text className="text-gray-600">
                  Monitor your online presence across all platforms. Respond to reviews, track mentions, and protect your business reputation.
                </Text>
              </CardContent>
            </Card>

            <Card className="border border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <Heading level={3} size="lg" className="text-gray-900 mb-2">
                  SMS & Email Marketing
                </Heading>
                <Text className="text-gray-600">
                  Stay connected with customers through automated SMS and email campaigns. Send appointment reminders, follow-ups, and promotions.
                </Text>
              </CardContent>
            </Card>

            <Card className="border border-red-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <Heading level={3} size="lg" className="text-gray-900 mb-2">
                  Professional Websites
                </Heading>
                <Text className="text-gray-600">
                  Get a beautiful, mobile-responsive website that converts visitors into customers. Multiple templates designed for home service businesses.
                </Text>
              </CardContent>
            </Card>

            <Card className="border border-indigo-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <Heading level={3} size="lg" className="text-gray-900 mb-2">
                  Lead Generation
                </Heading>
                <Text className="text-gray-600">
                  Capture more leads with optimized landing pages, contact forms, and automated follow-up sequences that turn prospects into customers.
                </Text>
              </CardContent>
            </Card>
          </Grid>
        </Container>

        {/* SMS Opt-in Section */}
        <Container className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="text-center text-white">
            <Heading level={2} size="3xl" className="text-white mb-4">
              Get Exclusive Business Growth Tips
            </Heading>
            <Text size="lg" className="text-blue-100 max-w-2xl mx-auto mb-8">
              Join our SMS list to receive actionable tips for growing your home service business, 
              exclusive offers, and early access to new features.
            </Text>

            <form onSubmit={handleSmsOptIn} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-white"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  {isSubmitting ? 'Subscribing...' : 'Get SMS Updates'}
                </Button>
              </div>
              {message && (
                <Text size="sm" className="mt-3 text-blue-100">
                  {message}
                </Text>
              )}
            </form>

            <Text size="sm" className="text-blue-200 mt-4">
              By subscribing, you agree to receive SMS messages from Atlas Growth. Reply STOP to opt out anytime.
            </Text>
          </div>
        </Container>

        {/* Industries Section */}
        <Container className="py-16">
          <div className="text-center mb-12">
            <Heading level={2} size="3xl" className="text-gray-900 mb-4">
              Perfect for Home Service Businesses
            </Heading>
            <Text size="lg" className="text-gray-600">
              Trusted by thousands of businesses across these industries
            </Text>
          </div>

          <Grid cols={2} mdCols={4} gap="lg">
            {[
              { name: 'HVAC Services', icon: '🏠' },
              { name: 'Plumbing', icon: '🔧' },
              { name: 'Electrical', icon: '⚡' },
              { name: 'Roofing', icon: '🏘️' },
              { name: 'Landscaping', icon: '🌳' },
              { name: 'Cleaning Services', icon: '🧽' },
              { name: 'Pest Control', icon: '🐛' },
              { name: 'Handyman', icon: '🔨' },
            ].map((industry) => (
              <Card key={industry.name} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">{industry.icon}</div>
                <Text className="font-medium text-gray-900">{industry.name}</Text>
              </Card>
            ))}
          </Grid>
        </Container>

        {/* CTA Section */}
        <Container className="py-16 bg-gray-50">
          <div className="text-center">
            <Heading level={2} size="3xl" className="text-gray-900 mb-4">
              Ready to Grow Your Business?
            </Heading>
            <Text size="lg" className="text-gray-600 max-w-2xl mx-auto mb-8">
              Join thousands of home service businesses that trust Atlas Growth to manage their 
              customer relationships and grow their online reputation.
            </Text>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Start Your Free Trial
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Schedule a Demo
              </Button>
            </div>

            <Text size="sm" className="text-gray-500 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </Text>
          </div>
        </Container>

        {/* Footer */}
        <footer className="bg-white border-t">
          <Container className="py-12">
            <Grid cols={1} mdCols={4} gap="lg">
              <div>
                <Heading level={4} className="text-gray-900 mb-4">Atlas Growth</Heading>
                <Text size="sm" className="text-gray-600">
                  Empowering home service businesses with comprehensive CRM and reputation management solutions.
                </Text>
              </div>
              
              <div>
                <Heading level={5} className="text-gray-900 mb-4">Platform</Heading>
                <Stack spacing="xs">
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">CRM Features</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Review Management</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">SMS Marketing</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Website Builder</Link>
                </Stack>
              </div>
              
              <div>
                <Heading level={5} className="text-gray-900 mb-4">Support</Heading>
                <Stack spacing="xs">
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Help Center</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Contact Us</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Training</Link>
                  <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
                </Stack>
              </div>
              
              <div>
                <Heading level={5} className="text-gray-900 mb-4">Company</Heading>
                <Stack spacing="xs">
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">About Us</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Privacy Policy</Link>
                  <Link href="#" className="text-sm text-gray-600 hover:text-blue-600">Terms of Service</Link>
                </Stack>
              </div>
            </Grid>
            
            <div className="border-t mt-8 pt-8 text-center">
              <Text size="sm" className="text-gray-600">
                © 2024 Atlas Growth. All rights reserved.
              </Text>
            </div>
          </Container>
        </footer>
      </div>
    </>
  );
}