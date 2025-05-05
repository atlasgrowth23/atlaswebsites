import React from 'react';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContactFooterProps {
  company: Company;
}

const ContactFooter: React.FC<ContactFooterProps> = ({ company }) => {
  return (
    <section id="contact" className="py-16 bg-slate-800 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Contact Us</h2>
          <p className="mt-2 text-slate-300">
            Get in touch with our team for all your HVAC needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6">Send Us a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter your name" 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="Enter your phone" 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="How can we help you?" 
                  rows={5}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
                />
              </div>
              
              <Button className="w-full bg-slate-100 text-slate-800 hover:bg-white">
                Send Message
              </Button>
              
              <p className="text-sm text-slate-400 text-center">
                We'll get back to you as soon as possible
              </p>
            </form>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">Contact Information</h3>
            <div className="bg-slate-700 rounded-lg p-8 space-y-6">
              <div className="flex items-start">
                <div className="bg-slate-600 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-map-pin">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Our Location</h4>
                  <p className="text-slate-300">
                    {company.address || 'Serving'}<br />
                    {company.city}, {company.state} {company.zip_code || ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-slate-600 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-phone">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Phone Number</h4>
                  <p className="text-slate-300">{company.phone || 'Contact us for details'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-slate-600 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-mail">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Email Address</h4>
                  <p className="text-slate-300">{company.email || 'info@example.com'}</p>
                </div>
              </div>
              
              {company.hours && (
                <div className="flex items-start">
                  <div className="bg-slate-600 p-3 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-clock">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Business Hours</h4>
                    <ul className="text-slate-300 space-y-1">
                      {Object.entries(company.hours).map(([day, hours]) => (
                        <li key={day}>
                          <span className="font-medium">{day}:</span> {hours}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {company.website && (
              <div className="mt-6 text-center">
                <p className="mb-2">Visit our main website</p>
                <Button asChild variant="outline" className="border-white text-white hover:bg-slate-700">
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactFooter;
