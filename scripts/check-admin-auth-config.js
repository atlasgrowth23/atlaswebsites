// Check admin authentication configuration
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Admin Auth Configuration...\n');

const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REDIRECT_URI',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL'
];

let allGood = true;

console.log('📋 Environment Variables:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    if (envVar.includes('SECRET') || envVar.includes('KEY')) {
      console.log(`✓ ${envVar}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`✓ ${envVar}: ${value}`);
    }
  } else {
    console.log(`❌ ${envVar}: MISSING`);
    allGood = false;
  }
});

console.log('\n🎯 Production Checklist:');

// Check redirect URI
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
if (redirectUri) {
  if (redirectUri.includes('replit.dev')) {
    console.log('⚠️  GOOGLE_REDIRECT_URI still points to Replit - needs production URL');
    console.log(`   Current: ${redirectUri}`);
    console.log('   Should be: https://atlasgrowth.ai/api/auth/google/callback');
    allGood = false;
  } else if (redirectUri.includes('atlasgrowth.ai')) {
    console.log('✓ GOOGLE_REDIRECT_URI points to production domain');
  } else {
    console.log('⚠️  GOOGLE_REDIRECT_URI domain may need verification');
  }
}

// Check database URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('pgbouncer=true')) {
  console.log('⚠️  DATABASE_URL missing ?pgbouncer=true');
  allGood = false;
} else if (dbUrl) {
  console.log('✓ DATABASE_URL has pgbouncer=true');
}

console.log('\n📝 For Production Deployment:');
console.log('1. Set these environment variables in Vercel/Netlify:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && envVar === 'GOOGLE_REDIRECT_URI' && value.includes('replit.dev')) {
    console.log(`   ${envVar}=https://atlasgrowth.ai/api/auth/google/callback`);
  } else if (value) {
    console.log(`   ${envVar}=${value}`);
  }
});

console.log('\n2. Update Google OAuth Console:');
console.log('   - Add https://atlasgrowth.ai/api/auth/google/callback to authorized redirect URIs');

console.log('\n3. Run this script to create admin_sessions table in production:');
console.log('   node scripts/create-admin-sessions-table.js');

if (allGood) {
  console.log('\n🎉 Configuration looks good for production!');
} else {
  console.log('\n❌ Some issues need to be fixed for production deployment');
}