// Enhanced template view tracking with proper session management
(() => {
  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

  // Prevent multiple tracker instances
  if (window.__TRACKER_RUNNING__) {
    console.log('Tracker already running, skipping');
    return;
  }
  window.__TRACKER_RUNNING__ = true;

  // Extract the template and company info from the URL
  const pathParts = window.location.pathname.split('/');
  if (pathParts.length < 4) {
    console.log('Invalid template URL pattern');
    return;
  }

  const templateKey = pathParts[2];
  const companySlug = pathParts[3];
  const companyId = window.__COMPANY_ID__;
  
  if (!companyId) {
    console.log('Company ID not found, cannot track');
    return;
  }

  // Generate or retrieve session ID (persist across potential page reloads)
  const pageKey = `${companyId}_${templateKey}_${companySlug}`;
  let sessionId = sessionStorage.getItem(`tracker_session_${pageKey}`);
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(`tracker_session_${pageKey}`, sessionId);
  }

  const startTime = Date.now();
  let lastActivity = startTime;
  let totalActiveTime = 0;
  let isActive = true;
  let hasInitialTracked = false;
  let updateInterval = null;
  let inactivityTimeout = null;
  let visitorLocation = null;

  // Track user activity to measure engagement time
  const trackActivity = () => {
    const now = Date.now();
    if (isActive) {
      totalActiveTime += (now - lastActivity);
    }
    lastActivity = now;
    isActive = true;
    
    // Reset inactivity timeout
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    
    // Stop tracking after 5 minutes of inactivity
    inactivityTimeout = setTimeout(() => {
      isActive = false;
      console.log('User inactive for 5 minutes, stopping tracking updates');
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Get visitor's location (with permission)
  const getVisitorLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          visitorLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          console.log('Visitor location obtained:', visitorLocation);
        },
        (error) => {
          console.log('Geolocation permission denied or failed:', error.message);
          // Don't track location if permission denied
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  };

  // Track mouse movement, scrolling, clicking
  document.addEventListener('mousemove', trackActivity);
  document.addEventListener('scroll', trackActivity);
  document.addEventListener('click', trackActivity);
  document.addEventListener('keypress', trackActivity);

  // Try to get location (will ask for permission)
  getVisitorLocation();

  // Send tracking data
  const sendTrackingData = (isInitial = false) => {
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    const activeTime = Math.floor(totalActiveTime / 1000);
    
    fetch('/api/track-template-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companySlug,
        templateKey,
        companyId,
        sessionId,
        timeOnPage: activeTime > 0 ? activeTime : Math.min(timeOnPage, 30), // Cap at 30 seconds if no activity
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        isInitial,
        location: visitorLocation
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Template view tracked:', { sessionId, timeOnPage: activeTime > 0 ? activeTime : timeOnPage, isInitial });
    })
    .catch(error => {
      console.error('Error tracking template view:', error);
    });
  };

  // Initial tracking after short delay to ensure page is loaded
  setTimeout(() => {
    if (!hasInitialTracked) {
      hasInitialTracked = true;
      sendTrackingData(true);
      
      // Start periodic updates only after initial tracking
      updateInterval = setInterval(() => {
        if (isActive) {
          // Always send updates if page is active, even with minimal activity
          const currentActiveTime = Math.floor(totalActiveTime / 1000);
          const totalTime = Math.floor((Date.now() - startTime) / 1000);
          
          // Use active time if > 0, otherwise use total time (capped at reasonable amount)
          const timeToSend = currentActiveTime > 0 ? currentActiveTime : Math.min(totalTime, 30);
          
          if (timeToSend > 0) {
            sendTrackingData(false);
          }
        }
      }, 5000); // Update every 5 seconds instead of 30
    }
  }, 500); // Reduced from 3 seconds to 500ms

  // Prevent duplicate exit tracking
  let hasTrackedExit = false;
  
  // Final tracking when user leaves
  const trackExit = () => {
    if (!hasTrackedExit && hasInitialTracked) {
      hasTrackedExit = true;
      
      // Clear intervals
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
      
      // Clear session storage
      sessionStorage.removeItem(`tracker_session_${pageKey}`);
      
      // Send final tracking
      sendTrackingData(false);
      
      console.log('Session ended:', sessionId);
    }
  };
  
  window.addEventListener('beforeunload', trackExit);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackExit();
    }
  });
  
  // Initial activity tracking
  trackActivity();
})();