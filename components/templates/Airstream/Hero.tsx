import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Phone, ShieldCheck, Award, ThermometerSnowflake } from 'lucide-react';
import { Company } from '@/types';
import { getCompanyColors } from '@/lib/palettes';
import { getPhotoUrl } from '@/lib/photo';

interface HeroProps {
  company: Company;
}

const Hero: React.FC<HeroProps> = ({ company }) => {
  const particlesRef = useRef<HTMLDivElement>(null);

  // Get company colors
  const colors = getCompanyColors(company);

  // Get hero image URL using the photo helper
  const heroImageUrl = getPhotoUrl(company, 'hero_img', 'airstream');
  const badgeImage1 = getPhotoUrl(company, 'hero_badge_1', 'airstream');
  const badgeImage2 = getPhotoUrl(company, 'hero_badge_2', 'airstream');

  // Create the air particles animation
  useEffect(() => {
    if (!particlesRef.current) return;

    const container = particlesRef.current;
    const particles: HTMLDivElement[] = [];
    const particleCount = 20; // Number of particles

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full bg-white/20 blur-sm';

      // Random size
      const size = Math.random() * 10 + 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;

      // Random animation duration
      const duration = Math.random() * 10 + 15;
      particle.style.animation = `float ${duration}s linear infinite`;

      // Set initial transform for animation
      particle.style.setProperty('--translate-y', `${Math.random() * 100}%`);
      particle.style.setProperty('--translate-x', `${(Math.random() - 0.5) * 50}px`);

      container.appendChild(particle);
      particles.push(particle);
    }

    // Animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% {
          transform: translateY(0) translateX(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(calc(-100vh - var(--translate-y))) translateX(var(--translate-x));
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      particles.forEach(p => p.remove());
      style.remove();
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center" style={{
      // Use CSS variables for theming
      '--primary-color': colors.primary,
      '--secondary-color': colors.secondary
    } as React.CSSProperties}>
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImageUrl}
          alt={`${company.name} hero`}
          fill
          className="object-cover"
          priority
        />
        <div 
          className="absolute inset-0 bg-gradient-to-r" 
          style={{ 
            backgroundImage: `linear-gradient(to right, ${colors.primary}CC, ${colors.primary}66, transparent)` 
          }}
        />
      </div>

      {/* Particles animation */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {/* Particles will be added here via JS */}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-20 py-32 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-white space-y-8">
            <div className="opacity-0 animate-fade-in animation-delay-300 bg-white/10 backdrop-blur-sm inline-block px-4 py-2 rounded-full text-sm font-medium">
              Trusted HVAC Provider Since {company.site_company_insights_founded_year || '2000'}
            </div>

            <h1 className="opacity-0 animate-fade-in animation-delay-500 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block">Perfect Climate.</span>
              <span className="block mt-2">Pure Comfort.</span>
            </h1>

            <p className="opacity-0 animate-fade-in animation-delay-700 text-xl text-white/90 max-w-md">
              {company.site_company_insights_description || 
                `${company.name} delivers superior heating & cooling solutions with cutting-edge technology and exceptional service.`
              }
            </p>

            <div className="opacity-0 animate-fade-in animation-delay-900 flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-white text-primary hover:bg-white/90 px-6 py-6 text-lg font-semibold rounded-full transition-transform hover:scale-105"
                style={{ backgroundColor: 'white', color: colors.primary }}
              >
                Schedule Service
              </Button>

              {company.phone && (
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 px-6 py-6 text-lg font-semibold rounded-full"
                >
                  <Phone className="mr-2" />
                  <a href={`tel:${company.phone}`}>
                    Call {company.phone}
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Visual element - Temperature display */}
          <div className="hidden lg:flex justify-center opacity-0 animate-fade-in animation-delay-1100">
            <div className="relative w-80 h-80">
              {/* Circular temperature display */}
              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col items-center justify-center text-white">
                <ThermometerSnowflake size={64} className="mb-4 text-white" />
                <div className="text-5xl font-bold">72°</div>
                <div className="text-lg mt-2">Perfect Comfort</div>

                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent animate-pulse"
                  style={{ 
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}) border-box` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute bottom-10 right-10 md:flex gap-4 hidden">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white animate-float">
          <ShieldCheck className="text-white" />
          <span>Licensed & Insured</span>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white animate-float animation-delay-500">
          <Award className="text-white" />
          <span>Top Rated Service</span>
        </div>
      </div>

      {/* Add certification badges */}
      <div className="absolute bottom-10 left-10 hidden md:flex gap-4">
        <Image 
          src={badgeImage1}
          alt="Certification"
          width={80}
          height={80}
          className="opacity-80 hover:opacity-100 transition-opacity animate-float"
        />
        <Image 
          src={badgeImage2}
          alt="Certification"
          width={80}
          height={80}
          className="opacity-80 hover:opacity-100 transition-opacity animate-float animation-delay-700"
        />
      </div>
    </div>
  );
};

export default Hero;