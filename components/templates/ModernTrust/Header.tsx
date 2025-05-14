import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Company } from '@/types';
import { Container } from '@/components/ui/container';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  company: Company;
}

const Header: React.FC<HeaderProps> = ({ company }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if ratings should be shown (rating > 4.8 and reviews > 10)
  const showRatings = company.rating && company.reviews && 
                     company.rating >= 4.8 && company.reviews >= 10;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format phone number for display
  const formattedPhone = company.phone ? company.phone.replace(/^\+1\s?/, '') : '';
  
  // Get company initial for avatar fallback
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'H';
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-gradient-to-r from-blue-900 to-blue-700 shadow-xl py-2' 
        : 'bg-gradient-to-r from-blue-900/80 to-blue-700/80 backdrop-blur-md py-4'
    }`}>
      <Container>
        <div className="flex justify-between items-center">
          {/* Company Logo/Name with Avatar */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              {company.logo ? (
                <AvatarImage src={company.logo} alt={company.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-white">
                {getInitial(company.name)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {company.name}
            </h1>
          </div>

          {/* Desktop Navigation with NavigationMenu */}
          <div className="hidden md:flex items-center gap-8">
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {/* About Navigation Item */}
                <NavigationMenuItem>
                  <Link href="#about" legacyBehavior passHref>
                    <NavigationMenuLink className="text-base font-medium text-white hover:text-blue-200 transition-colors">
                      About
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                {/* Services Navigation Item with Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-base font-medium text-white hover:text-blue-200 bg-transparent hover:bg-white/10">Services</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md"
                            href="#services"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              HVAC Services
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Comprehensive heating, ventilation, and air conditioning solutions for your home or business.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link href="#ac-repair" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">AC Repair</div>
                            <p className="text-sm leading-snug text-white/70 line-clamp-2">
                              Fast, reliable air conditioning repair
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="#heating" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Heating</div>
                            <p className="text-sm leading-snug text-white/70 line-clamp-2">
                              Expert furnace and heat pump services
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="#installation" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Installation</div>
                            <p className="text-sm leading-snug text-white/70 line-clamp-2">
                              New system installation and upgrades
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Contact Navigation Item */}
                <NavigationMenuItem>
                  <Link href="#contact" legacyBehavior passHref>
                    <NavigationMenuLink className="text-base font-medium text-white hover:text-blue-200 transition-colors">
                      Contact
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Simple links for medium screens */}
            <nav className="hidden md:flex lg:hidden items-center space-x-8">
              {['About', 'Services', 'Contact'].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-base font-medium text-white hover:text-blue-200 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Rating/Reviews Section - conditionally displayed */}
            {showRatings && (
              <div className="hidden md:block">
                <Badge variant="outline" className="bg-white/10 py-1.5 px-3 gap-1.5 border-white/20">
                  <span className="text-yellow-400 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </span>
                  <span className="text-sm font-bold text-white">{typeof company.rating === 'number' ? company.rating.toFixed(1) : company.rating}</span>
                  <span className="text-xs text-white/80">({company.reviews}+)</span>
                </Badge>
              </div>
            )}

            {/* Phone Button */}
            {company.phone && (
              <Button 
                size="sm" 
                className="ml-2 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-red-500/30"
              >
                <a href={`tel:${formattedPhone}`} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {formattedPhone}
                </a>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gradient-to-b from-blue-900 to-blue-800 text-white border-l border-white/10">
                <nav className="flex flex-col mt-8 space-y-4">
                  {['About', 'Services', 'Contact'].map((item) => (
                    <Link 
                      key={item}
                      href={`#${item.toLowerCase()}`} 
                      className="text-lg font-medium text-white hover:text-blue-200 transition-colors py-2 border-b border-blue-700/50"
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
                
                {/* Mobile reviews badge - only if ratings should show */}
                {showRatings && (
                  <div className="mt-6 p-3 rounded-lg flex items-center bg-white/5 border border-white/10">
                    <div className="text-yellow-400 flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <div className="ml-2">
                      <span className="text-sm font-bold text-white">{company.rating?.toFixed(1)}</span>
                      <span className="text-xs text-white/70 ml-1">({company.reviews}+ Reviews)</span>
                    </div>
                  </div>
                )}
                
                {/* Phone Button in Mobile Menu */}
                {company.phone && (
                  <Button 
                    className="mt-6 w-full bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                  >
                    <a href={`tel:${formattedPhone}`} className="flex items-center justify-center w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Now
                    </a>
                  </Button>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;