-- Seed demo contacts for Atlas Voice testing
-- First get the dev tenant ID
DO $$
DECLARE
    dev_tenant_id UUID := 'fb8681ab-f3e3-46c4-85b2-ea4aa0816adf'; -- DEV_TENANT_ID from env
BEGIN
    -- Sandy Sanders — 31 Bridgeport Ln, Madison MS 39110
    INSERT INTO contacts (
        id, tenant_id, first_name, last_name, phone, email,
        address, lat, lng, equip_type, model_number, serial_number,
        install_date, filter_size, warranty_expiry, notes, created_at
    ) VALUES (
        uuid_generate_v4(), dev_tenant_id, 'Sandy', 'Sanders', '(601) 555-0101', 'sandy.sanders@email.com',
        '{"street": "31 Bridgeport Ln", "city": "Madison", "state": "MS", "zip": "39110", "formatted": "31 Bridgeport Ln, Madison, MS 39110"}',
        32.4637, -90.1284, -- Madison MS coordinates
        'central_ac', 'TRANE-XR16', 'AB-12345', '2022-06-15', '16x25x1', '2027-06-15',
        'Prefers afternoon service calls. Gate code is 1234.', NOW() - INTERVAL '45 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Laney Sanders — 4620 Jiggetts Rd, Jackson MS 39211
    INSERT INTO contacts (
        id, tenant_id, first_name, last_name, phone, email,
        address, lat, lng, equip_type, model_number, serial_number,
        install_date, filter_size, warranty_expiry, notes, created_at
    ) VALUES (
        uuid_generate_v4(), dev_tenant_id, 'Laney', 'Sanders', '(601) 555-0102', 'laney.sanders@email.com',
        '{"street": "4620 Jiggetts Rd", "city": "Jackson", "state": "MS", "zip": "39211", "formatted": "4620 Jiggetts Rd, Jackson, MS 39211"}',
        32.3498, -90.1848, -- Jackson MS coordinates
        'heat_pump', 'CARRIER-25HCB6', 'CD-67890', '2021-03-20', '20x25x1', '2026-03-20',
        'Customer has two small dogs. Use side entrance.', NOW() - INTERVAL '30 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Judith Harrison — 5930 Baxter Dr, Jackson MS 39211
    INSERT INTO contacts (
        id, tenant_id, first_name, last_name, phone, email,
        address, lat, lng, equip_type, model_number, serial_number,
        install_date, filter_size, warranty_expiry, notes, created_at
    ) VALUES (
        uuid_generate_v4(), dev_tenant_id, 'Judith', 'Harrison', '(601) 555-0103', 'judith.harrison@email.com',
        '{"street": "5930 Baxter Dr", "city": "Jackson", "state": "MS", "zip": "39211", "formatted": "5930 Baxter Dr, Jackson, MS 39211"}',
        32.3667, -90.1976, -- Jackson MS coordinates
        'furnace', 'GOODMAN-GMVC96', 'EF-11223', '2020-11-10', '16x20x1', '2025-11-10',
        'Elderly customer. Prefers morning appointments.', NOW() - INTERVAL '20 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Mark Johnson — 1234 Highland Dr, Jackson MS 39216
    INSERT INTO contacts (
        id, tenant_id, first_name, last_name, phone, email,
        address, lat, lng, equip_type, model_number, serial_number,
        install_date, filter_size, warranty_expiry, notes, created_at
    ) VALUES (
        uuid_generate_v4(), dev_tenant_id, 'Mark', 'Johnson', '(601) 555-0104', 'mark.johnson@email.com',
        '{"street": "1234 Highland Dr", "city": "Jackson", "state": "MS", "zip": "39216", "formatted": "1234 Highland Dr, Jackson, MS 39216"}',
        32.3317, -90.2073, -- Jackson MS coordinates
        'mini_split', 'MITSUBISHI-MSZ', 'GH-33445', '2023-02-14', '12x24x1', '2028-02-14',
        'New customer. System still under warranty.', NOW() - INTERVAL '10 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Lisa Chen — 789 Meadowbrook Rd, Jackson MS 39206
    INSERT INTO contacts (
        id, tenant_id, first_name, last_name, phone, email,
        address, lat, lng, equip_type, model_number, serial_number,
        install_date, filter_size, warranty_expiry, notes, created_at
    ) VALUES (
        uuid_generate_v4(), dev_tenant_id, 'Lisa', 'Chen', '(601) 555-0105', 'lisa.chen@email.com',
        '{"street": "789 Meadowbrook Rd", "city": "Jackson", "state": "MS", "zip": "39206", "formatted": "789 Meadowbrook Rd, Jackson, MS 39206"}',
        32.3843, -90.1370, -- Jackson MS coordinates
        'central_ac', 'RHEEM-RA17', 'IJ-55667', '2019-08-05', '20x25x4', '2024-08-05',
        'Property manager contact. Schedule through office.', NOW() - INTERVAL '5 days'
    ) ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Demo contacts seeded successfully for tenant: %', dev_tenant_id;
END $$;