const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllEnums() {
  console.log('=== CHECKING all_enums VIEW ===\n');

  const { data, error } = await supabase
    .from('all_enums')
    .select('*')
    .order('enum_name')
    .order('sort_order');

  if (error) {
    console.error('Error accessing all_enums:', error.message);
    return;
  }

  console.log(`Found ${data.length} enum values\n`);

  // Group by enum name
  const grouped = {};
  data.forEach(row => {
    if (!grouped[row.enum_name]) {
      grouped[row.enum_name] = [];
    }
    grouped[row.enum_name].push(row);
  });

  console.log('Enum types and their values:\n');
  Object.keys(grouped).sort().forEach(enumName => {
    console.log(`${enumName}:`);
    grouped[enumName].forEach(val => {
      console.log(`  - ${val.enum_value} (order: ${val.sort_order || 'N/A'})`);
    });
    console.log('');
  });
}

checkAllEnums().then(() => {
  console.log('=== DONE ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
