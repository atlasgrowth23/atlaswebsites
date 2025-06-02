const { Client } = require('pg');

async function createTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres.zjxvacezqbhyomrngynq:eMeQW9s85usvbaok@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
  });

  try {
    console.log('🔧 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('\n📊 Creating tracking tables...');

    // Create template_views table
    await client.query(`
      CREATE TABLE IF NOT EXISTS template_views (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id TEXT NOT NULL,
        company_slug TEXT NOT NULL,
        template_key TEXT NOT NULL,
        session_id TEXT NOT NULL,
        user_agent TEXT,
        referrer_url TEXT,
        ip_address INET,
        country TEXT,
        city TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        device_type TEXT,
        browser_name TEXT,
        total_time_seconds INTEGER DEFAULT 0,
        page_interactions INTEGER DEFAULT 0,
        visit_start_time TIMESTAMPTZ DEFAULT NOW(),
        visit_end_time TIMESTAMPTZ,
        is_initial_visit BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ template_views table created');

    // Create prospect_tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prospect_tracking (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        name TEXT,
        message TEXT,
        form_type TEXT,
        source_page TEXT,
        referrer_url TEXT,
        user_agent TEXT,
        ip_address INET,
        country TEXT,
        city TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ prospect_tracking table created');

    // Create daily_analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_analytics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id TEXT NOT NULL,
        date DATE NOT NULL,
        total_views INTEGER DEFAULT 0,
        unique_sessions INTEGER DEFAULT 0,
        total_time_seconds INTEGER DEFAULT 0,
        bounce_rate DECIMAL(5, 2),
        mobile_percentage DECIMAL(5, 2),
        top_referrer TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, date)
      );
    `);
    console.log('✅ daily_analytics table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_template_views_company_id ON template_views(company_id);
      CREATE INDEX IF NOT EXISTS idx_template_views_session_id ON template_views(session_id);
      CREATE INDEX IF NOT EXISTS idx_template_views_created_at ON template_views(created_at DESC);
    `);
    console.log('✅ Indexes created');

    // Test insertion
    console.log('\n🧪 Testing insertion...');
    const result = await client.query(`
      INSERT INTO template_views (company_id, company_slug, template_key, session_id, user_agent, device_type, browser_name, total_time_seconds, is_initial_visit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, session_id;
    `, ['test-123', 'test-company', 'modern-trust', 'test_' + Date.now(), 'Test Browser', 'desktop', 'Chrome', 30, true]);

    console.log('✅ Test record created:', result.rows[0]);

    // Clean up test record
    await client.query('DELETE FROM template_views WHERE company_id = $1', ['test-123']);
    console.log('✅ Test record cleaned up');

    console.log('\n🎉 Tracking system is ready!');
    console.log('📊 Visit any company page to start collecting data');
    console.log('📈 Check /session-analytics to view tracking data');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTables();