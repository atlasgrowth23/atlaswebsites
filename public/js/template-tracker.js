// Professional analytics tracking - Simple and reliable
(() => {
  'use strict';

  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

  // Prevent multiple tracker instances
  if (window.__TRACKER_RUNNING__) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  // Simple admin detection - skip if admin or preview params
  if (urlParams.get('admin') === 'true' || urlParams.get('preview') === 'true') {
    console.log('🔒 Admin/Preview mode - analytics disabled');
    return;
  }

  // Extract company info
  const pathParts = window.location.pathname.split('/');
  if (pathParts.length < 4) {
    console.error('Invalid template URL');
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
  const sessionKey = `session_${companyId}`;
  let sessionId = sessionStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }

  console.log('📊 Analytics tracking started for:', companySlug);
  window.__TRACKER_RUNNING__ = true;

  const startTime = Date.now();
  let totalTime = 0;
  let lastActivity = startTime;
  let isActive = true;

  // Track user activity
  const updateActivity = () => {
    const now = Date.now();
    if (isActive) {
      totalTime += (now - lastActivity);
    }
    lastActivity = now;
    isActive = true;
  };

  // Detect when user becomes inactive
  let inactivityTimer;
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      isActive = false;
    }, 30000); // 30 seconds of inactivity
  };

  // Send analytics data
  const sendData = async (isFinal = false) => {
    const timeSpent = Math.floor(totalTime / 1000);
    
    if (timeSpent < 1 && !isFinal) return; // Don't send if less than 1 second
    
    const data = {
      companyId,
      companySlug,
      templateKey,
      sessionId,
      timeOnPage: timeSpent,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    };

    try {
      if (isFinal && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify(data));
      } else {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      
      console.log(`📊 Analytics sent: ${timeSpent}s ${isFinal ? '(final)' : ''}`);
    } catch (error) {
      console.error('Analytics failed:', error);
    }
  };

  // Activity event listeners
  ['mousemove', 'scroll', 'click', 'keydown', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
      updateActivity();
      resetInactivityTimer();
    }, { passive: true });
  });

  // Initial activity tracking
  updateActivity();
  resetInactivityTimer();

  // Send initial data after 2 seconds
  setTimeout(() => sendData(), 2000);

  // Send updates every 30 seconds
  const updateInterval = setInterval(() => {
    if (totalTime > 0) {
      sendData();
    }
  }, 30000);

  // Final data on page exit
  const handleExit = () => {
    clearInterval(updateInterval);
    clearTimeout(inactivityTimer);
    if (totalTime > 0) {
      sendData(true);
    }
  };

  window.addEventListener('beforeunload', handleExit);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      handleExit();
    }
  });

})();