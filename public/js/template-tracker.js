// Enhanced template view tracking with timing
(() => {
  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

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

  // Track timing data
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  let lastActivity = startTime;
  let totalActiveTime = 0;
  let isActive = true;

  // Track user activity to measure engagement time
  const trackActivity = () => {
    const now = Date.now();
    if (isActive) {
      totalActiveTime += (now - lastActivity);
    }
    lastActivity = now;
    isActive = true;
  };

  // Track mouse movement, scrolling, clicking
  document.addEventListener('mousemove', trackActivity);
  document.addEventListener('scroll', trackActivity);
  document.addEventListener('click', trackActivity);
  document.addEventListener('keypress', trackActivity);

  // Mark as inactive after 30 seconds of no activity
  setInterval(() => {
    if (Date.now() - lastActivity > 30000) {
      isActive = false;
    }
  }, 5000);

  // Send tracking data with timing
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
        timeOnPage: activeTime > 0 ? activeTime : timeOnPage,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        isInitial
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Template view tracked:', data);
    })
    .catch(error => {
      console.error('Error tracking template view:', error);
    });
  };

  // Initial tracking after 3 seconds
  setTimeout(() => sendTrackingData(true), 3000);

  // Update tracking every 15 seconds while user is active
  setInterval(() => {
    if (totalActiveTime > 0) {
      sendTrackingData(false);
    }
  }, 15000);

  // Final tracking when user leaves
  window.addEventListener('beforeunload', () => sendTrackingData(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      sendTrackingData(false);
    }
  });
})();