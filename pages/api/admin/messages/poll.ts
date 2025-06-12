import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { getGmailClient } from '../../../../lib/googleClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const gmail = await getGmailClient(user.id);
    
    // Get the last synced message ID from database
    const { data: lastMessage } = await supabase
      .from('admin_messages')
      .select('gmail_message_id')
      .eq('author_id', user.id)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // List threads (inbox)
    const { data: threadsResponse } = await gmail.users.threads.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 50
    });

    if (!threadsResponse.threads) {
      return res.status(200).json({ synced: 0, message: 'No threads found' });
    }

    let syncedCount = 0;

    for (const thread of threadsResponse.threads) {
      try {
        // Get thread details
        const { data: threadData } = await gmail.users.threads.get({
          userId: 'me',
          id: thread.id!
        });

        if (!threadData.messages) continue;

        // Process each message in the thread
        for (const message of threadData.messages) {
          // Skip if we already have this message
          const { data: existingMessage } = await supabase
            .from('admin_messages')
            .select('id')
            .eq('gmail_message_id', message.id)
            .single();

          if (existingMessage) continue;

          // Parse message headers
          const headers = message.payload?.headers || [];
          const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
          
          const subject = getHeader('subject');
          const from = getHeader('from');
          const to = getHeader('to');
          const date = getHeader('date');

          // Get message body
          let bodyHtml = '';
          if (message.payload?.parts) {
            // Multipart message
            const htmlPart = message.payload.parts.find(part => part.mimeType === 'text/html');
            if (htmlPart?.body?.data) {
              bodyHtml = Buffer.from(htmlPart.body.data, 'base64url').toString('utf-8');
            }
          } else if (message.payload?.body?.data) {
            // Simple message
            bodyHtml = Buffer.from(message.payload.body.data, 'base64url').toString('utf-8');
          }

          // Check if this is an inbound message (not sent by us)
          const isInbound = !message.labelIds?.includes('SENT');
          
          if (isInbound) {
            // Store inbound email
            const { error: insertError } = await supabase
              .from('admin_messages')
              .insert({
                thread_id: null, // Will be set when we create thread management
                kind: 'email',
                direction: 'inbound',
                author_id: null, // External sender
                body_html: bodyHtml,
                subject: subject,
                from_email: from,
                to_email: to,
                gmail_message_id: message.id,
                gmail_thread_id: thread.id,
                received_at: date ? new Date(date).toISOString() : new Date().toISOString()
              });

            if (!insertError) {
              syncedCount++;
            } else {
              console.error('Error inserting message:', insertError);
            }
          }
        }
      } catch (threadError) {
        console.error('Error processing thread:', threadError);
        continue;
      }
    }

    res.status(200).json({ 
      synced: syncedCount, 
      message: `Synced ${syncedCount} new inbound emails` 
    });

  } catch (error) {
    console.error('Gmail poll error:', error);
    res.status(500).json({ error: 'Failed to poll Gmail inbox' });
  }
}