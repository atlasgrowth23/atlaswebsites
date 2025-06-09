import { useEffect, useRef } from 'react';

interface SimpleTrackerProps {
  companyId: string;
}

// Simple visitor ID with proper cookie persistence
const getOrCreateVisitorId = () => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Try to get existing visitor ID from cookie with better parsing
  const cookies = document.cookie.split(';').map(c => c.trim());
  const visitorCookie = cookies.find(cookie => cookie.startsWith('visitor_id='));
  
  if (visitorCookie) {
    const existingId = visitorCookie.split('=')[1];
    if (existingId && existingId !== 'undefined') {
      return existingId;
    }
  }
  
  // Generate new visitor ID with domain-specific prefix
  const domain = window.location.hostname.replace(/[^a-zA-Z0-9]/g, '');
  const newVisitorId = `v_${domain}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set persistent cookie for 2 years
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 2);
  const isHttps = window.location.protocol === 'https:';
  document.cookie = `visitor_id=${newVisitorId}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax${isHttps ? '; Secure' : ''}`;
  
  return newVisitorId;
};

// Enhanced device detection
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { deviceType: 'desktop', deviceModel: 'Unknown' };
  }
  
  const ua = navigator.userAgent;
  const screen = window.screen;
  
  let deviceType = 'desktop';
  let deviceModel = 'Unknown';
  
  // Mobile devices
  if (/iPad/.test(ua)) {
    deviceType = 'tablet';
    deviceModel = 'iPad';
  } else if (/iPhone/.test(ua)) {
    deviceType = 'mobile';
    deviceModel = 'iPhone';
  } else if (/Android/.test(ua)) {
    deviceType = /Mobile/.test(ua) ? 'mobile' : 'tablet';
    deviceModel = 'Android Device';
  } 
  // Desktop detection
  else if (/Windows/.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Windows PC';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Mac';
  } else if (/Linux/.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Linux PC';
  } else if (/CrOS/.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Chromebook';
  }
  // Fallback to screen size detection
  else if (screen.width <= 768) {
    deviceType = 'mobile';
    deviceModel = 'Mobile Device';
  } else if (screen.width <= 1024) {
    deviceType = 'tablet';
    deviceModel = 'Tablet';
  } else {
    deviceType = 'desktop';
    deviceModel = 'Desktop Computer';
  }
  
  return { deviceType, deviceModel };
};

// Smart referrer detection with user identification
const getSmartReferrer = () => {
  if (typeof window === 'undefined') return 'Direct SMS Link';
  
  const referrer = document.referrer;
  if (!referrer) return 'Direct SMS Link';
  
  if (referrer.includes('google.com')) return 'Google Search';
  if (referrer.includes('facebook.com')) return 'Facebook';
  if (referrer.includes('instagram.com')) return 'Instagram';
  if (referrer.includes('linkedin.com')) return 'LinkedIn';
  if (referrer.includes('twitter.com') || referrer.includes('x.com')) return 'Twitter/X';
  if (referrer.includes('bing.com')) return 'Bing Search';
  if (referrer.includes('yahoo.com')) return 'Yahoo Search';
  
  // Same domain = check if from admin pipeline
  if (referrer.includes(window.location.hostname)) {
    // Check if referrer is from admin pipeline pages
    if (referrer.includes('/admin/pipeline')) {
      return 'Nick'; // Admin pipeline is primarily Nick's
    }
    if (referrer.includes('/admin/')) {
      return 'Jared'; // Other admin pages are primarily Jared's
    }
    return 'Internal Navigation';
  }
  
  return 'External Referral';
};

// Get or create session ID that persists across refreshes
const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Try to get existing session ID from sessionStorage
  const existingSessionId = sessionStorage.getItem('session_id');
  if (existingSessionId) {
    return existingSessionId;
  }
  
  // Create new session ID and store it
  const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('session_id', newSessionId);
  return newSessionId;
};

export default function SimpleTracker({ companyId }: SimpleTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>('');
  const visitorIdRef = useRef<string>('');
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize visitor ID and session ID on client side only
  useEffect(() => {
    if (!visitorIdRef.current) {
      visitorIdRef.current = getOrCreateVisitorId();
    }
    if (!sessionIdRef.current) {
      sessionIdRef.current = getOrCreateSessionId();
    }
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const templateKey = 'moderntrust';
    const startTime = startTimeRef.current;
    const deviceInfo = getDeviceInfo();
    
    // Simple tracking function
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
            deviceType: deviceInfo.deviceType,
            deviceModel: deviceInfo.deviceModel,
            referrer: getSmartReferrer(),
            userAgent: navigator.userAgent,
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

    // Track every 2 seconds to catch shorter visits
    trackingIntervalRef.current = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      trackVisit(timeOnPage, false);
    }, 2000);

    // Track on page unload and visibility change
    const handlePageLeave = () => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      const payload = JSON.stringify({
        companyId,
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        templateKey,
        timeOnPage,
        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,
        userAgent: navigator.userAgent,
        referrer: getSmartReferrer(),
        pageUrl: window.location.href,
        pageTitle: document.title,
        isInitial: false
      });
      
      // Try sendBeacon first, fallback to regular fetch
      if (navigator.sendBeacon) {
        // Create a blob with proper content type for sendBeacon
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/track', blob);
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {}); // Ignore errors on page unload
      }
    };

    let visibilityTimer: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Don't end session immediately - wait 2 minutes for tab switching
        visibilityTimer = setTimeout(() => {
          handlePageLeave();
        }, 120000); // 2 minutes
      } else if (document.visibilityState === 'visible') {
        // User came back - cancel the session end timer
        if (visibilityTimer) {
          clearTimeout(visibilityTimer);
          visibilityTimer = null;
        }
      }
    };

    window.addEventListener('beforeunload', handlePageLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handlePageLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Final tracking on component unmount
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      trackVisit(timeOnPage, false);
    };
  }, [companyId]);

  return null;
}