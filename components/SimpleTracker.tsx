import { useEffect } from 'react';

interface SimpleTrackerProps {
  companyId: string;
}

export default function SimpleTracker({ companyId }: SimpleTrackerProps) {
  useEffect(() => {
    // Track page view on mount
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/simple-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            page_url: window.location.pathname,
            referrer: document.referrer,
            user_agent: navigator.userAgent
          })
        });
      } catch (error) {
        // Silently fail - don't break the page
        console.log('Analytics tracking failed');
      }
    };

    trackPageView();
  }, [companyId]);

  return null; // This component doesn't render anything
}