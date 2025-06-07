import { useEffect, useRef } from 'react';

interface SimpleTrackerProps {
  companyId: string;
}

export default function SimpleTracker({ companyId }: SimpleTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(`${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const templateKey = 'moderntrust'; // Default template
    const startTime = startTimeRef.current;
    
    // Track initial visit
    const trackVisit = async (timeOnPage: number, isInitial: boolean = false) => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            sessionId: sessionIdRef.current,
            templateKey,
            timeOnPage,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            isInitial
          })
        });
      } catch (error) {
        console.log('Analytics tracking failed');
      }
    };

    // Initial tracking
    trackVisit(0, true);

    // Track at meaningful engagement milestones: 30s, 2min, 5min, 10min
    const trackingMilestones = [30, 120, 300, 600]; // seconds
    let milestoneIndex = 0;
    
    trackingIntervalRef.current = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      
      // Only track at specific milestones
      if (milestoneIndex < trackingMilestones.length && timeOnPage >= trackingMilestones[milestoneIndex]) {
        trackVisit(trackingMilestones[milestoneIndex], false);
        milestoneIndex++;
        
        // If we've reached all milestones, clear the interval
        if (milestoneIndex >= trackingMilestones.length) {
          if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
          }
        }
      }
    }, 5000); // Check every 5 seconds

    // Track on page unload
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      navigator.sendBeacon('/api/analytics/track', JSON.stringify({
        companyId,
        sessionId: sessionIdRef.current,
        templateKey,
        timeOnPage,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        isInitial: false
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Final tracking on component unmount
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      trackVisit(timeOnPage, false);
    };
  }, [companyId]);

  return null;
}