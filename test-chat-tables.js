// Test chat system tables and company mapping
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testChatTables() {
  console.log('🧪 Testing chat system tables and company mapping...\n');
  
  try {
    // Test 1: Check if tables exist
    console.log('1. Testing table existence:');
    
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (contactsError) {
      console.error('❌ contacts table error:', contactsError.message);
      return;
    }
    console.log('✓ contacts table exists');
    
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (conversationsError) {
      console.error('❌ conversations table error:', conversationsError.message);
      return;
    }
    console.log('✓ conversations table exists');
    
    const { data: chatMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ chat_messages table error:', messagesError.message);
      return;
    }
    console.log('✓ chat_messages table exists\n');

    // Test 2: Get a sample company for testing
    console.log('2. Testing company lookup:');
    
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, custom_domain, email_1')
      .limit(1)
      .single();
    
    if (companyError || !company) {
      console.error('❌ No companies found:', companyError?.message);
      return;
    }
    
    console.log('✓ Sample company found:');
    console.log(`  - ID: ${company.id}`);
    console.log(`  - Name: ${company.name}`);
    console.log(`  - Slug: ${company.slug}`);
    console.log(`  - Custom Domain: ${company.custom_domain || 'None'}`);
    console.log(`  - Email: ${company.email_1 || 'None'}\n`);

    // Test 3: Test creating a contact
    console.log('3. Testing contact creation:');
    
    // Generate a proper UUID for visitor_id
    const { v4: uuidv4 } = require('uuid');
    const testVisitorId = uuidv4();
    
    const { data: newContact, error: createContactError } = await supabase
      .from('contacts')
      .insert({
        company_id: company.id,
        visitor_id: testVisitorId,
        name: 'Test User',
        email: 'test@example.com'
      })
      .select()
      .single();
    
    if (createContactError) {
      console.error('❌ Contact creation failed:', createContactError.message);
      return;
    }
    
    console.log('✓ Contact created successfully:');
    console.log(`  - Contact ID: ${newContact.id}`);
    console.log(`  - Company ID: ${newContact.company_id}`);
    console.log(`  - Visitor ID: ${newContact.visitor_id}`);
    console.log(`  - Name: ${newContact.name}`);
    console.log(`  - Email: ${newContact.email}\n`);

    // Test 4: Test creating a conversation
    console.log('4. Testing conversation creation:');
    
    const { data: newConversation, error: createConvError } = await supabase
      .from('conversations')
      .insert({
        company_id: company.id,
        visitor_id: testVisitorId,
        contact_id: newContact.id
      })
      .select()
      .single();
    
    if (createConvError) {
      console.error('❌ Conversation creation failed:', createConvError.message);
      return;
    }
    
    console.log('✓ Conversation created successfully:');
    console.log(`  - Conversation ID: ${newConversation.id}`);
    console.log(`  - Company ID: ${newConversation.company_id}`);
    console.log(`  - Contact ID: ${newConversation.contact_id}\n`);

    // Test 5: Test creating chat messages
    console.log('5. Testing chat message creation:');
    
    const { data: newMessage, error: createMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: newConversation.id,
        company_id: company.id,
        visitor_id: testVisitorId,
        message: 'Hi, I need help with my AC!',
        is_from_visitor: true
      })
      .select()
      .single();
    
    if (createMsgError) {
      console.error('❌ Message creation failed:', createMsgError.message);
      return;
    }
    
    console.log('✓ Chat message created successfully:');
    console.log(`  - Message ID: ${newMessage.id}`);
    console.log(`  - Conversation ID: ${newMessage.conversation_id}`);
    console.log(`  - Message: ${newMessage.message}\n`);

    // Test 6: Test company lookup by slug (for prospect sites)
    console.log('6. Testing company lookup by slug:');
    
    const { data: companyBySlug, error: slugError } = await supabase
      .from('companies')
      .select('id, name, slug')
      .eq('slug', company.slug)
      .single();
    
    if (slugError) {
      console.error('❌ Slug lookup failed:', slugError.message);
    } else {
      console.log('✓ Company found by slug:');
      console.log(`  - Slug: ${companyBySlug.slug} → Company ID: ${companyBySlug.id}\n`);
    }

    // Test 7: Test company lookup by custom domain (if exists)
    if (company.custom_domain) {
      console.log('7. Testing company lookup by custom domain:');
      
      const { data: companyByDomain, error: domainError } = await supabase
        .from('companies')
        .select('id, name, custom_domain')
        .eq('custom_domain', company.custom_domain)
        .single();
      
      if (domainError) {
        console.error('❌ Domain lookup failed:', domainError.message);
      } else {
        console.log('✓ Company found by custom domain:');
        console.log(`  - Domain: ${companyByDomain.custom_domain} → Company ID: ${companyByDomain.id}\n`);
      }
    }

    // Cleanup test data
    console.log('8. Cleaning up test data:');
    
    await supabase.from('chat_messages').delete().eq('id', newMessage.id);
    await supabase.from('conversations').delete().eq('id', newConversation.id);
    await supabase.from('contacts').delete().eq('id', newContact.id);
    
    console.log('✓ Test data cleaned up\n');
    
    console.log('🎉 All tests passed! Chat system is ready for implementation.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatTables();