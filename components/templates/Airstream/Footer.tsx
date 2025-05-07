
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Company } from '@/types';
import { getCompanyColors } from '@/lib/palettes';

interface FooterProps {
  company?: Company;
}

const Footer: React.FC<FooterProps> = ({ company }) => {
  // Get company colors
  const colors = getCompanyColors(company);

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8" style={{
      // Use CSS variable for theming accents
      '--accent-color': colors.secondary
    } as React.CSSProperties}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {company?.name || 'HVAC Company'}
            </h3>
            <p className="text-gray-400 mb-4">
              Professional heating, cooling, and air quality services for residential and commercial properties.
            </p>
            <div className="flex space-x-4">
              {company?.facebook && (
                <a href={company.facebook} target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {company?.instagram && (
                <a href={company.instagram} target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="#services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="#about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#reviews" className="hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-4">Our Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="#ac-repair" className="hover:text-white transition-colors">
                  AC Repair & Installation
                </Link>
              </li>
              <li>
                <Link href="#heating" className="hover:text-white transition-colors">
                  Heating Services
                </Link>
              </li>
              <li>
                <Link href="#air-quality" className="hover:text-white transition-colors">
                  Air Quality Solutions
                </Link>
              </li>
              <li>
                <Link href="#maintenance" className="hover:text-white transition-colors">
                  Maintenance Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              {company?.phone && (
                <li className="flex items-start">
                  <Phone size={18} className="mr-2 mt-1 flex-shrink-0" />
                  <a href={`tel:${company.phone}`} className="hover:text-white transition-colors">
                    {company.phone}
                  </a>
                </li>
              )}
              <li className="flex items-start">
                <Mail size={18} className="mr-2 mt-1 flex-shrink-0" />
                <a href="mailto:info@example.com" className="hover:text-white transition-colors">
                  {company?.email_1 || 'info@example.com'}
                </a>
              </li>
              {company?.full_address && (
                <li className="flex items-start">
                  <MapPin size={18} className="mr-2 mt-1 flex-shrink-0" />
                  <span>{company.full_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {company?.name || 'HVAC Company'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
