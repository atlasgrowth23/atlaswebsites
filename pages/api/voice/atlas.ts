import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';
import { supabaseAdmin } from '../../../lib/supabase';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// Fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function findContact(spokenName: string, contacts: any[]): any | null {
  const matches = contacts.map(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const distance = levenshteinDistance(spokenName.toLowerCase(), fullName);
    const similarity = 1 - (distance / Math.max(spokenName.length, fullName.length));
    
    return {
      contact,
      similarity,
      distance
    };
  }).sort((a, b) => b.similarity - a.similarity);

  // Return best match if similarity > 70%
  return matches[0]?.similarity > 0.7 ? matches[0].contact : null;
}

async function classifyIntent(transcript: string, tenantId: string) {
  // Pre-process transcript to handle "Hey Atlas" wake words
  const cleanTranscript = transcript
    .replace(/^(hey\s+|sup\s+)?atlas[,\s]*/i, '')
    .replace(/^(hey\s+|sup\s+)?atlas$/i, 'help')
    .trim();

  if (!cleanTranscript || cleanTranscript.length < 3) {
    return {
      intent: 'help',
      confidence: 0.95,
      data: {},
      message: 'Sup! I can help with contacts, equipment, notes, and directions. What do you need?'
    };
  }

  // Get current contacts for context
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('first_name, last_name, phone, equip_type, serial_number, model_number')
    .eq('tenant_id', tenantId)
    .limit(10);

  const contactNames = contacts?.map(c => `${c.first_name} ${c.last_name}`).join(', ') || 'none';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You're Atlas, an HVAC voice assistant. Classify conversational commands into intents and extract data. Be natural and flexible.

CURRENT CONTACTS: ${contactNames}

INTENTS:
- create_contact: Creating new customer records
- update_contact_field: Changing existing customer data  
- add_note: Adding notes to customers
- distance_to_contact: Getting directions/distance to customers
- lookup_contact: Finding/viewing customer information
- help: Greetings, unclear requests

NATURAL EXAMPLES:
"sup atlas" → {"intent":"help","confidence":0.95,"data":{}}
"create a contact for James Smith" → {"intent":"create_contact","confidence":0.95,"data":{"name":"James Smith"}}
"do you see the contact named Sandy Sanders?" → {"intent":"lookup_contact","confidence":0.92,"data":{"contact_name":"Sandy Sanders"}}
"what's James Smith's serial number?" → {"intent":"lookup_contact","confidence":0.90,"data":{"contact_name":"James Smith","field_requested":"serial_number"}}
"can we change it to AB-99999?" → {"intent":"update_contact_field","confidence":0.85,"data":{"field_name":"serial_number","field_value":"AB-99999"}}
"note for Sandy: customer called about noise" → {"intent":"add_note","confidence":0.88,"data":{"contact_name":"Sandy","note_text":"customer called about noise"}}
"how far to Sandy's place?" → {"intent":"distance_to_contact","confidence":0.90,"data":{"contact_name":"Sandy Sanders"}}

Return JSON only. Be flexible with name variations and context.`
      },
      {
        role: 'user',
        content: cleanTranscript
      }
    ],
    temperature: 0.1,
    max_tokens: 200
  });

  try {
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      intent: 'unknown',
      confidence: 0.0,
      data: {},
      error: 'Failed to parse classification'
    };
  }
}

async function executeCommand(classification: any, tenantId: string) {
  const { intent, data, confidence } = classification;

  // Confidence threshold check
  const thresholds = {
    create_contact: 0.8,
    update_contact_field: 0.85,
    add_note: 0.7,
    distance_to_contact: 0.75
  };

  if (confidence < thresholds[intent as keyof typeof thresholds]) {
    return {
      success: false,
      error: `Low confidence (${Math.round(confidence * 100)}%). Please speak more clearly.`,
      response: 'I didn\'t quite catch that. Could you repeat your request?'
    };
  }

  try {
    switch (intent) {
      case 'create_contact':
        return await handleCreateContact(data, tenantId);
      
      case 'update_contact_field':
        return await handleUpdateContactField(data, tenantId);
      
      case 'add_note':
        return await handleAddNote(data, tenantId);
      
      case 'distance_to_contact':
        return await handleDistanceToContact(data, tenantId);
      
      case 'lookup_contact':
        return await handleLookupContact(data, tenantId);
      
      case 'help':
        return {
          success: true,
          data: {},
          response: classification.message || 'Sup! I can create contacts, update info, add notes, lookup customers, or get directions. What do you need?'
        };
      
      default:
        return {
          success: false,
          error: `Unknown intent: ${intent}`,
          response: 'I didn\'t catch that. Try: "Create contact for...", "What\'s [name]\'s info?", "Update [name]\'s...", or "How far to [name]?"'
        };
    }
  } catch (error) {
    console.error(`Error executing ${intent}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'Sorry, there was an error processing your request.'
    };
  }
}

