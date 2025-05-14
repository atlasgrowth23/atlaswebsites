// Template view tracking script
(() => {
  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

  // Don't track views from admin or internal users
  const isInternalIp = false; // This would normally check the IP
  if (isInternalIp) {
    console.log('Not tracking internal user view');
    return;
  }

  // Extract the company name from the URL
  // Pattern: /t/[template]/[company-slug]
  const pathParts = window.location.pathname.split('/');
  if (pathParts.length < 4) {
    console.log('Invalid template URL pattern');
    return;
  }

  const template = pathParts[2];
  const companySlug = pathParts[3];
  
  // Convert slug back to company name (approximate)
  const companyName = companySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Send the view tracking request
  setTimeout(() => {
    fetch('/api/track-template-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyName,
        template
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Template view tracked:', data);
    })
    .catch(error => {
      console.error('Error tracking template view:', error);
    });
  }, 5000); // Wait 5 seconds to make sure it's a real view
})();