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

async function classifyIntent(transcript: string) {
  // Pre-process transcript to handle "Hey Atlas" wake words
  const cleanTranscript = transcript
    .replace(/^(hey\s+)?atlas[,\s]*/i, '')
    .replace(/^(hey\s+)?atlas$/i, 'help')
    .trim();

  if (!cleanTranscript || cleanTranscript.length < 3) {
    return {
      intent: 'help',
      confidence: 0.95,
      data: {},
      message: 'I\'m here! Try: "Add contact...", "Update [name]\'s...", "Note for [name]...", or "How far to [name]?"'
    };
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Faster model
    messages: [
      {
        role: 'system',
        content: `Classify HVAC voice commands. Return JSON only:

INTENTS:
- create_contact: "add contact [name] [phone] [email] [equipment]"
- update_contact_field: "update [name]'s [field] to [value]" 
- add_note: "note for [name]: [text]"
- distance_to_contact: "how far to [name]" or "distance to [name]"
- help: greetings, unclear commands

EXAMPLES:
"add contact Mark Brown 601-555-1212" → {"intent":"create_contact","confidence":0.95,"data":{"name":"Mark Brown","phone":"601-555-1212"}}
"update Judith's serial to 3D-29F-88" → {"intent":"update_contact_field","confidence":0.90,"data":{"contact_name":"Judith","field_name":"serial_number","field_value":"3D-29F-88"}}
"note for Sandy: morning appointments" → {"intent":"add_note","confidence":0.88,"data":{"contact_name":"Sandy","note_text":"morning appointments"}}
"how far to Laney Sanders" → {"intent":"distance_to_contact","confidence":0.92,"data":{"contact_name":"Laney Sanders"}}
"help" → {"intent":"help","confidence":0.95,"data":{}}`
      },
      {
        role: 'user',
        content: cleanTranscript
      }
    ],
    temperature: 0.0,
    max_tokens: 150
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
      
      case 'help':
        return {
          success: true,
          data: {},
          response: classification.message || 'I can help with: Add contact, Update contact fields, Add notes, or Get directions to contacts.'
        };
      
      default:
        return {
          success: false,
          error: `Unknown intent: ${intent}`,
          response: 'Try: "Add contact [name]", "Update [name]\'s [field]", "Note for [name]", or "How far to [name]?"'
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
    const classification = await classifyIntent(transcript);
    console.log('Atlas Voice Classification:', classification);

    // Execute command with user location context
    const tenantId = process.env.DEV_TENANT_ID || 'fb8681ab-f3e3-46c4-85b2-ea4aa0816adf';
    
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