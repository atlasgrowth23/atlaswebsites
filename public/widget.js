(function() {
  // Configuration options from script tag data attributes
  const script = document.currentScript;
  const companySlug = script.getAttribute('data-company') || '';
  const companyName = script.getAttribute('data-name') || 'HVAC Support';
  const primaryColor = script.getAttribute('data-color') || '#0066FF';
  const accentColor = script.getAttribute('data-accent') || '#F6AD55';
  
  // Widget states
  const WIDGET_STATES = {
    CLOSED: 'closed',
    OPEN: 'open',
    MINIMIZED: 'minimized',
    SUCCESS: 'success'
  };
  
  // Current state of the widget
  let widgetState = WIDGET_STATES.CLOSED;
  
  // Form data
  let formData = {
    name: '',
    email: '',
    phone: '',
    message: '',
    serviceType: 'repair'
  };
  
  // Form errors
  let formErrors = {};
  
  // Create widget container
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'hvac-chat-widget';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    `;
    
    document.body.appendChild(container);
    
    // Render the initial widget state
    renderWidget();
  }
  
  // Render the widget based on current state
  function renderWidget() {
    const container = document.getElementById('hvac-chat-widget');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Add appropriate content based on state
    switch (widgetState) {
      case WIDGET_STATES.OPEN:
        container.appendChild(createOpenWidget());
        break;
      case WIDGET_STATES.MINIMIZED:
        container.appendChild(createMinimizedWidget());
        break;
      case WIDGET_STATES.SUCCESS:
        container.appendChild(createSuccessWidget());
        break;
    }
    
    // Always add the toggle button
    container.appendChild(createToggleButton());
  }
  
  // Create the toggle button
  function createToggleButton() {
    const button = document.createElement('button');
    button.id = 'hvac-chat-widget-toggle';
    button.style.cssText = `
      background-color: ${primaryColor};
      color: white;
      border: none;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
    `;
    
    button.innerHTML = widgetState === WIDGET_STATES.CLOSED ? 
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' :
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    
    // Toggle widget on click
    button.addEventListener('click', () => {
      if (widgetState === WIDGET_STATES.CLOSED) {
        widgetState = WIDGET_STATES.OPEN;
      } else if (widgetState === WIDGET_STATES.OPEN) {
        widgetState = WIDGET_STATES.CLOSED;
      } else if (widgetState === WIDGET_STATES.MINIMIZED) {
        widgetState = WIDGET_STATES.OPEN;
      } else if (widgetState === WIDGET_STATES.SUCCESS) {
        widgetState = WIDGET_STATES.CLOSED;
      }
      
      renderWidget();
    });
    
    return button;
  }
  
  // Create the open widget
  function createOpenWidget() {
    const widget = document.createElement('div');
    widget.style.cssText = `
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 320px;
      max-width: 90vw;
      overflow: hidden;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background-color: ${primaryColor};
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = companyName;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    `;
    
    const controls = document.createElement('div');
    
    const minimizeButton = document.createElement('button');
    minimizeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    minimizeButton.style.cssText = `
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      margin-right: 5px;
    `;
    minimizeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      widgetState = WIDGET_STATES.MINIMIZED;
      renderWidget();
    });
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
    `;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      widgetState = WIDGET_STATES.CLOSED;
      renderWidget();
    });
    
    controls.appendChild(minimizeButton);
    controls.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(controls);
    
    // Body (form)
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 15px;
    `;
    
    const form = document.createElement('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });
    
    // Name field
    const nameField = createFormField(
      'name',
      'Your Name',
      'text',
      formData.name,
      (value) => {
        formData.name = value;
        if (formErrors.name && value) {
          delete formErrors.name;
        }
      },
      formErrors.name
    );
    
    // Email field
    const emailField = createFormField(
      'email',
      'Email Address',
      'email',
      formData.email,
      (value) => {
        formData.email = value;
        if (formErrors.email && value && isValidEmail(value)) {
          delete formErrors.email;
        }
      },
      formErrors.email
    );
    
    // Phone field
    const phoneField = createFormField(
      'phone',
      'Phone Number',
      'tel',
      formData.phone,
      (value) => {
        formData.phone = value;
        if (formErrors.phone && value) {
          delete formErrors.phone;
        }
      },
      formErrors.phone
    );
    
    // Service Type field
    const serviceTypeField = createSelectField(
      'serviceType',
      'Service Type',
      formData.serviceType,
      [
        { value: 'repair', label: 'Repair' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'installation', label: 'Installation' },
        { value: 'emergency', label: 'Emergency Service' },
        { value: 'quote', label: 'Request Quote' }
      ],
      (value) => {
        formData.serviceType = value;
      }
    );
    
    // Message field
    const messageField = createTextareaField(
      'message',
      'Message',
      formData.message,
      (value) => {
        formData.message = value;
        if (formErrors.message && value) {
          delete formErrors.message;
        }
      },
      formErrors.message
    );
    
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Send Message';
    submitButton.style.cssText = `
      background-color: ${primaryColor};
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      width: 100%;
      cursor: pointer;
      margin-top: 10px;
    `;
    
    // Form error message
    let formErrorMessage = null;
    if (formErrors.form) {
      formErrorMessage = document.createElement('div');
      formErrorMessage.textContent = formErrors.form;
      formErrorMessage.style.cssText = `
        background-color: #FEE2E2;
        color: #DC2626;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        margin: 10px 0;
      `;
    }
    
    // Append all fields to form
    form.appendChild(nameField);
    form.appendChild(emailField);
    form.appendChild(phoneField);
    form.appendChild(serviceTypeField);
    form.appendChild(messageField);
    if (formErrorMessage) {
      form.appendChild(formErrorMessage);
    }
    form.appendChild(submitButton);
    
    body.appendChild(form);
    
    // Combine all parts
    widget.appendChild(header);
    widget.appendChild(body);
    
    return widget;
  }
  
  // Create a minimized widget
  function createMinimizedWidget() {
    const widget = document.createElement('div');
    widget.style.cssText = `
      background-color: white;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 10px 12px;
      margin-bottom: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
    `;
    
    widget.addEventListener('click', () => {
      widgetState = WIDGET_STATES.OPEN;
      renderWidget();
    });
    
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${primaryColor};
      margin-right: 8px;
    `;
    
    const text = document.createElement('span');
    text.textContent = companyName;
    text.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;
    
    widget.appendChild(dot);
    widget.appendChild(text);
    
    return widget;
  }
  
  // Create success state widget
  function createSuccessWidget() {
    const widget = document.createElement('div');
    widget.style.cssText = `
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 320px;
      max-width: 90vw;
      overflow: hidden;
      margin-bottom: 16px;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background-color: ${primaryColor};
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Message Sent';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
    `;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      widgetState = WIDGET_STATES.CLOSED;
      renderWidget();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Success message
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 20px;
      text-align: center;
    `;
    
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      background-color: #D1FAE5;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    `;
    
    const icon = document.createElement('div');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    iconContainer.appendChild(icon);
    
    const heading = document.createElement('h4');
    heading.textContent = 'Thank You!';
    heading.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
    `;
    
    const message = document.createElement('p');
    message.textContent = 'Your message has been sent successfully. We\'ll get back to you as soon as possible.';
    message.style.cssText = `
      font-size: 14px;
      color: #4B5563;
      margin: 0 0 16px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      background-color: ${primaryColor};
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => {
      widgetState = WIDGET_STATES.CLOSED;
      renderWidget();
    });
    
    body.appendChild(iconContainer);
    body.appendChild(heading);
    body.appendChild(message);
    body.appendChild(closeBtn);
    
    widget.appendChild(header);
    widget.appendChild(body);
    
    return widget;
  }
  
  // Create a form input field
  function createFormField(id, label, type, value, onChange, error) {
    const fieldContainer = document.createElement('div');
    fieldContainer.style.cssText = `
      margin-bottom: 12px;
    `;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    `;
    
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.value = value;
    input.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid ${error ? '#EF4444' : '#D1D5DB'};
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    `;
    input.addEventListener('input', (e) => {
      onChange(e.target.value);
    });
    
    fieldContainer.appendChild(labelElement);
    fieldContainer.appendChild(input);
    
    if (error) {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = error;
      errorMessage.style.cssText = `
        color: #EF4444;
        font-size: 12px;
        margin: 4px 0 0;
      `;
      fieldContainer.appendChild(errorMessage);
    }
    
    return fieldContainer;
  }
  
  // Create a form select field
  function createSelectField(id, label, value, options, onChange) {
    const fieldContainer = document.createElement('div');
    fieldContainer.style.cssText = `
      margin-bottom: 12px;
    `;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    `;
    
    const select = document.createElement('select');
    select.id = id;
    select.name = id;
    select.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      font-size: 14px;
      background-color: white;
      box-sizing: border-box;
    `;
    select.addEventListener('change', (e) => {
      onChange(e.target.value);
    });
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      if (option.value === value) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });
    
    fieldContainer.appendChild(labelElement);
    fieldContainer.appendChild(select);
    
    return fieldContainer;
  }
  
  // Create a form textarea field
  function createTextareaField(id, label, value, onChange, error) {
    const fieldContainer = document.createElement('div');
    fieldContainer.style.cssText = `
      margin-bottom: 12px;
    `;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    `;
    
    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.name = id;
    textarea.value = value;
    textarea.rows = 3;
    textarea.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid ${error ? '#EF4444' : '#D1D5DB'};
      border-radius: 4px;
      font-size: 14px;
      resize: vertical;
      min-height: 80px;
      box-sizing: border-box;
    `;
    textarea.addEventListener('input', (e) => {
      onChange(e.target.value);
    });
    
    fieldContainer.appendChild(labelElement);
    fieldContainer.appendChild(textarea);
    
    if (error) {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = error;
      errorMessage.style.cssText = `
        color: #EF4444;
        font-size: 12px;
        margin: 4px 0 0;
      `;
      fieldContainer.appendChild(errorMessage);
    }
    
    return fieldContainer;
  }
  
  // Validate form and return true if valid
  function validateForm() {
    let isValid = true;
    formErrors = {};
    
    if (!formData.name.trim()) {
      formErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      formErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      formErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!formData.phone.trim()) {
      formErrors.phone = 'Phone is required';
      isValid = false;
    }
    
    if (!formData.message.trim()) {
      formErrors.message = 'Message is required';
      isValid = false;
    }
    
    return isValid;
  }
  
  // Check if email is valid
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  // Submit the form to the API
  function submitForm() {
    if (!validateForm()) {
      renderWidget();
      return;
    }
    
    // Change the submit button to loading state
    const submitButton = document.querySelector('#hvac-chat-widget form button[type="submit"]');
    if (submitButton) {
      submitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Sending...';
      submitButton.disabled = true;
      submitButton.style.opacity = '0.7';
      
      // Add a spinning animation to the loader
      const loader = submitButton.querySelector('.loader');
      if (loader) {
        loader.style.cssText = `
          animation: spin 1s linear infinite;
          margin-right: 8px;
          display: inline-block;
        `;
        
        // Add the animation to the document
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Send the data to the API
    fetch('https://hvac-websites.com/api/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        companySlug,
        leadType: 'widget',
        timestamp: new Date().toISOString()
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to submit form');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Reset form
          formData = {
            name: '',
            email: '',
            phone: '',
            message: '',
            serviceType: 'repair'
          };
          
          // Show success state
          widgetState = WIDGET_STATES.SUCCESS;
          renderWidget();
        } else {
          throw new Error(data.message || 'Failed to submit form');
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        formErrors.form = 'Failed to submit form. Please try again.';
        renderWidget();
      });
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();