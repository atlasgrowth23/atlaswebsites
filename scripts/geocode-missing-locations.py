#!/usr/bin/env python3
"""
Geocoding Script for Atlas Growth
Reverse geocodes company coordinates to get city, state, postal code
"""

import os
import sys
import time
import requests
import psycopg2
from urllib.parse import urlparse

# Google Maps API key from environment
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    """Get database connection from DATABASE_URL"""
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def reverse_geocode(latitude, longitude):
    """
    Use Google Maps API to reverse geocode coordinates
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    
    Returns:
        dict: Geocoding results or None if failed
    """
    if not GOOGLE_MAPS_API_KEY:
        print("❌ Google Maps API key not provided. Set GOOGLE_MAPS_API_KEY environment variable.")
        return None
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'latlng': f"{latitude},{longitude}",
        'key': GOOGLE_MAPS_API_KEY,
        'result_type': 'street_address|route|locality|administrative_area_level_1|administrative_area_level_2|postal_code'
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            result = data['results'][0]
            
            # Extract address components
            components = {}
            for component in result['address_components']:
                for type_name in component['types']:
                    components[type_name] = component['long_name']
            
            return {
                'formatted_address': result['formatted_address'],
                'street_number': components.get('street_number', ''),
                'route': components.get('route', ''),
                'locality': components.get('locality', ''),
                'administrative_area_level_2': components.get('administrative_area_level_2', ''),
                'administrative_area_level_1': components.get('administrative_area_level_1', ''),
                'country': components.get('country', ''),
                'postal_code': components.get('postal_code', ''),
                'place_id': result.get('place_id', '')
            }
        else:
            print(f"⚠️  No results for coordinates {latitude}, {longitude}")
            return None
            
    except Exception as e:
        print(f"❌ Geocoding error: {e}")
        return None

def get_companies_needing_geocoding():
    """Get companies that have coordinates but missing city/state info"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        
        # Get companies with coordinates but missing location data
        cursor.execute("""
            SELECT c.id, c.name, c.latitude, c.longitude 
            FROM companies c
            LEFT JOIN geocoded_locations g ON c.id = g.company_id
            WHERE c.latitude IS NOT NULL 
              AND c.longitude IS NOT NULL
              AND (c.city IS NULL OR c.state IS NULL)
              AND g.company_id IS NULL
            ORDER BY c.name
            LIMIT 1000
        """)
        
        companies = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return companies
        
    except Exception as e:
        print(f"❌ Database query error: {e}")
        return []

def save_geocoded_data(company_id, latitude, longitude, geocode_result):
    """Save geocoded data to database"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO geocoded_locations 
            (company_id, latitude, longitude, formatted_address, street_number, 
             route, locality, administrative_area_level_2, administrative_area_level_1, 
             country, postal_code, google_place_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (company_id) 
            DO UPDATE SET
                formatted_address = EXCLUDED.formatted_address,
                street_number = EXCLUDED.street_number,
                route = EXCLUDED.route,
                locality = EXCLUDED.locality,
                administrative_area_level_2 = EXCLUDED.administrative_area_level_2,
                administrative_area_level_1 = EXCLUDED.administrative_area_level_1,
                country = EXCLUDED.country,
                postal_code = EXCLUDED.postal_code,
                google_place_id = EXCLUDED.google_place_id,
                geocoded_at = CURRENT_TIMESTAMP
        """, (
            company_id, latitude, longitude,
            geocode_result['formatted_address'],
            geocode_result['street_number'],
            geocode_result['route'],
            geocode_result['locality'],
            geocode_result['administrative_area_level_2'],
            geocode_result['administrative_area_level_1'],
            geocode_result['country'],
            geocode_result['postal_code'],
            geocode_result['place_id']
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database save error: {e}")
        return False

def main():
    """Main geocoding process"""
    print("🌍 Starting geocoding process for companies...")
    
    if not GOOGLE_MAPS_API_KEY:
        print("❌ Please set GOOGLE_MAPS_API_KEY environment variable")
        print("   You can get this from Google Cloud Console - Maps API")
        return
    
    companies = get_companies_needing_geocoding()
    
    if not companies:
        print("✅ No companies need geocoding or no companies found")
        return
    
    print(f"📍 Found {len(companies)} companies needing geocoding")
    
    success_count = 0
    error_count = 0
    
    for i, (company_id, name, latitude, longitude) in enumerate(companies, 1):
        print(f"\n[{i}/{len(companies)}] Processing: {name}")
        print(f"   Coordinates: {latitude}, {longitude}")
        
        # Rate limiting - Google allows 50 requests per second
        if i > 1:
            time.sleep(0.1)  # 100ms delay between requests
        
        geocode_result = reverse_geocode(latitude, longitude)
        
        if geocode_result:
            success = save_geocoded_data(company_id, latitude, longitude, geocode_result)
            if success:
                print(f"   ✅ Saved: {geocode_result['locality']}, {geocode_result['administrative_area_level_1']} {geocode_result['postal_code']}")
                success_count += 1
            else:
                print(f"   ❌ Failed to save geocoding data")
                error_count += 1
        else:
            print(f"   ⚠️  Could not geocode coordinates")
            error_count += 1
    
    print(f"\n🎉 Geocoding complete!")
    print(f"   ✅ Successfully processed: {success_count}")
    print(f"   ❌ Errors: {error_count}")
    
    if success_count > 0:
        print(f"\n💡 You can now query the geocoded_locations table to get city/state data!")

if __name__ == "__main__":
    main()