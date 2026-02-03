const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectCreation() {
  console.log('=== TESTING PROJECT CREATION ===\n');

  // Create test user
  const testEmail = `test_${Date.now()}@example.com`;
  console.log('1. Creating test user:', testEmail);
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
  });

  if (authError) {
    console.log('Auth error:', authError.message);
    return;
  }

  console.log('✓ User created:', authData.user.id);

  if (!authData.session) {
    console.log('No session - trying to sign in');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!',
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError.message);
      return;
    }
    console.log('✓ Signed in');
  }

  // Try to create project with INVEST
  console.log('\n2. Testing project with INVEST type');
  const { data: investProject, error: investError } = await supabase
    .from('projects')
    .insert({
      title: 'Test INVEST Project',
      project_type: 'invest',
      project_status: 'active',
      urgency_level: 'medium',
      currency: 'EUR',
      owner_id: authData.user.id,
    })
    .select()
    .single();

  if (investError) {
    console.log('❌ INVEST project error:', investError.message);
    console.log('Details:', investError);
  } else {
    console.log('✓ INVEST project created:', investProject.id);
  }

  // Try with BUY
  console.log('\n3. Testing project with BUY type');
  const { data: buyProject, error: buyError } = await supabase
    .from('projects')
    .insert({
      title: 'Test BUY Project',
      project_type: 'buy',
      project_status: 'active',
      urgency_level: 'medium',
      currency: 'EUR',
      owner_id: authData.user.id,
    })
    .select()
    .single();

  if (buyError) {
    console.log('❌ BUY project error:', buyError.message);
  } else {
    console.log('✓ BUY project created:', buyProject.id);
    
    // Get full project details
    console.log('\n4. Full project structure:');
    console.log(JSON.stringify(buyProject, null, 2));
  }

  console.log('\n=== TEST COMPLETE ===');
}

testProjectCreation().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
