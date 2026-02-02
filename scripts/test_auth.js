const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('=== TESTING SUPABASE AUTH ===\n');

  // Test signup
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('1. Testing signup...');
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signupError) {
    console.log('Signup error:', signupError.message);
    return;
  }

  console.log('✓ Signup successful');
  console.log('User ID:', signupData.user?.id);
  console.log('Session:', signupData.session ? 'Created' : 'Pending confirmation');

  if (signupData.session) {
    // We have a session, can test creating a project
    console.log('\n2. Testing project creation...');
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: 'Test Project',
        mode: 'buy',
        owner_id: signupData.user.id
      })
      .select()
      .single();

    if (projectError) {
      console.log('Project creation error:', projectError.message);
      console.log('Details:', projectError);
    } else {
      console.log('✓ Project created:', projectData);
      
      // Clean up
      await supabase.from('projects').delete().eq('id', projectData.id);
      console.log('✓ Test project cleaned up');
    }

    // Test logout
    console.log('\n3. Testing logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    if (!logoutError) {
      console.log('✓ Logout successful');
    }
  }
}

testAuth().then(() => {
  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
