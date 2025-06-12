import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { getGmailClient } from '../../../../lib/googleClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { kind, to, subject, body, threadId } = req.body;

    if (!kind || !body) {
      return res.status(400).json({ error: 'Kind and body are required' });
    }

    if (kind === 'email' && (!to || !subject)) {
      return res.status(400).json({ error: 'Email requires to and subject fields' });
    }

    // Get current user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    let gmailMessageId = null;
    let messageThreadId = threadId;

    if (kind === 'note') {
      // Create internal note
      const { data: message, error } = await supabase
        .from('admin_messages')
        .insert({
          thread_id: threadId,
          kind: 'note',
          author_id: user.id,
          body_html: body,
          direction: null,
          gmail_message_id: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      return res.status(201).json({ message });
    } 
    
    if (kind === 'email') {
      try {
        // Send via Gmail API
        const gmail = await getGmailClient(user.id);
        
        // Create email content
        const emailLines = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          body
        ];
        
        const email = emailLines.join('\r\n');
        const encodedEmail = Buffer.from(email).toString('base64url');
        
        const sendRequest: any = {
          raw: encodedEmail
        };
        
        // If replying to a thread, include threadId
        if (threadId) {
          sendRequest.threadId = threadId;
        }
        
        const { data: gmailResponse } = await gmail.users.messages.send({
          userId: 'me',
          requestBody: sendRequest
        });
        
        gmailMessageId = gmailResponse.id;
        messageThreadId = gmailResponse.threadId;
        
        // Store outbound email in database
        const { data: message, error } = await supabase
          .from('admin_messages')
          .insert({
            thread_id: messageThreadId,
            kind: 'email',
            direction: 'outbound', 
            author_id: user.id,
            body_html: body,
            subject: subject,
            to_email: to,
            gmail_message_id: gmailMessageId,
            gmail_thread_id: messageThreadId
          })
          .select()
          .single();

        if (error) {
          console.error('Error storing sent email:', error);
          return res.status(500).json({ error: 'Email sent but failed to store in database' });
        }

        return res.status(201).json({ message, gmailMessageId });
        
      } catch (gmailError) {
        console.error('Gmail send error:', gmailError);
        return res.status(500).json({ error: 'Failed to send email via Gmail' });
      }
    }

    return res.status(400).json({ error: 'Invalid kind - must be note or email' });
  } catch (error) {
    console.error('Send message API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}