async function handleCreateContact(data: any, tenantId: string) {
  const { name, phone, email, equipment_type, serial_number, address } = data;

  if (!name) {
    return {
      success: false,
      error: 'Name is required for new contact',
      response: 'I need at least a name to create a new contact.'
    };
  }

  // Parse name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const newContact = {
    tenant_id: tenantId,
    first_name: firstName,
    last_name: lastName,
    phone: phone || '',
    email: email || '',
    equip_type: equipment_type || '',
    serial_number: serial_number || '',
    notes: `Created via voice on ${new Date().toLocaleDateString()}`
  };

  const { data: contact, error } = await supabaseAdmin
    .from('contacts')
    .insert(newContact)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return {
    success: true,
    data: contact,
    response: `Contact created for ${firstName} ${lastName}.`
  };
}

async function handleUpdateContactField(data: any, tenantId: string) {
  const { contact_name, field_name, field_value } = data;

  if (!contact_name || !field_name || !field_value) {
    return {
      success: false,
      error: 'Missing required data for update',
      response: 'I need the contact name, field name, and new value.'
    };
  }

  // Find contact
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId);

  const contact = findContact(contact_name, contacts || []);
  
  if (!contact) {
    return {
      success: false,
      error: 'Contact not found',
      response: `I couldn't find a contact named ${contact_name}.`
    };
  }

  // Map field names to database columns
  const fieldMap: { [key: string]: string } = {
    'serial number': 'serial_number',
    'serial': 'serial_number',
    'model number': 'model_number',
    'model': 'model_number',
    'filter size': 'filter_size',
    'filter': 'filter_size',
    'phone': 'phone',
    'email': 'email',
    'equipment type': 'equip_type',
    'equipment': 'equip_type'
  };

  const dbField = fieldMap[field_name.toLowerCase()] || field_name.toLowerCase();

  const { error } = await supabaseAdmin
    .from('contacts')
    .update({ [dbField]: field_value })
    .eq('id', contact.id);

  if (error) {
    throw new Error(`Update failed: ${error.message}`);
  }

  return {
    success: true,
    data: { contact, field: dbField, value: field_value },
    response: `Updated ${contact.first_name} ${contact.last_name}'s ${field_name}.`
  };
}

async function handleAddNote(data: any, tenantId: string) {
  const { contact_name, note_text } = data;

  if (!contact_name || !note_text) {
    return {
      success: false,
      error: 'Missing contact name or note text',
      response: 'I need both a contact name and the note content.'
    };
  }

  // Find contact
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId);

  const contact = findContact(contact_name, contacts || []);
  
  if (!contact) {
    return {
      success: false,
      error: 'Contact not found',
      response: `I couldn't find a contact named ${contact_name}.`
    };
  }

  // Append note with timestamp
  const currentNotes = contact.notes || '';
  const timestamp = new Date().toLocaleDateString();
  const newNote = `${timestamp}: ${note_text}`;
  const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;

  const { error } = await supabaseAdmin
    .from('contacts')
    .update({ notes: updatedNotes })
    .eq('id', contact.id);

  if (error) {
    throw new Error(`Note update failed: ${error.message}`);
  }

  return {
    success: true,
    data: { contact, note: newNote },
    response: `Note added for ${contact.first_name} ${contact.last_name}.`
  };
}

