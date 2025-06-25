// Seed test leads for Pipeline v2
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

const testLeads = [
  // Alabama HVAC Leads
  {
    campaign: 'Alabama HVAC Outreach',
    business_name: 'Ready Heating & Air LLC',
    phone: '+1YOUR_PHONE_NUMBER', // Replace with your actual number
    email: 'info@readyheatingair.com',
    city: 'Birmingham',
    state: 'AL',
    contact_name: 'John Smith',
    priority: 'high',
    video_id: 'n7b7b7cf2w1',
    video_link: 'https://app.repliq.co/videos/n7b7b7cf2w1'
  },
  {
    campaign: 'Alabama HVAC Outreach',
    business_name: 'Alabama Climate Control',
    phone: '+1YOUR_PHONE_NUMBER',
    email: 'service@alabamaclimate.com',
    city: 'Montgomery',
    state: 'AL',
    contact_name: 'Sarah Johnson',
    priority: 'normal',
    video_id: 'n799e78ebw1',
    video_link: 'https://app.repliq.co/videos/n799e78ebw1'
  },
  {
    campaign: 'Alabama HVAC Outreach',
    business_name: 'Southern Comfort HVAC',
    phone: '+1YOUR_PHONE_NUMBER',
    email: 'hello@southerncomforthvac.com',
    city: 'Huntsville',
    state: 'AL',
    contact_name: 'Mike Wilson',
    priority: 'normal'
  },
  
  // Arkansas HVAC Leads
  {
    campaign: 'Arkansas HVAC Outreach',
    business_name: 'Calderas Heating & Air',
    phone: '+1YOUR_PHONE_NUMBER',
    email: 'info@calderasheating.com',
    city: 'Little Rock',
    state: 'AR',
    contact_name: 'Carlos Calderas',
    priority: 'high',
    video_id: 'n799e78ebw1',
    video_link: 'https://app.repliq.co/videos/n799e78ebw1'
  },
  {
    campaign: 'Arkansas HVAC Outreach',
    business_name: 'Arkansas Air Pros',
    phone: '+1YOUR_PHONE_NUMBER',
    email: 'service@arkansasairpros.com',
    city: 'Fayetteville',
    state: 'AR',
    contact_name: 'Jennifer Davis',
    priority: 'normal'
  },
  {
    campaign: 'Arkansas HVAC Outreach',
    business_name: 'Tom\'s Heating & Air Conditioning',
    phone: '+1YOUR_PHONE_NUMBER',
    email: 'tom@tomsheatingair.com',
    city: 'Fort Smith',
    state: 'AR',
    contact_name: 'Tom Anderson',
    priority: 'high',
    video_id: 'n71ea2cc4w1',
    video_link: 'https://app.repliq.co/videos/n71ea2cc4w1'
  }
];

async function seedTestLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding test leads for Pipeline v2...');
    
    for (const leadData of testLeads) {
      // Get campaign and first stage
      const campaignQuery = `
        SELECT c.id, ps.id as first_stage_id
        FROM campaigns c
        JOIN pipeline_stages ps ON c.id = ps.campaign_id
        WHERE c.name = $1 AND ps.order_index = 1
        LIMIT 1
      `;
      
      const campaignResult = await client.query(campaignQuery, [leadData.campaign]);
      
      if (campaignResult.rows.length === 0) {
        console.log(`❌ Campaign not found: ${leadData.campaign}`);
        continue;
      }
      
      const { id: campaignId, first_stage_id: stageId } = campaignResult.rows[0];
      
      // Insert lead
      const insertQuery = `
        INSERT INTO leads (
          campaign_id,
          current_stage_id,
          business_name,
          phone,
          email,
          city,
          state,
          contact_name,
          priority,
          video_id,
          video_link,
          landing_page_url,
          source,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      
      const landingPageUrl = leadData.video_id ? 
        `https://your-domain.com/pipeline-v2/${leadData.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : 
        null;
      
      const result = await client.query(insertQuery, [
        campaignId,
        stageId,
        leadData.business_name,
        leadData.phone,
        leadData.email,
        leadData.city,
        leadData.state,
        leadData.contact_name,
        leadData.priority,
        leadData.video_id || null,
        leadData.video_link || null,
        landingPageUrl,
        'manual',
        'active'
      ]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Created lead: ${leadData.business_name} (${leadData.city}, ${leadData.state})`);
        
        // Add initial activity
        await client.query(`
          INSERT INTO lead_activities (
            lead_id,
            activity_type,
            description,
            to_stage_id,
            performed_by,
            data
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          result.rows[0].id,
          'lead_created',
          `Lead created for ${leadData.business_name}`,
          stageId,
          'system',
          JSON.stringify({ 
            source: 'seed_script',
            priority: leadData.priority 
          })
        ]);
      } else {
        console.log(`⚠️ Lead already exists: ${leadData.business_name}`);
      }
    }
    
    // Display summary
    console.log('\n📊 Lead Summary:');
    const summaryQuery = `
      SELECT 
        c.name as campaign_name,
        ps.name as stage_name,
        COUNT(l.id) as lead_count
      FROM campaigns c
      JOIN pipeline_stages ps ON c.id = ps.campaign_id
      LEFT JOIN leads l ON ps.id = l.current_stage_id
      WHERE c.name LIKE '%HVAC Outreach'
      GROUP BY c.name, ps.name, ps.order_index
      ORDER BY c.name, ps.order_index
    `;
    
    const summary = await client.query(summaryQuery);
    
    let currentCampaign = '';
    summary.rows.forEach(row => {
      if (row.campaign_name !== currentCampaign) {
        console.log(`\n  📈 ${row.campaign_name}:`);
        currentCampaign = row.campaign_name;
      }
      console.log(`    ${row.stage_name}: ${row.lead_count || 0} leads`);
    });
    
    console.log('\n🎉 Test leads seeded successfully!');
    console.log('\n🔗 Next steps:');
    console.log('  1. Replace "+1YOUR_PHONE_NUMBER" with your actual phone number');
    console.log('  2. Visit /admin-v2/pipeline to see your leads');
    console.log('  3. Test the SMS composer in the "New Lead" stage');
    
  } catch (error) {
    console.error('❌ Error seeding test leads:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedTestLeads().catch(console.error);