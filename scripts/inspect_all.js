const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAll() {
  console.log('=== FULL TABLE INSPECTION ===\n');

  const tables = [
    'projects',
    'properties',
    'visits',
    'project_members',
    'project_criteria_values',
    'evaluations'
  ];

  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
      console.log('Sample:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Table exists but is empty');
      // Try to get columns by attempting an insert that will fail
      console.log('Attempting to discover required fields...');
    }
  }

  // Check auth.users structure by looking at current user
  console.log('\n--- Testing Auth ---');
  const testEmail = `inspect_${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
  });

  if (authData.user) {
    console.log('User object structure:');
    console.log(JSON.stringify(authData.user, null, 2));
    
    // Now try to insert a project with the user ID
    console.log('\n\nAttempting project insert with authenticated user...');
    const projectAttempt = await supabase
      .from('projects')
      .insert({
        title: 'Discovery Project'
      })
      .select();
    
    console.log('Project insert result:');
    if (projectAttempt.error) {
      console.log('Error:', projectAttempt.error);
    } else {
      console.log('Success!', projectAttempt.data);
      // Clean up
      if (projectAttempt.data && projectAttempt.data[0]) {
        await supabase.from('projects').delete().eq('id', projectAttempt.data[0].id);
      }
    }

    await supabase.auth.signOut();
  }
}

inspectAll().then(() => {
  console.log('\n=== DONE ===');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
