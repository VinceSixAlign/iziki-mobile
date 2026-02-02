const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverSchema() {
  console.log('=== DISCOVERING EXACT TABLE SCHEMAS ===\n');

  // Try different column names for projects
  const projectFields = [
    'id, title, project_mode, owner_id, created_at',
    'id, title, type, owner_id, created_at',
    'id, title, mode, owner_id, created_at',
    'id, name, project_mode, owner_id, created_at',
    '*'
  ];

  console.log('Testing projects table columns...');
  for (const fields of projectFields) {
    const { data, error } = await supabase
      .from('projects')
      .select(fields)
      .limit(1);
    
    if (!error) {
      console.log(`✓ Working select: ${fields}`);
      if (data && data.length > 0) {
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
      }
      break;
    } else {
      console.log(`✗ Failed: ${fields} - ${error.message}`);
    }
  }

  // Try to discover by attempting insert with minimal fields
  console.log('\n\nTesting minimal project insert to discover required fields...');
  
  // First need auth
  const testEmail = `discover_${Date.now()}@example.com`;
  const { data: authData } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
  });

  if (authData.session) {
    const testInserts = [
      { title: 'Test', project_mode: 'buy' },
      { title: 'Test', type: 'buy' },
      { title: 'Test', mode: 'buy' },
      { name: 'Test', project_mode: 'buy' },
    ];

    for (const insertData of testInserts) {
      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select();
      
      if (!error) {
        console.log(`✓ Successful insert with:`, insertData);
        console.log('Result:', data);
        // Clean up
        if (data && data[0]) {
          await supabase.from('projects').delete().eq('id', data[0].id);
        }
        break;
      } else {
        console.log(`✗ Failed insert:`, insertData, '-', error.message);
      }
    }

    await supabase.auth.signOut();
  }
}

discoverSchema().then(() => {
  console.log('\n=== DISCOVERY COMPLETE ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
