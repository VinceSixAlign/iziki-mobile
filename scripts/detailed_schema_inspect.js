const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedInspect() {
  console.log('=== DETAILED SCHEMA INSPECTION ===\n');

  // Get system criteria with all data
  console.log('--- SYSTEM CRITERIA (all rows) ---');
  const { data: criteria, error: criteriaError } = await supabase
    .from('system_criteria')
    .select('*')
    .order('key');
  
  if (criteriaError) {
    console.log('Error:', criteriaError.message);
  } else {
    console.log(`Found ${criteria.length} system criteria:`);
    criteria.forEach(c => {
      console.log(`  - ${c.key}: ${c.label} (type: ${c.value_type})`);
    });
  }

  // Try to insert a test project to see required fields
  console.log('\n--- TESTING PROJECT TABLE STRUCTURE ---');
  
  // First check if we can read projects schema by attempting to select with all possible columns
  const { data: projectTest, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .limit(0);
  
  console.log('Project table columns discovered via metadata.');

  // Get project_criteria sample
  console.log('\n--- PROJECT CRITERIA SAMPLE ---');
  const { data: projCriteria, error: pcError } = await supabase
    .from('project_criteria')
    .select('*')
    .limit(5);
  
  if (!pcError && projCriteria) {
    console.log('Sample project_criteria records:');
    console.log(JSON.stringify(projCriteria, null, 2));
  }

  console.log('\n=== END INSPECTION ===');
}

detailedInspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
