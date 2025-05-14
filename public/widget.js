(() => {
  // Get script attributes for configuration
  const scriptTag = document.currentScript;
  const companySlug = scriptTag?.getAttribute('data-company') || '';
  const primaryColor = scriptTag?.getAttribute('data-primary') || '#0066FF';
  const accentColor = scriptTag?.getAttribute('data-accent') || '#F6AD55';

  // Create a container for our widget
  const createWidgetContainer = () => {
    const container = document.createElement('div');
    container.id = 'hvac-widget-root';
    document.body.appendChild(container);
    return container;
  };

  // Load React and ReactDOM from CDN
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Main initialization function
  const initWidget = async () => {
    try {
      // Create container
      const container = createWidgetContainer();

      // Cache-busting parameter for development
      const cacheBuster = new Date().getTime();
      
      // Set up widget CSS
      const style = document.createElement('style');
      style.textContent = `
        #hvac-widget-root {
          --widget-primary: ${primaryColor};
          --widget-accent: ${accentColor};
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .hvac-widget-container * {
          box-sizing: border-box;
        }

        .hvac-widget-fab {
          transition: transform 0.3s ease, background-color 0.3s ease;
          border: none;
          outline: none;
          cursor: pointer;
        }
        
        .hvac-widget-fab:hover {
          transform: scale(1.05);
        }
        
        .hvac-widget-content {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: calc(100vh - 100px);
          overflow-y: auto;
        }
      `;
      document.head.appendChild(style);

      // Load React from CDN (for isolated widget)
      await Promise.all([
        loadScript('https://unpkg.com/react@18/umd/react.production.min.js'),
        loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js')
      ]);

      // Create a basic placeholder to show before proper widget renders
      container.innerHTML = `
        <div class="hvac-widget-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
          <button 
            id="hvac-widget-fab"
            style="
              width: 60px; 
              height: 60px; 
              border-radius: 50%;
              background-color: ${primaryColor};
              color: white;
              font-size: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              cursor: pointer;
            "
          >?</button>
        </div>
      `;

      // Handle button click to load full widget
      document.getElementById('hvac-widget-fab').addEventListener('click', async () => {
        // When clicked, we'll replace with a message stating the widget is loading
        container.innerHTML = `
          <div class="hvac-widget-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <button 
              style="
                width: 60px; 
                height: 60px; 
                border-radius: 50%;
                background-color: ${primaryColor};
                color: white;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              "
            >...</button>
          </div>
        `;

        try {
          // Now initiate widget loading from Next.js app
          const response = await fetch(`/api/widget-loader?company=${encodeURIComponent(companySlug)}&t=${cacheBuster}`);
          if (!response.ok) throw new Error('Failed to load widget');
          
          // Replace with actual widget or show error
          container.innerHTML = `
            <div class="hvac-widget-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
              <div style="
                width: 350px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                padding: 20px;
                border-top: 3px solid ${primaryColor};
              ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <h3 style="margin: 0; font-size: 16px;">Contact Us</h3>
                  <button id="hvac-widget-close" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                </div>
                <p style="margin: 0 0 15px; color: #666;">
                  Please fill out the form below and we'll get back to you as soon as possible.
                </p>
                <form id="hvac-widget-form">
                  <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 14px;">Name</label>
                    <input type="text" id="name" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                  </div>
                  <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 14px;">Email</label>
                    <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                  </div>
                  <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 14px;">Phone</label>
                    <input type="tel" id="phone" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                  </div>
                  <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 14px;">Message</label>
                    <textarea id="message" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                  </div>
                  <button type="submit" style="
                    width: 100%;
                    padding: 10px;
                    background-color: ${primaryColor};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: pointer;
                  ">Submit</button>
                </form>
              </div>
            </div>
          `;

          // Handle form submission
          document.getElementById('hvac-widget-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              phone: document.getElementById('phone').value,
              message: document.getElementById('message').value,
              companySlug,
              leadType: 'widget',
              timestamp: new Date().toISOString()
            };

            try {
              const response = await fetch('/api/lead', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
              });

              if (!response.ok) throw new Error('Error submitting form');

              // Show success message
              container.innerHTML = `
                <div class="hvac-widget-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
                  <div style="
                    width: 350px;
                    max-width: calc(100vw - 40px);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    padding: 20px;
                    text-align: center;
                    border-top: 3px solid ${primaryColor};
                  ">
                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                    <h3 style="margin: 0 0 10px; font-size: 18px;">Thank You!</h3>
                    <p style="margin: 0 0 15px; color: #666;">
                      Your message has been submitted. We'll be in touch soon!
                    </p>
                    <button id="hvac-widget-close" style="
                      padding: 8px 16px;
                      background-color: ${primaryColor};
                      color: white;
                      border: none;
                      border-radius: 4px;
                      font-weight: 500;
                      cursor: pointer;
                    ">Close</button>
                  </div>
                </div>
              `;

              // Add close button handler
              document.getElementById('hvac-widget-close').addEventListener('click', () => {
                resetWidget();
              });
            } catch (error) {
              console.error('Form submission error:', error);
              alert('There was an error submitting the form. Please try again.');
            }
          });

          // Add close button handler
          document.getElementById('hvac-widget-close').addEventListener('click', () => {
            resetWidget();
          });
        } catch (error) {
          console.error('Widget loading error:', error);
          resetWidget();
        }
      });

      // Function to reset widget to initial state
      const resetWidget = () => {
        container.innerHTML = `
          <div class="hvac-widget-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <button 
              id="hvac-widget-fab"
              style="
                width: 60px; 
                height: 60px; 
                border-radius: 50%;
                background-color: ${primaryColor};
                color: white;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                cursor: pointer;
              "
            >?</button>
          </div>
        `;

        // Re-add click handler
        document.getElementById('hvac-widget-fab').addEventListener('click', () => {
          initWidget();
        });
      };

    } catch (error) {
      console.error('Widget initialization error:', error);
    }
  };

  // Start initialization once the page is fully loaded
  if (document.readyState === 'complete') {
    initWidget();
  } else {
    window.addEventListener('load', initWidget);
  }
})();