async function calculateDistance(userLat: number, userLng: number, contactLat: number, contactLng: number) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${userLat},${userLng}&` +
      `destinations=${contactLat},${contactLng}&` +
      `units=imperial&` +
      `key=${apiKey}`
    );

    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.text,
        duration: element.duration.text,
        distanceValue: element.distance.value, // meters
        durationValue: element.duration.value  // seconds
      };
    } else {
      throw new Error('Distance calculation failed');
    }
  } catch (error) {
    console.error('Distance API error:', error);
    // Fallback to straight-line distance
    const R = 3959; // Earth radius in miles
    const dLat = (contactLat - userLat) * Math.PI / 180;
    const dLng = (contactLng - userLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(contactLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const miles = R * c;
    
    return {
      distance: `${Math.round(miles * 10) / 10} mi`,
      duration: `${Math.round(miles * 2.5)} min`,
      distanceValue: miles * 1609.34, // convert to meters
      durationValue: miles * 150 // ~2.5 min per mile = 150 seconds
    };
  }
}

async function handleLookupContact(data: any, tenantId: string) {
  const { contact_name, field_requested } = data;

  if (!contact_name) {
    return {
      success: false,
      error: 'Missing contact name',
      response: 'Which customer are you looking for?'
    };
  }

  // Find contact
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId);

  const contact = findContact(contact_name, contacts || []);
  
  if (!contact) {
    return {
      success: false,
      error: 'Contact not found',
      response: `I don't see a customer named ${contact_name}. Want me to create them?`
    };
  }

  // If asking for specific field
  if (field_requested) {
    const fieldMap: { [key: string]: string } = {
      'serial number': 'serial_number',
      'serial': 'serial_number',
      'model number': 'model_number',
      'model': 'model_number',
      'filter size': 'filter_size',
      'filter': 'filter_size',
      'phone': 'phone',
      'email': 'email',
      'address': 'address',
      'equipment': 'equip_type'
    };

    const dbField = fieldMap[field_requested.toLowerCase()] || field_requested.toLowerCase();
    const value = contact[dbField];

    if (!value) {
      return {
        success: true,
        data: { contact, field: dbField },
        response: `${contact.first_name} ${contact.last_name} doesn't have a ${field_requested} set yet.`
      };
    }

    return {
      success: true,
      data: { contact, field: dbField, value },
      response: `${contact.first_name} ${contact.last_name}'s ${field_requested} is ${value}.`
    };
  }

  // General contact info
  const info = [];
  if (contact.phone) info.push(`phone ${contact.phone}`);
  if (contact.address?.formatted) info.push(`located at ${contact.address.formatted}`);
  if (contact.equip_type && contact.serial_number) {
    info.push(`has a ${contact.equip_type.replace('_', ' ')} with serial ${contact.serial_number}`);
  }
  if (contact.notes) {
    const shortNotes = contact.notes.substring(0, 50);
    info.push(`notes: ${shortNotes}${contact.notes.length > 50 ? '...' : ''}`);
  }

  const response = info.length > 0 
    ? `Yes, ${contact.first_name} ${contact.last_name} - ${info.join(', ')}.`
    : `Yes, I have ${contact.first_name} ${contact.last_name} but no details yet.`;

  return {
    success: true,
    data: { contact },
    response
  };
}

