/**
 * Advanced HVAC Website Chat Widget with AI Integration
 * This widget provides an interactive chat interface with smart buttons,
 * free-form questions, and AI-powered responses.
 */
(function() {
  // Configuration
  let companySlug = '';
  let companyName = '';
  
  // State
  let contactId = null;
  let contactCollected = false;
  let messagesHistory = [];
  let messageCount = 0;
  let sessionId = null;
  
  // Initialize widget
  function init(config) {
    companySlug = config.slug || '';
    companyName = config.name || 'HVAC Company';
    
    // Generate a unique session ID for this chat conversation
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    console.log("Chat widget initializing for: ", companyName, companySlug);
    
    // Create and add the chat button to the page
    const chatButton = document.createElement('div');
    chatButton.id = 'hvac-chat-button';
    chatButton.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background-color: #1e3a8a;
        border-radius: 50%;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
    `;
    document.body.appendChild(chatButton);
    
    // Create the chat window (initially hidden)
    const chatWindow = document.createElement('div');
    chatWindow.id = 'hvac-chat-window';
    chatWindow.style.display = 'none';
    chatWindow.innerHTML = `
      <div style="
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 450px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 9999;
        font-family: Arial, sans-serif;
      ">
        <!-- Chat header -->
        <div style="
          background-color: #1e3a8a;
          color: white;
          padding: 15px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>Chat with ${companyName}</div>
          <div id="hvac-close-chat" style="cursor: pointer; font-size: 20px;">×</div>
        </div>
        
        <!-- Chat area -->
        <div id="hvac-messages" style="
          flex: 1;
          padding: 15px;
          overflow-y: auto;
        ">
          <div style="
            background-color: #f1f1f1;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
            max-width: 80%;
          ">
            Hello! How can we help with your HVAC needs today?
          </div>
        </div>
        
        <!-- Quick buttons -->
        <div id="hvac-quick-buttons" style="
          padding: 0 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        ">
          <button class="hvac-quick-button" data-message="I need a quote for a new HVAC system" style="
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
          ">Get Quote</button>
          
          <button class="hvac-quick-button" data-message="I need maintenance for my HVAC system" style="
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
          ">Maintenance</button>
          
          <button class="hvac-quick-button" data-message="My AC isn't working properly" style="
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
          ">Repair Service</button>
        </div>
        
        <!-- Chat input -->
        <div id="hvac-chat-input-area" style="
          padding: 15px;
          border-top: 1px solid #eee;
        ">
          <form id="hvac-message-form" style="
            display: flex;
            gap: 8px;
          ">
            <input type="text" id="hvac-input-message" placeholder="Type your message..." style="
              flex: 1;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
            ">
            <button type="submit" style="
              background-color: #1e3a8a;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 15px;
              cursor: pointer;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
        
        <!-- Contact form (initially hidden) -->
        <div id="hvac-contact-form-area" style="display: none; padding: 15px; border-top: 1px solid #eee;">
          <p style="margin-top: 0; margin-bottom: 10px; font-size: 14px;">Please share your contact info so we can help you better:</p>
          <form id="hvac-contact-form">
            <div style="margin-bottom: 8px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Name *</label>
              <input type="text" id="hvac-name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 8px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Email</label>
              <input type="email" id="hvac-email" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Phone</label>
              <input type="tel" id="hvac-phone" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button type="button" id="hvac-skip-contact" style="
                flex: 1;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
              ">Skip</button>
              
              <button type="submit" style="
                flex: 2;
                background-color: #1e3a8a;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
              ">Continue</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(chatWindow);
    
    // Add event listeners
    document.getElementById('hvac-chat-button').addEventListener('click', toggleChat);
    document.getElementById('hvac-close-chat').addEventListener('click', toggleChat);
    document.getElementById('hvac-message-form').addEventListener('submit', handleMessage);
    document.getElementById('hvac-contact-form').addEventListener('submit', submitContactInfo);
    document.getElementById('hvac-skip-contact').addEventListener('click', skipContactInfo);
    
    // Add event listeners to quick buttons
    const quickButtons = document.querySelectorAll('.hvac-quick-button');
    quickButtons.forEach(button => {
      button.addEventListener('click', function() {
        const message = this.getAttribute('data-message');
        sendUserMessage(message);
      });
    });
    
    console.log("Chat widget initialized successfully");
  }
  
  // Toggle chat visibility
  function toggleChat() {
    console.log("Toggling chat window");
    const chatWindow = document.getElementById('hvac-chat-window');
    if (chatWindow.style.display === 'none') {
      chatWindow.style.display = 'block';
    } else {
      chatWindow.style.display = 'none';
    }
  }
  
  // Handle user message submission
  function handleMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('hvac-input-message');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    sendUserMessage(message);
    messageInput.value = '';
  }
  
  // Send user message to API and display in chat
  function sendUserMessage(message) {
    // Add user message to chat
    addMessageToChat(message, true);
    
    // If contact info hasn't been collected yet, show the form immediately
    if (!contactCollected) {
      // Show a specific response based on their inquiry
      let responseText = "";
      
      if (message.toLowerCase().includes("quote")) {
        responseText = "I'd be happy to help you get a quote for a new HVAC system. To connect you with our team, please provide your contact information below:";
      } else if (message.toLowerCase().includes("maintenance")) {
        responseText = "Regular maintenance is essential for your HVAC system. To schedule a maintenance visit, please share your contact details below:";
      } else if (message.toLowerCase().includes("repair") || message.toLowerCase().includes("isn't working")) {
        responseText = "I'm sorry to hear you're having issues. To get help with repairs, please provide your contact information below:";
      } else {
        responseText = "Thank you for your message. To help you better, please share your contact information below:";
      }
      
      // Add system response
      addMessageToChat(responseText, false);
      
      // Store message in database
      fetch(`/api/messages/${companySlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: 'Website Visitor', 
          email: null, 
          phone: null, 
          message: message,
          session_id: sessionId
        })
      });
      
      // Show contact form
      showContactForm();
      return;
    }
    
    // If we already have contact info, send message to API for AI response
    sendMessageToAPI(message);
  }
  
  // Add message to chat UI
  function addMessageToChat(message, isUser) {
    const messagesContainer = document.getElementById('hvac-messages');
    messagesContainer.innerHTML += `
      <div style="
        background-color: ${isUser ? '#e3f0ff' : '#f1f1f1'};
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        margin-left: ${isUser ? 'auto' : '0'};
        max-width: 80%;
      ">
        ${message}
      </div>
    `;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Send message to API and get AI response
  function sendMessageToAPI(message) {
    // Add loading indicator
    const messagesContainer = document.getElementById('hvac-messages');
    const loadingId = 'loading-' + Date.now();
    messagesContainer.innerHTML += `
      <div id="${loadingId}" style="
        background-color: #f1f1f1;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        max-width: 80%;
      ">
        <div style="display: flex; gap: 4px; align-items: center;">
          <div style="width: 8px; height: 8px; background-color: #999; border-radius: 50%; animation: pulse 1s infinite;"></div>
          <div style="width: 8px; height: 8px; background-color: #999; border-radius: 50%; animation: pulse 1s infinite 0.2s;"></div>
          <div style="width: 8px; height: 8px; background-color: #999; border-radius: 50%; animation: pulse 1s infinite 0.4s;"></div>
        </div>
      </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Create loading animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { opacity: 0.4; }
        50% { opacity: 1; }
        100% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
    
    // First, store the user message
    fetch(`/api/messages/${companySlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: contactCollected ? '' : 'Website Visitor', 
        email: null, 
        phone: null, 
        message,
        session_id: sessionId
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    })
    .then(data => {
      console.log('Message sent successfully:', data);
      
      // Then, get AI response
      return fetch('/api/ai-chat-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message,
          companySlug,
          contactId
        })
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      return response.json();
    })
    .then(data => {
      console.log('AI response received:', data);
      
      // Remove loading indicator
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
      
      // Add AI response to chat
      addMessageToChat(data.reply, false);
    })
    .catch(error => {
      console.error('Error in chat flow:', error);
      
      // Remove loading indicator
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
      
      // Add error message
      addMessageToChat('Sorry, I\'m having trouble responding right now. Please try again or leave your contact info so our team can help you.', false);
    });
  }
  
  // Show contact form
  function showContactForm() {
    document.getElementById('hvac-chat-input-area').style.display = 'none';
    document.getElementById('hvac-quick-buttons').style.display = 'none';
    document.getElementById('hvac-contact-form-area').style.display = 'block';
  }
  
  // Show chat input
  function showChatInput() {
    document.getElementById('hvac-contact-form-area').style.display = 'none';
    document.getElementById('hvac-chat-input-area').style.display = 'block';
    document.getElementById('hvac-quick-buttons').style.display = 'flex';
  }
  
  // Submit contact form
  function submitContactInfo(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('hvac-name').value;
    const email = document.getElementById('hvac-email').value;
    const phone = document.getElementById('hvac-phone').value;
    
    console.log("Contact info submitted:", { name, email, phone });
    
    // Mark contact as collected
    contactCollected = true;
    
    // Create contact in database
    fetch(`/api/messages/${companySlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name, 
        email, 
        phone, 
        message: `Contact info submitted: ${name}, ${email || 'No email'}, ${phone || 'No phone'}`
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Contact created:', data);
      
      if (data.contact_id) {
        contactId = data.contact_id;
      }
      
      // Thank the user and prompt for additional details
      addMessageToChat(`Thanks ${name}! Is there anything specific we should know about your HVAC needs to better assist you?`, false);
      
      // Show the chat input again
      showChatInput();
      
      // Hide quick buttons - we want them to provide more details now
      document.getElementById('hvac-quick-buttons').style.display = 'none';
      
      // Add event listener for the next message
      const messageForm = document.getElementById('hvac-message-form');
      const originalSubmit = messageForm.onsubmit;
      
      messageForm.onsubmit = function(event) {
        event.preventDefault();
        
        const messageInput = document.getElementById('hvac-input-message');
        const additionalDetails = messageInput.value.trim();
        
        if (!additionalDetails) return;
        
        // Add user message to chat
        addMessageToChat(additionalDetails, true);
        messageInput.value = '';
        
        // Store the additional details
        fetch(`/api/messages/${companySlug}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            name, 
            email, 
            phone, 
            message: additionalDetails 
          })
        });
        
        // Show final message
        addMessageToChat(`Thank you for providing those details. A member of our team will contact you shortly to discuss your HVAC needs. If you have any urgent questions, please call us at ${companySlug === 'temperaturepro' ? '(555) 123-4567' : '(555) 987-6543'}.`, false);
        
        // Replace input with a message
        document.getElementById('hvac-chat-input-area').innerHTML = `
          <div style="text-align: center; padding: 10px; color: #666; font-size: 14px;">
            Chat session complete. You can close this window.
          </div>
        `;
      };
    })
    .catch(error => {
      console.error('Error creating contact:', error);
      
      // Still thank the user and prompt them
      addMessageToChat(`Thanks ${name}! Is there anything specific we should know about your HVAC needs to better assist you?`, false);
      showChatInput();
    });
  }
  
  // Skip contact form
  function skipContactInfo() {
    contactCollected = true; // Mark as collected so we don't show the form again
    addMessageToChat('No problem! How can we help you today?', false);
    showChatInput();
  }
  
  // Expose public API
  window.HVACChatWidget = {
    init: init
  };
})();;