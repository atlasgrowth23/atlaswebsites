import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow embedding from any origin for widgets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get parameters from query string
  const { company, primary, accent } = req.query;
  
  // Set default colors if not provided
  const primaryColor = primary || '#0066FF';
  const accentColor = accent || '#F6AD55';
  
  // Generate embedding script with the provided parameters
  const embedScript = `
// HVAC Lead Generation Widget
(function() {
  // Create widget container
  const container = document.createElement('div');
  container.id = 'hvac-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  
  // Set up widget button
  const button = document.createElement('button');
  button.id = 'hvac-widget-button';
  button.innerHTML = '?';
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '${primaryColor}';
  button.style.color = 'white';
  button.style.fontSize = '24px';
  button.style.border = 'none';
  button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  container.appendChild(button);
  
  // When clicked, load the full widget iframe
  button.addEventListener('click', function() {
    // Replace button with iframe containing widget
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = 'https://${process.env.VERCEL_URL || req.headers.host}/widget?company=${company}&primary=${encodeURIComponent(primaryColor)}&accent=${encodeURIComponent(accentColor)}';
    iframe.style.width = '350px';
    iframe.style.height = '450px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    container.appendChild(iframe);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '-10px';
    closeButton.style.right = '-10px';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.borderRadius = '50%';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.color = '#333';
    closeButton.style.border = '1px solid #ddd';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    container.appendChild(closeButton);
    
    // Close widget when clicking close button
    closeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      container.innerHTML = '';
      container.appendChild(button);
    });
  });
})();
  `.trim();

  // Return the JavaScript code with correct content type
  res.setHeader('Content-Type', 'application/javascript');
  return res.status(200).send(embedScript);
}