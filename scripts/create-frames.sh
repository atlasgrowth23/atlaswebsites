
#!/bin/bash

# Read variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# First, try to create the table
echo "Creating frames table..."
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS frames (id SERIAL PRIMARY KEY, template_key TEXT NOT NULL, frame_name TEXT NOT NULL, image_url TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())"
  }'

# Insert the image
echo -e "\n\nInserting image into frames table..."
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/frames" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "template_key": "moderntrust", 
    "frame_name": "hero_img", 
    "image_url": "https://media.istockphoto.com/id/2154707821/photo/air-conditioner-service-the-air-conditioner-technician-is-using-a-gauge-to-measure-the.jpg?s=612x612&w=0&k=20&c=I-EvZdWGrPOTJcmFUYqCohZ3raVYnV-QFhS2CBiCI8Q="
  }'
