import { useEffect, useRef } from 'react';

interface SimpleTrackerProps {
  companyId: string;
}

// Professional device fingerprinting
const generateDeviceFingerprint = () => {
  const screen = window.screen;
  const nav = navigator;
  
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: nav.language,
    platform: nav.platform,
    userAgent: nav.userAgent,
    touchSupport: 'ontouchstart' in window,
    deviceMemory: (nav as any).deviceMemory || 'unknown',
    hardwareConcurrency: nav.hardwareConcurrency || 'unknown'
  };
};

// Generate visitor ID with fallback fingerprint
const getOrCreateVisitorId = () => {
  // Try to get existing visitor ID from cookie
  const existingId = document.cookie
    .split('; ')
    .find(row => row.startsWith('visitor_id='))
    ?.split('=')[1];
    
  if (existingId) {
    return existingId;
  }
  
  // Generate new visitor ID
  const newVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set cookie for 1 year
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  document.cookie = `visitor_id=${newVisitorId}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
  
  return newVisitorId;
};

// Detect device type professionally
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const screen = window.screen;
  
  // Detect device type
  let deviceType = 'desktop';
  let deviceModel = 'Unknown';
  
  if (/iPad/.test(ua)) {
    deviceType = 'tablet';
    deviceModel = 'iPad';
  } else if (/iPhone/.test(ua)) {
    deviceType = 'mobile';
    const match = ua.match(/iPhone OS (\d+)_(\d+)/);
    deviceModel = match ? `iPhone (iOS ${match[1]}.${match[2]})` : 'iPhone';
  } else if (/Android/.test(ua)) {
    deviceType = /Mobile/.test(ua) ? 'mobile' : 'tablet';
    const match = ua.match(/Android (\d+\.?\d*)/);
    deviceModel = match ? `Android ${match[1]}` : 'Android Device';
  } else if (screen.width <= 768) {
    deviceType = 'mobile';
  } else if (screen.width <= 1024) {
    deviceType = 'tablet';
  }
  
  return { deviceType, deviceModel };
};

// Smart referrer detection
const getSmartReferrer = () => {
  const referrer = document.referrer;
  if (!referrer) return 'Direct SMS Link';
  
  if (referrer.includes('google.com')) return 'Google Search';
  if (referrer.includes('facebook.com')) return 'Facebook';
  if (referrer.includes('instagram.com')) return 'Instagram';
  if (referrer.includes('linkedin.com')) return 'LinkedIn';
  if (referrer.includes('twitter.com') || referrer.includes('x.com')) return 'Twitter/X';
  if (referrer.includes('bing.com')) return 'Bing Search';
  if (referrer.includes('yahoo.com')) return 'Yahoo Search';
  
  // Same domain = internal navigation
  if (referrer.includes(window.location.hostname)) return 'Internal Navigation';
  
  return 'External Referral';
};

export default function SimpleTracker({ companyId }: SimpleTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(`${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const visitorIdRef = useRef<string>(getOrCreateVisitorId());
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const templateKey = 'moderntrust'; // Default template
    const startTime = startTimeRef.current;
    const deviceInfo = getDeviceInfo();
    const deviceFingerprint = generateDeviceFingerprint();
    
    // Professional tracking with all data points
    const trackVisit = async (timeOnPage: number, isInitial: boolean = false) => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            sessionId: sessionIdRef.current,
            visitorId: visitorIdRef.current,
            templateKey,
            timeOnPage,
            isInitial,
            // Professional device data
            deviceType: deviceInfo.deviceType,
            deviceModel: deviceInfo.deviceModel,
            referrer: getSmartReferrer(),
            // Device fingerprint for unique visitor detection
            fingerprint: {
              screenResolution: deviceFingerprint.screenResolution,
              timezone: deviceFingerprint.timezone,
              language: deviceFingerprint.language,
              platform: deviceFingerprint.platform,
              touchSupport: deviceFingerprint.touchSupport
            },
            // Browser info
            userAgent: navigator.userAgent,
            // Page info
            pageUrl: window.location.href,
            pageTitle: document.title
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

    // Track on page unload with professional data
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      navigator.sendBeacon('/api/analytics/track', JSON.stringify({
        companyId,
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        templateKey,
        timeOnPage,
        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,
        fingerprint: deviceFingerprint,
        userAgent: navigator.userAgent,
        referrer: getSmartReferrer(),
        pageUrl: window.location.href,
        pageTitle: document.title,
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