const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('=== INSPECTING SUPABASE DATABASE SCHEMA ===\n');

  try {
    // Query information_schema to get tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info', {});
    
    // If RPC doesn't exist, try direct query (requires appropriate permissions)
    // Let's try fetching data from known tables based on the spec
    
    const tablesToCheck = [
      'projects',
      'project_members',
      'system_criteria',
      'project_criteria',
      'project_criteria_values',
      'properties',
      'visits',
      'evaluations'
    ];

    console.log('Checking tables:\n');
    
    for (const tableName of tablesToCheck) {
      console.log(`\n--- Table: ${tableName} ---`);
      
      // Try to fetch one row to see the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✓ Table exists`);
        if (data && data.length > 0) {
          console.log('Sample columns:', Object.keys(data[0]).join(', '));
        } else {
          console.log('Table is empty - trying to fetch columns via metadata');
        }
      }
    }

    // Try to get enum values
    console.log('\n\n=== CHECKING FOR ENUMS ===\n');
    
    const enumsToCheck = [
      'project_mode',
      'preference_level',
      'member_role',
      'member_status'
    ];

    // Since we can't query pg_enum directly, we'll try to get them from table constraints
    // or we'll discover them when we query the actual data

  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectSchema().then(() => {
  console.log('\n=== INSPECTION COMPLETE ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
