/**
 * HVAC Website Chat Widget
 * This widget can be added to any website to provide a chat interface for potential customers.
 * It sends messages to the company's portal for follow-up.
 */

(function() {
  // Configuration - replace with the company slug when embedding the widget
  let companySlug = '';
  let companyName = '';

  // Widget state
  let isWidgetOpen = false;
  let isContactFormSubmitted = false;
  let userInfo = {
    name: '',
    email: '',
    phone: ''
  };

  // Chat messages
  let messages = [];

  // Elements
  let widgetContainer;
  let chatMessages;

  // Initialize the widget
  function initWidget(config) {
    companySlug = config.slug || '';
    companyName = config.name || 'HVAC Company';
    
    if (!companySlug) {
      console.error('Chat widget requires a company slug');
      return;
    }

    // Create the widget elements
    createWidgetElements();

    // Add event listeners
    document.addEventListener('DOMContentLoaded', function() {
      const toggleButton = document.getElementById('hvac-chat-toggle');
      if (toggleButton) {
        toggleButton.addEventListener('click', toggleWidget);
      }
    });
  }

  // Create widget elements
  function createWidgetElements() {
    // Create widget container
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'hvac-chat-widget';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = '20px';
    widgetContainer.style.right = '20px';
    widgetContainer.style.zIndex = '9999';
    widgetContainer.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(widgetContainer);

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'hvac-chat-toggle';
    toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    toggleButton.style.width = '60px';
    toggleButton.style.height = '60px';
    toggleButton.style.borderRadius = '50%';
    toggleButton.style.backgroundColor = '#1e3a8a';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.display = 'flex';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.justifyContent = 'center';
    toggleButton.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.2)';
    widgetContainer.appendChild(toggleButton);

    // Create chat window (hidden initially)
    const chatWindow = document.createElement('div');
    chatWindow.id = 'hvac-chat-window';
    chatWindow.style.position = 'absolute';
    chatWindow.style.bottom = '70px';
    chatWindow.style.right = '0';
    chatWindow.style.width = '350px';
    chatWindow.style.height = '450px';
    chatWindow.style.backgroundColor = 'white';
    chatWindow.style.borderRadius = '10px';
    chatWindow.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.2)';
    chatWindow.style.display = 'none';
    chatWindow.style.flexDirection = 'column';
    chatWindow.style.overflow = 'hidden';
    widgetContainer.appendChild(chatWindow);

    // Create chat header
    const chatHeader = document.createElement('div');
    chatHeader.style.backgroundColor = '#1e3a8a';
    chatHeader.style.color = 'white';
    chatHeader.style.padding = '15px';
    chatHeader.style.fontWeight = 'bold';
    chatHeader.style.display = 'flex';
    chatHeader.style.justifyContent = 'space-between';
    chatHeader.style.alignItems = 'center';
    chatHeader.innerHTML = `
      <div>Chat with ${companyName}</div>
      <button id="hvac-chat-close" style="background: none; border: none; color: white; cursor: pointer;">×</button>
    `;
    chatWindow.appendChild(chatHeader);

    // Create chat messages area
    chatMessages = document.createElement('div');
    chatMessages.id = 'hvac-chat-messages';
    chatMessages.style.flex = '1';
    chatMessages.style.overflowY = 'auto';
    chatMessages.style.padding = '15px';
    chatWindow.appendChild(chatMessages);

    // Create chat input area
    const chatInputArea = document.createElement('div');
    chatInputArea.id = 'hvac-chat-input-area';
    chatInputArea.style.padding = '10px 15px';
    chatInputArea.style.borderTop = '1px solid #eee';
    chatInputArea.style.display = 'flex';
    chatWindow.appendChild(chatInputArea);

    // Add welcome message
    addMessage('Hello! How can we help you with your HVAC needs today?', false);

    // Add event listeners for the close button
    document.addEventListener('DOMContentLoaded', function() {
      const closeButton = document.getElementById('hvac-chat-close');
      if (closeButton) {
        closeButton.addEventListener('click', toggleWidget);
      }
    });

    // Show contact form initially
    showContactForm();
  }

  // Toggle chat widget visibility
  function toggleWidget() {
    const chatWindow = document.getElementById('hvac-chat-window');
    isWidgetOpen = !isWidgetOpen;
    
    if (isWidgetOpen) {
      chatWindow.style.display = 'flex';
    } else {
      chatWindow.style.display = 'none';
    }
  }

  // Add a message to the chat
  function addMessage(text, isUser) {
    messages.push({ text, isUser });
    
    const messageElement = document.createElement('div');
    messageElement.className = isUser ? 'user-message' : 'system-message';
    messageElement.style.marginBottom = '10px';
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '4px';
    messageElement.style.maxWidth = '80%';
    messageElement.style.wordBreak = 'break-word';
    
    if (isUser) {
      messageElement.style.backgroundColor = '#e9f3ff';
      messageElement.style.marginLeft = 'auto';
    } else {
      messageElement.style.backgroundColor = '#f1f1f1';
      messageElement.style.marginRight = 'auto';
    }
    
    messageElement.innerHTML = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Show the contact form
  function showContactForm() {
    const chatInputArea = document.getElementById('hvac-chat-input-area');
    if (!chatInputArea) return;

    // Clear existing content
    chatInputArea.innerHTML = '';

    if (isContactFormSubmitted) {
      // Show regular chat input if contact form was submitted
      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'flex';
      inputContainer.style.width = '100%';
      
      const messageInput = document.createElement('input');
      messageInput.id = 'hvac-chat-input';
      messageInput.type = 'text';
      messageInput.placeholder = 'Type your message here...';
      messageInput.style.flex = '1';
      messageInput.style.padding = '8px';
      messageInput.style.border = '1px solid #ddd';
      messageInput.style.borderRadius = '4px';
      messageInput.style.marginRight = '5px';
      
      const sendButton = document.createElement('button');
      sendButton.id = 'hvac-chat-send';
      sendButton.innerHTML = 'Send';
      sendButton.style.backgroundColor = '#1e3a8a';
      sendButton.style.color = 'white';
      sendButton.style.border = 'none';
      sendButton.style.borderRadius = '4px';
      sendButton.style.padding = '8px 16px';
      sendButton.style.cursor = 'pointer';
      
      inputContainer.appendChild(messageInput);
      inputContainer.appendChild(sendButton);
      chatInputArea.appendChild(inputContainer);
      
      // Add event listeners
      messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          sendMessage();
        }
      });
      
      sendButton.addEventListener('click', sendMessage);
    } else {
      // Show contact form if not yet submitted
      const form = document.createElement('form');
      form.id = 'hvac-contact-form';
      form.style.width = '100%';
      
      // Name field
      const nameLabel = document.createElement('label');
      nameLabel.htmlFor = 'hvac-name';
      nameLabel.innerHTML = 'Name *';
      nameLabel.style.display = 'block';
      nameLabel.style.marginBottom = '3px';
      nameLabel.style.fontSize = '12px';
      
      const nameInput = document.createElement('input');
      nameInput.id = 'hvac-name';
      nameInput.type = 'text';
      nameInput.required = true;
      nameInput.style.width = '100%';
      nameInput.style.padding = '8px';
      nameInput.style.border = '1px solid #ddd';
      nameInput.style.borderRadius = '4px';
      nameInput.style.marginBottom = '8px';
      
      // Email field
      const emailLabel = document.createElement('label');
      emailLabel.htmlFor = 'hvac-email';
      emailLabel.innerHTML = 'Email';
      emailLabel.style.display = 'block';
      emailLabel.style.marginBottom = '3px';
      emailLabel.style.fontSize = '12px';
      
      const emailInput = document.createElement('input');
      emailInput.id = 'hvac-email';
      emailInput.type = 'email';
      emailInput.style.width = '100%';
      emailInput.style.padding = '8px';
      emailInput.style.border = '1px solid #ddd';
      emailInput.style.borderRadius = '4px';
      emailInput.style.marginBottom = '8px';
      
      // Phone field
      const phoneLabel = document.createElement('label');
      phoneLabel.htmlFor = 'hvac-phone';
      phoneLabel.innerHTML = 'Phone';
      phoneLabel.style.display = 'block';
      phoneLabel.style.marginBottom = '3px';
      phoneLabel.style.fontSize = '12px';
      
      const phoneInput = document.createElement('input');
      phoneInput.id = 'hvac-phone';
      phoneInput.type = 'tel';
      phoneInput.style.width = '100%';
      phoneInput.style.padding = '8px';
      phoneInput.style.border = '1px solid #ddd';
      phoneInput.style.borderRadius = '4px';
      phoneInput.style.marginBottom = '8px';
      
      // Message field
      const messageLabel = document.createElement('label');
      messageLabel.htmlFor = 'hvac-message';
      messageLabel.innerHTML = 'Message *';
      messageLabel.style.display = 'block';
      messageLabel.style.marginBottom = '3px';
      messageLabel.style.fontSize = '12px';
      
      const messageInput = document.createElement('textarea');
      messageInput.id = 'hvac-message';
      messageInput.required = true;
      messageInput.rows = 2;
      messageInput.style.width = '100%';
      messageInput.style.padding = '8px';
      messageInput.style.border = '1px solid #ddd';
      messageInput.style.borderRadius = '4px';
      messageInput.style.marginBottom = '8px';
      messageInput.style.resize = 'vertical';
      
      // Submit button
      const submitButton = document.createElement('button');
      submitButton.id = 'hvac-submit';
      submitButton.type = 'submit';
      submitButton.innerHTML = 'Start Chat';
      submitButton.style.backgroundColor = '#1e3a8a';
      submitButton.style.color = 'white';
      submitButton.style.border = 'none';
      submitButton.style.borderRadius = '4px';
      submitButton.style.padding = '8px 16px';
      submitButton.style.cursor = 'pointer';
      submitButton.style.width = '100%';
      
      // Add form elements
      form.appendChild(nameLabel);
      form.appendChild(nameInput);
      form.appendChild(emailLabel);
      form.appendChild(emailInput);
      form.appendChild(phoneLabel);
      form.appendChild(phoneInput);
      form.appendChild(messageLabel);
      form.appendChild(messageInput);
      form.appendChild(submitButton);
      
      // Add the form to the chat input area
      chatInputArea.appendChild(form);
      
      // Add event listener for form submission
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitContactForm();
      });
    }
  }

  // Submit the contact form
  function submitContactForm() {
    const nameInput = document.getElementById('hvac-name');
    const emailInput = document.getElementById('hvac-email');
    const phoneInput = document.getElementById('hvac-phone');
    const messageInput = document.getElementById('hvac-message');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name) {
      alert('Please enter your name');
      return;
    }
    
    if (!message) {
      alert('Please enter a message');
      return;
    }
    
    // Store user info
    userInfo = { name, email, phone };
    
    // Add user message to chat
    addMessage(message, true);
    
    // Submit to API
    submitMessageToApi(name, email, phone, message);
    
    // Mark form as submitted
    isContactFormSubmitted = true;
    
    // Update UI to show chat input
    showContactForm();
  }

  // Send a chat message
  function sendMessage() {
    const messageInput = document.getElementById('hvac-chat-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, true);
    
    // Clear input
    messageInput.value = '';
    
    // Send to API
    submitMessageToApi(userInfo.name, userInfo.email, userInfo.phone, message);
  }

  // Submit message to API
  function submitMessageToApi(name, email, phone, message) {
    fetch(`/api/messages/${companySlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, message })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    })
    .then(data => {
      console.log('Message sent successfully:', data);
      
      // If we want to use the AI for responses:
      getAIResponse(message);
    })
    .catch(error => {
      console.error('Error sending message:', error);
      addMessage('Sorry, there was an error sending your message. Please try again later.', false);
    });
  }

  // Get AI response using Anthropic's Claude
  function getAIResponse(userMessage) {
    fetch('/api/chat-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userMessage,
        companyName
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      return response.json();
    })
    .then(data => {
      if (data.reply) {
        addMessage(data.reply, false);
      }
    })
    .catch(error => {
      console.error('Error getting AI response:', error);
      addMessage('I\'ll pass your message to our team. Someone will get back to you soon!', false);
    });
  }

  // Expose public API
  window.HVACChatWidget = {
    init: initWidget
  };
})();