async function handleDistanceToContact(data: any, tenantId: string) {
  const { contact_name, user_location } = data;

  if (!contact_name) {
    return {
      success: false,
      error: 'Missing contact name',
      response: 'Which contact do you want directions to?'
    };
  }

  // Find contact
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId);

  const contact = findContact(contact_name, contacts || []);
  
  if (!contact) {
    return {
      success: false,
      error: 'Contact not found',
      response: `I couldn't find a contact named ${contact_name}.`
    };
  }

  if (!contact.lat || !contact.lng) {
    return {
      success: false,
      error: 'Contact location not available',
      response: `${contact.first_name} ${contact.last_name}'s address hasn't been geocoded yet.`
    };
  }

  // If user location provided, calculate real distance
  if (user_location?.lat && user_location?.lng) {
    try {
      const distanceInfo = await calculateDistance(
        user_location.lat,
        user_location.lng,
        contact.lat,
        contact.lng
      );

      return {
        success: true,
        data: { 
          contact,
          ...distanceInfo,
          directions_url: `https://www.google.com/maps/dir/?api=1&origin=${user_location.lat},${user_location.lng}&destination=${contact.lat},${contact.lng}`
        },
        response: `About ${distanceInfo.duration}, ${distanceInfo.distance} to ${contact.first_name} ${contact.last_name}. Should I open directions?`,
        follow_up: 'directions'
      };
    } catch (error) {
      console.error('Distance calculation failed:', error);
    }
  }

  // Fallback: provide general location info without user's location
  return {
    success: true,
    data: { 
      contact,
      directions_url: `https://www.google.com/maps/dir/?api=1&destination=${contact.lat},${contact.lng}`
    },
    response: `${contact.first_name} ${contact.last_name} is located at ${contact.address?.formatted || 'their address'}. Should I open directions?`,
    follow_up: 'directions'
  };
}

async function logVoiceCommand(
  tenantId: string,
  transcript: string,
  intent: string,
  confidence: number,
  success: boolean,
  errorMessage?: string,
  responseTime?: number
) {
  try {
    // For now, just log - will implement voice_logs table creation later
    console.log('Voice Log:', {
      tenant_id: tenantId,
      transcript,
      intent,
      confidence,
      success,
      error_message: errorMessage,
      response_time_ms: responseTime
    });
  } catch (error) {
    console.error('Failed to log voice command:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Parse the uploaded audio file
    const form = new IncomingForm();
    const [fields, files] = await form.parse(req);
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Extract user location if provided
    const userLat = fields.user_lat ? parseFloat(Array.isArray(fields.user_lat) ? fields.user_lat[0] : fields.user_lat) : null;
    const userLng = fields.user_lng ? parseFloat(Array.isArray(fields.user_lng) ? fields.user_lng[0] : fields.user_lng) : null;
    const userLocation = (userLat && userLng) ? { lat: userLat, lng: userLng } : null;

    // Transcribe with Whisper
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    const audioFileForAPI = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForAPI,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    const transcript = transcription.trim();
    console.log('Atlas Voice Transcript:', transcript);

    if (!transcript) {
      return res.status(400).json({ 
        error: 'Could not transcribe audio',
        transcript: '',
        success: false
      });
    }

    // Classify intent with GPT-4o
    const tenantId = process.env.DEV_TENANT_ID || 'fb8681ab-f3e3-46c4-85b2-ea4aa0816adf';
    const classification = await classifyIntent(transcript, tenantId);
    console.log('Atlas Voice Classification:', classification);

    // Execute command with user location context
    
    // Add user location to classification data for distance calculations
    if (userLocation && classification.intent === 'distance_to_contact') {
      classification.data.user_location = userLocation;
    }
    
    const result = await executeCommand(classification, tenantId);

    const responseTime = Date.now() - startTime;

    // Log the voice command
    await logVoiceCommand(
      tenantId,
      transcript,
      classification.intent,
      classification.confidence,
      result.success,
      result.error,
      responseTime
    );

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json({
      transcript,
      intent: classification.intent,
      confidence: classification.confidence,
      success: result.success,
      response: result.response,
      data: result.data,
      error: result.error,
      follow_up: result.follow_up,
      response_time: responseTime
    });

  } catch (error) {
    console.error('Atlas Voice API Error:', error);
    
    const responseTime = Date.now() - startTime;
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      transcript: '',
      success: false,
      response_time: responseTime
    });
  }
}