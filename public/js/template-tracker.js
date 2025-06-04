// Modern template tracking with admin detection
(() => {
  'use strict';

  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

  // Prevent multiple tracker instances
  if (window.__TRACKER_RUNNING__) {
    console.log('Tracker already running, skipping');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  // Skip tracking in preview/admin mode
  if (urlParams.get('preview') === 'true') {
    console.log('Preview mode detected, skipping tracking');
    return;
  }
  
  if (urlParams.get('admin') === 'true') {
    console.log('Admin view detected, skipping tracking');
    return;
  }

  // Check for admin authentication
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/check-admin', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.isAdmin || false;
      }
    } catch (error) {
      console.log('Admin check failed, assuming external user');
    }
    return false;
  };

  // Initialize tracking
  const initTracking = async () => {
    const isAdmin = await checkAdminStatus();
    
    if (isAdmin) {
      console.log('🔒 Admin user detected, tracking disabled');
      return;
    }

    console.log('👥 External visitor detected, tracking enabled');
    window.__TRACKER_RUNNING__ = true;

    // Extract template/company info
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length < 4) {
      console.error('Invalid template URL pattern');
      return;
    }

    const templateKey = pathParts[2];
    const companySlug = pathParts[3];
    const companyId = window.__COMPANY_ID__;
    
    if (!companyId) {
      console.error('Company ID not found');
      return;
    }

    // Generate session ID
    const sessionKey = `tracker_${companyId}_${templateKey}`;
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(sessionKey, sessionId);
    }

    const startTime = Date.now();
    let lastActivity = startTime;
    let totalActiveTime = 0;
    let isActive = true;
    let hasTracked = false;

    // Track user activity
    const trackActivity = () => {
      const now = Date.now();
      if (isActive) {
        totalActiveTime += (now - lastActivity);
      }
      lastActivity = now;
      isActive = true;
    };

    // Send tracking data
    const sendTrackingData = async (isInitial = false) => {
      const timeOnPage = Math.floor(totalActiveTime / 1000);
      
      try {
        const response = await fetch('/api/track-template-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companySlug,
            templateKey,
            companyId,
            sessionId,
            timeOnPage: Math.max(timeOnPage, 1),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            isInitial
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`📊 Tracking sent: ${timeOnPage}s (${isInitial ? 'initial' : 'update'})`);
        }
      } catch (error) {
        console.error('❌ Tracking failed:', error);
      }
    };

    // Event listeners for activity tracking
    ['mousemove', 'scroll', 'click', 'keypress'].forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Initial tracking after page load
    setTimeout(async () => {
      if (!hasTracked) {
        hasTracked = true;
        await sendTrackingData(true);
        
        // Periodic updates every 30 seconds
        setInterval(async () => {
          if (isActive && totalActiveTime > 0) {
            await sendTrackingData(false);
          }
        }, 30000);
      }
    }, 1000);

    // Final tracking on page unload
    const handleUnload = () => {
      if (hasTracked && totalActiveTime > 0) {
        navigator.sendBeacon('/api/track-template-view', JSON.stringify({
          companySlug,
          templateKey,
          companyId,
          sessionId,
          timeOnPage: Math.floor(totalActiveTime / 1000),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          isInitial: false
        }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleUnload();
      }
    });

    // Track initial activity
    trackActivity();
  };

  // Start tracking
  initTracking().catch(console.error);
})();