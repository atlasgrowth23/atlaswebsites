
-- Clear the table
TRUNCATE TABLE companies RESTART IDENTITY CASCADE;

-- Import from fixed CSV
\copy companies (id,slug,subdomain,custom_domain,name,site,phone,phone_carrier_type,category,street,city,postal_code,state,latitude,longitude,rating,reviews,photos_count,working_hours,about,logo,verified,place_id,location_link,location_reviews_link,email_1,email_1_validator_status,email_1_full_name,facebook,instagram,extras,created_at,updated_at) FROM './fixed_hvac.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '"');

-- Count the imported records
SELECT COUNT(*) AS imported_records FROM companies;
