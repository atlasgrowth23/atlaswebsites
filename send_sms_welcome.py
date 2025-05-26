#!/usr/bin/env python3
"""
Atlas Growth - SMS Welcome Message Script
This script sends welcome messages to users who opted in via the website
"""

import os
import sys
from twilio.rest import Client

# Twilio credentials from environment variables
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN") 
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

def send_welcome_sms(to_phone_number: str, business_name: str = "Atlas Growth") -> bool:
    """
    Send a welcome SMS to a new subscriber
    
    Args:
        to_phone_number: The recipient's phone number
        business_name: Name of the business (default: Atlas Growth)
    
    Returns:
        bool: True if message sent successfully, False otherwise
    """
    
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        print("❌ Missing Twilio credentials. Please set environment variables:")
        print("   - TWILIO_ACCOUNT_SID")
        print("   - TWILIO_AUTH_TOKEN") 
        print("   - TWILIO_PHONE_NUMBER")
        return False
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        welcome_message = f"""🚀 Welcome to {business_name}!

Thanks for joining our SMS list. You'll receive:
• Exclusive business growth tips
• Early access to new features  
• Special offers for home service businesses

Reply STOP to opt out anytime.

Ready to grow your business? Let's do this! 💪"""

        message = client.messages.create(
            body=welcome_message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone_number
        )
        
        print(f"✅ Welcome SMS sent successfully!")
        print(f"   Message SID: {message.sid}")
        print(f"   To: {to_phone_number}")
        print(f"   Status: {message.status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send SMS: {str(e)}")
        return False

def send_business_tip_sms(to_phone_number: str) -> bool:
    """
    Send a business growth tip SMS
    
    Args:
        to_phone_number: The recipient's phone number
    
    Returns:
        bool: True if message sent successfully, False otherwise
    """
    
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        print("❌ Missing Twilio credentials")
        return False
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        tip_message = """💡 Atlas Growth Tip of the Day:

Did you know that businesses with 50+ Google reviews get 35% more clicks?

Our Google Review Automation can help you:
✓ Get more reviews automatically  
✓ Respond to reviews quickly
✓ Boost your local search ranking

Want to learn more? Reply "DEMO" for a free consultation!

Reply STOP to opt out."""

        message = client.messages.create(
            body=tip_message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone_number
        )
        
        print(f"✅ Business tip SMS sent successfully!")
        print(f"   Message SID: {message.sid}")
        print(f"   To: {to_phone_number}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send SMS: {str(e)}")
        return False

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python send_sms_welcome.py <phone_number>")
        print("  python send_sms_welcome.py <phone_number> tip")
        print("")
        print("Examples:")
        print("  python send_sms_welcome.py +1234567890")
        print("  python send_sms_welcome.py +1234567890 tip")
        return
    
    phone_number = sys.argv[1]
    message_type = sys.argv[2] if len(sys.argv) > 2 else "welcome"
    
    print(f"📱 Sending {message_type} SMS to {phone_number}...")
    
    if message_type == "tip":
        success = send_business_tip_sms(phone_number)
    else:
        success = send_welcome_sms(phone_number)
    
    if success:
        print("🎉 SMS sent successfully!")
    else:
        print("💥 Failed to send SMS")

if __name__ == "__main__":
    main()