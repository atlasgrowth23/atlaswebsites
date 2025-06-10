const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL, // Use DIRECT_URL for auth setup
  ssl: { rejectUnauthorized: false }
});

async function setupSupabaseAuth() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 SETTING UP PROFESSIONAL SUPABASE AUTHENTICATION');
    console.log('='.repeat(60));
    
    // 1. Create admin user profiles linked to Supabase auth
    console.log('\n👥 Creating admin user profiles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        name text NOT NULL,
        role text NOT NULL DEFAULT 'admin',
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    console.log('   ✅ admin_profiles table created');
    
    // 2. Create RLS policies for admin profiles (one at a time)
    console.log('\n🔒 Setting up Row Level Security...');
    
    await client.query(`ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY`);
    console.log('   ✅ RLS enabled');
    
    // Policy 1: Admin users can view all profiles
    await client.query(`
      DROP POLICY IF EXISTS "Admin users can view all profiles" ON admin_profiles;
      CREATE POLICY "Admin users can view all profiles" ON admin_profiles
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM admin_profiles ap 
            WHERE ap.id = auth.uid() 
            AND ap.role IN ('superadmin', 'admin')
          )
        )
    `);
    console.log('   ✅ Admin view policy created');
    
    // Policy 2: Users can view their own profile
    await client.query(`
      DROP POLICY IF EXISTS "Users can view own profile" ON admin_profiles;
      CREATE POLICY "Users can view own profile" ON admin_profiles
        FOR SELECT TO authenticated
        USING (auth.uid() = id)
    `);
    console.log('   ✅ Self-view policy created');
    
    // Policy 3: Only superadmin can update profiles
    await client.query(`
      DROP POLICY IF EXISTS "Superadmin can update profiles" ON admin_profiles;
      CREATE POLICY "Superadmin can update profiles" ON admin_profiles
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM admin_profiles ap 
            WHERE ap.id = auth.uid() 
            AND ap.role = 'superadmin'
          )
        )
    `);
    console.log('   ✅ Superadmin update policy created');
    
    // 3. Create function to handle new user signups
    console.log('\n⚡ Creating auth functions...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.admin_profiles (id, email, name, role)
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          COALESCE(new.raw_user_meta_data->>'role', 'admin')
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('   ✅ Profile creation function created');
    
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_admin_user();
    `);
    console.log('   ✅ Auth trigger created');
    
    console.log('\n🎯 NEXT STEPS FOR SUPABASE DASHBOARD:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log('   2. Click "Add User" and create:');
    console.log('      📧 nicholas@atlasgrowth.ai (password: set temp password)');
    console.log('      📧 jared@atlasgrowth.ai (password: set temp password)');
    console.log('   3. Users can login with email/password');
    console.log('   4. Profiles will auto-create in admin_profiles table');
    
    console.log('\n🔑 AUTHENTICATION FLOW:');
    console.log('   1. User logs in via Supabase Auth');
    console.log('   2. Gets JWT token with user.id');
    console.log('   3. admin_profiles table has role info');
    console.log('   4. Activity tracking uses real user.id');
    
    console.log('\n✅ PROFESSIONAL SUPABASE AUTH SETUP COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSupabaseAuth();