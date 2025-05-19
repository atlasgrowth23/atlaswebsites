/**
 * Simple HVAC Website Chat Widget
 * This widget can be added to any website to provide a chat interface for potential customers.
 */
(function() {
  // Configuration
  let companySlug = '';
  let companyName = '';
  
  // Initialize widget
  function init(config) {
    companySlug = config.slug || '';
    companyName = config.name || 'HVAC Company';
    
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
          <div id="hvac-close-chat" style="cursor: pointer;">×</div>
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
        
        <!-- Contact form -->
        <div style="
          padding: 15px;
          border-top: 1px solid #eee;
        ">
          <form id="hvac-contact-form">
            <div style="margin-bottom: 8px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Name *</label>
              <input type="text" id="hvac-name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 8px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Email</label>
              <input type="email" id="hvac-email" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 8px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Phone</label>
              <input type="tel" id="hvac-phone" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">Message *</label>
              <textarea id="hvac-message" required rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
            </div>
            
            <button type="submit" style="
              width: 100%;
              background-color: #1e3a8a;
              color: white;
              border: none;
              padding: 10px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
            ">Send Message</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(chatWindow);
    
    // Add event listeners
    document.getElementById('hvac-chat-button').addEventListener('click', toggleChat);
    document.getElementById('hvac-close-chat').addEventListener('click', toggleChat);
    document.getElementById('hvac-contact-form').addEventListener('submit', submitForm);
    
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
  
  // Handle form submission
  function submitForm(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('hvac-name').value;
    const email = document.getElementById('hvac-email').value;
    const phone = document.getElementById('hvac-phone').value;
    const message = document.getElementById('hvac-message').value;
    
    console.log("Form submitted:", { name, email, phone, message });
    
    // Add user message to chat
    const messagesContainer = document.getElementById('hvac-messages');
    messagesContainer.innerHTML += `
      <div style="
        background-color: #e3f0ff;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        margin-left: auto;
        max-width: 80%;
      ">
        ${message}
      </div>
    `;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Send message to API
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
      
      // Add response message
      messagesContainer.innerHTML += `
        <div style="
          background-color: #f1f1f1;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 10px;
          max-width: 80%;
        ">
          Thank you for your message! We'll get back to you as soon as possible.
        </div>
      `;
      
      // Clear form
      document.getElementById('hvac-contact-form').reset();
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    })
    .catch(error => {
      console.error('Error sending message:', error);
      
      // Add error message
      messagesContainer.innerHTML += `
        <div style="
          background-color: #f1f1f1;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 10px;
          max-width: 80%;
        ">
          Sorry, there was an error sending your message. Please try again later.
        </div>
      `;
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }
  
  // Expose public API
  window.HVACChatWidget = {
    init: init
  };
})();;