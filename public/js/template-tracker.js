// Template view tracking script
(() => {
  // Only run on template pages
  if (!window.location.pathname.startsWith('/t/')) {
    return;
  }

  // Extract the template and company info from the URL
  // Pattern: /t/[template]/[company-slug]
  const pathParts = window.location.pathname.split('/');
  if (pathParts.length < 4) {
    console.log('Invalid template URL pattern');
    return;
  }

  const templateKey = pathParts[2];
  const companySlug = pathParts[3];
  
  // Get company ID from the page data (injected by Next.js)
  const companyId = window.__COMPANY_ID__;
  
  if (!companyId) {
    console.log('Company ID not found, cannot track');
    return;
  }
  
  // Send the view tracking request after 3 seconds
  setTimeout(() => {
    fetch('/api/track-template-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companySlug,
        templateKey,
        companyId
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Template view tracked:', data);
    })
    .catch(error => {
      console.error('Error tracking template view:', error);
    });
  }, 3000); // Wait 3 seconds to make sure it's a real view
})();