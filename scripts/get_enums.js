const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getEnums() {
  console.log('=== FETCHING ENUM VALUES ===\n');

  // Get enum criteria
  const { data: enumCriteria } = await supabase
    .from('system_criteria')
    .select('*')
    .eq('value_type', 'enum');

  console.log('Enum-based criteria:');
  if (enumCriteria) {
    enumCriteria.forEach(c => {
      console.log(`  ${c.key}: ${c.label}`);
    });
  }

  // Try to get actual enum values by checking if there's an enum_values table or column
  console.log('\n--- Checking for enum values storage ---');
  
  // Check if system_criteria has enum_values column
  const { data: criteriaWithEnum } = await supabase
    .from('system_criteria')
    .select('*')
    .eq('key', 'condition')
    .single();
  
  if (criteriaWithEnum) {
    console.log('\nSample criterion (condition):');
    console.log(JSON.stringify(criteriaWithEnum, null, 2));
  }

  // Check for a possible criterion_enum_values table
  const { data: enumValuesTable, error: enumError } = await supabase
    .from('criterion_enum_values')
    .select('*')
    .limit(10);
  
  if (!enumError && enumValuesTable) {
    console.log('\nFound criterion_enum_values table:');
    console.log(JSON.stringify(enumValuesTable, null, 2));
  } else {
    console.log('\nNo criterion_enum_values table found or accessible');
  }

  // Check project_criteria_values structure
  console.log('\n--- project_criteria_values structure ---');
  const { data: pcValues, error: pcvError } = await supabase
    .from('project_criteria_values')
    .select('*')
    .limit(5);
  
  if (pcValues && pcValues.length > 0) {
    console.log('Sample project_criteria_values:');
    console.log(JSON.stringify(pcValues, null, 2));
  } else {
    console.log('Table is empty or not accessible');
  }

  // Check if there's a separate enum_values or similar table
  const possibleTables = [
    'enum_values',
    'criteria_enum_values', 
    'criterion_values',
    'system_enum_values'
  ];

  console.log('\n--- Checking for enum value tables ---');
  for (const tableName of possibleTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (!error && data) {
      console.log(`✓ Found table: ${tableName}`);
      console.log(JSON.stringify(data, null, 2));
    }
  }

  // Try to get a full project record to understand the structure
  console.log('\n--- Full project record (if exists) ---');
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .limit(1);
  
  if (projects && projects.length > 0) {
    console.log(JSON.stringify(projects[0], null, 2));
  } else {
    console.log('No projects in database yet');
  }

  console.log('\n=== DONE ===');
}

getEnums().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
