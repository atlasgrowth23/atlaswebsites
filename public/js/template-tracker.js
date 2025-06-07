// Professional Analytics Tracker - Universal Template Support
(() => {
  'use strict';

  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

  // Prevent multiple tracker instances
  if (window.__ATLAS_TRACKER__) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  // Skip tracking for admin/preview modes
  if (urlParams.get('admin') === 'true' || 
      urlParams.get('preview') === 'true' || 
      urlParams.get('notrack') === 'true' ||
      document.referrer.includes('admin/pipeline')) {
    console.log('🔒 Tracking disabled - Admin/Preview mode');
    return;
  }

  // Extract template and company info from URL path
  const pathParts = window.location.pathname.split('/').filter(p => p);
  if (pathParts.length < 3 || pathParts[0] !== 't') {
    console.error('❌ Invalid template URL structure');
    return;
  }

  const templateKey = pathParts[1];
  const companySlug = pathParts[2];
  const companyId = window.__COMPANY_ID__;
  
  if (!companyId) {
    console.error('❌ Company ID not found - tracking disabled');
    return;
  }

  // Initialize tracking
  console.log(`📊 Atlas Analytics tracking started for ${templateKey}/${companySlug}`);
  window.__ATLAS_TRACKER__ = true;

  // Session management
  const sessionKey = `atlas_session_${companyId}`;
  let sessionId = sessionStorage.getItem(sessionKey);
  const isNewSession = !sessionId;
  
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }

  // Tracking state
  const trackingState = {
    startTime: Date.now(),
    totalTime: 0,
    lastActivity: Date.now(),
    isActive: true,
    interactions: 0,
    location: null,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  // Geolocation (optional, non-blocking)
  if (navigator.geolocation && isNewSession) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        trackingState.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log('📍 Location acquired for analytics');
      },
      () => {}, // Silent fail - location is optional
      { timeout: 5000, enableHighAccuracy: false }
    );
  }

  // Activity tracking functions
  const updateActivity = () => {
    const now = Date.now();
    if (trackingState.isActive) {
      trackingState.totalTime += (now - trackingState.lastActivity);
    }
    trackingState.lastActivity = now;
    trackingState.isActive = true;
    trackingState.interactions++;
  };

  // Inactivity detection
  let inactivityTimer;
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      trackingState.isActive = false;
    }, 30000); // 30 seconds
  };

  // Professional analytics payload
  const createPayload = (isFinal = false) => ({
    companyId,
    companySlug,
    templateKey,
    sessionId,
    timeOnPage: Math.floor(trackingState.totalTime / 1000),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    viewport: trackingState.viewport,
    timestamp: new Date().toISOString(),
    location: trackingState.location,
    isInitial: isNewSession && !isFinal,
    interactions: trackingState.interactions
  });

  // Send analytics data
  const sendAnalytics = async (isFinal = false) => {
    const payload = createPayload(isFinal);
    
    // Always send analytics - professional tracking doesn't filter
    // (except skip duplicate initial calls)
    
    try {
      if (isFinal && navigator.sendBeacon) {
        // Use sendBeacon for reliable final tracking
        navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
      } else {
        // Use fetch for regular updates
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: isFinal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }
      
      const suffix = isFinal ? ' (final)' : payload.isInitial ? ' (initial)' : '';
      console.log(`📊 Analytics sent: ${payload.timeOnPage}s, ${payload.interactions} interactions${suffix}`);
      
    } catch (error) {
      console.error('❌ Analytics failed:', error);
    }
  };

  // Event listeners for user activity
  const activityEvents = ['mousemove', 'scroll', 'click', 'keydown', 'touchstart', 'wheel'];
  activityEvents.forEach(event => {
    document.addEventListener(event, () => {
      updateActivity();
      resetInactivityTimer();
    }, { passive: true });
  });

  // Viewport change tracking
  window.addEventListener('resize', () => {
    trackingState.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  });

  // Initialize activity tracking
  updateActivity();
  resetInactivityTimer();

  // Send initial analytics immediately (professional tracking starts right away)
  sendAnalytics();

  // Send updates every 5 seconds for real-time tracking
  const updateInterval = setInterval(() => {
    updateActivity(); // Update time before sending
    sendAnalytics();
  }, 5000);

  // Final analytics on page exit
  const handlePageExit = () => {
    clearInterval(updateInterval);
    clearTimeout(inactivityTimer);
    
    // Final time update
    updateActivity();
    
    if (trackingState.totalTime > 0) {
      sendAnalytics(true);
    }
  };

  // Multiple exit event handlers for reliability
  window.addEventListener('beforeunload', handlePageExit);
  window.addEventListener('pagehide', handlePageExit);
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      handlePageExit();
    } else {
      // Page became visible again, restart tracking
      trackingState.lastActivity = Date.now();
      trackingState.isActive = true;
      resetInactivityTimer();
    }
  });

  // Debug mode for development
  if (window.location.hostname === 'localhost' || urlParams.get('debug') === 'true') {
    window.__ATLAS_DEBUG__ = {
      trackingState,
      sendAnalytics: () => sendAnalytics(),
      sessionId,
      templateKey,
      companySlug
    };
    console.log('🔧 Atlas Analytics Debug Mode - Access via window.__ATLAS_DEBUG__');
  }

})();