# Atlas Voice Assistant - "Hey Atlas" Commands

## Quick Start
1. **Blue floating mic** appears bottom-right on all tenant pages
2. **Tap and speak** one of the supported commands
3. **Atlas responds** with voice confirmation and updates data

## Supported Commands

### 1. Create Contact
**Say:** "Add contact [Name], [Phone], [Email], [Equipment] serial [Serial]"

**Examples:**
- "Add contact Mark Brown, 601-555-1212, mark@ac.com, heat-pump serial AZ-493"
- "Add contact Lisa Johnson, 555-123-4567" 
- "Add contact Bob Smith phone 601-555-9999 email bob@test.com"

**Response:** "Contact created for [Name]."

### 2. Update Contact Field  
**Say:** "Update [Name]'s [field] to [value]"

**Examples:**
- "Update Judith Harrison's serial number to 3D-29F-88"
- "Update Sandy's phone to 601-555-2222"
- "Update Mark's filter size to 20x25x1"

**Supported fields:** serial number, model number, filter size, phone, email, equipment type

**Response:** "Updated [Name]'s [field]."

### 3. Add Note
**Say:** "Note for [Name]: [text]"

**Examples:**
- "Note for Sandy Sanders: prefers morning appointments"
- "Note for Judith: customer has dogs, use side gate"
- "Note for Mark: warranty expires next month"

**Response:** "Note added for [Name]."

### 4. Get Distance/Directions
**Say:** "How far am I from [Name]?" or "Distance to [Name]"

**Examples:**
- "How far am I from Laney Sanders?"
- "Distance to Sandy Sanders"
- "How far to Judith Harrison?"

**Response:** "About [time], [distance] to [Name]. Should I open directions?"
- Say "yes" to open Google Maps with directions

## Wake Words
- Start with "Hey Atlas" (optional but recommended)
- Just the command works too: "Add contact..."

## Performance Tips
- **Speak clearly** and not too fast
- **Quiet environment** works best (85%+ accuracy)
- **Expected response time:** 2-4 seconds
- **Location permission:** Required for accurate distance calculations

## Testing on Mobile (Vercel Preview)
1. Open preview URL: `https://[your-deployment].vercel.app/contacts`
2. Allow microphone permission when prompted
3. Allow location permission for distance features
4. Tap blue mic button and test commands

## For Data Science - Voice Logs Query
```sql
-- Query voice command success rates
SELECT 
  intent,
  AVG(confidence) as avg_confidence,
  COUNT(*) as total_commands,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  AVG(response_time_ms) as avg_response_time
FROM voice_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY intent
ORDER BY total_commands DESC;

-- Find common failure patterns
SELECT transcript, error_message, COUNT(*)
FROM voice_logs 
WHERE success = false 
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY transcript, error_message
ORDER BY count DESC;
```

## Troubleshooting
- **"I didn't quite catch that"** → Speak more clearly, try again
- **"Contact not found"** → Use exact first/last name as stored
- **"Location not available"** → Address needs geocoding, update in contact detail
- **No response** → Check browser console for errors

## Technical Notes
- Uses **OpenAI Whisper** for speech-to-text
- Uses **GPT-4o-mini** for intent classification (faster than GPT-4o)
- **Fuzzy matching** for contact names (70% similarity threshold)
- **Google Distance Matrix API** for real driving distances  
- **Browser Speech Synthesis** for voice responses
- **30-minute location caching** to preserve battery