ALTER TABLE companies ADD COLUMN template_key VARCHAR(50) DEFAULT 'moderntrust';

UPDATE companies 
SET template_key = 'moderntrust' 
WHERE slug = '5-starr-heating-and-air';