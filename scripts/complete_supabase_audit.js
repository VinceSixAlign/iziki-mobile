const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeAudit() {
  console.log('=== COMPLETE SUPABASE SCHEMA AUDIT ===\n');

  // 1. Test auth
  console.log('1. TESTING AUTH STRUCTURE');
  const { data: authTest, error: authError } = await supabase.auth.getSession();
  console.log('Auth session structure:', JSON.stringify(authTest, null, 2));
  if (authError) console.log('Auth error:', authError);

  // 2. Projects table
  console.log('\n2. PROJECTS TABLE');
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);
  
  if (projError) {
    console.log('Error:', projError.message);
  } else {
    console.log('Columns:', projects[0] ? Object.keys(projects[0]).join(', ') : 'No data');
    console.log('Sample:', JSON.stringify(projects[0], null, 2));
  }

  // 3. System criteria
  console.log('\n3. SYSTEM_CRITERIA TABLE');
  const { data: criteria, error: critError } = await supabase
    .from('system_criteria')
    .select('*')
    .order('key')
    .limit(5);
  
  if (critError) {
    console.log('Error:', critError.message);
  } else {
    console.log(`Found ${criteria?.length} criteria`);
    criteria?.forEach(c => {
      console.log(`  ${c.key} (${c.value_type}): ${c.label}`);
    });
  }

  // 4. All enums
  console.log('\n4. ALL_ENUMS VIEW');
  const { data: enums, error: enumError } = await supabase
    .from('all_enums')
    .select('*')
    .order('enum_name')
    .order('sort_order');
  
  if (enumError) {
    console.log('Error:', enumError.message);
  } else {
    console.log(`Found ${enums?.length} enum values`);
    const grouped = {};
    enums?.forEach(e => {
      if (!grouped[e.enum_name]) grouped[e.enum_name] = [];
      grouped[e.enum_name].push(e.enum_value);
    });
    
    Object.keys(grouped).forEach(name => {
      console.log(`  ${name}: [${grouped[name].join(', ')}]`);
    });
  }

  // 5. Project criteria
  console.log('\n5. PROJECT_CRITERIA TABLE');
  const { data: projCrit, error: pcError } = await supabase
    .from('project_criteria')
    .select('*')
    .limit(5);
  
  if (pcError) {
    console.log('Error:', pcError.message);
  } else {
    console.log('Columns:', projCrit[0] ? Object.keys(projCrit[0]).join(', ') : 'No data');
    console.log('Sample:', JSON.stringify(projCrit[0], null, 2));
  }

  // 6. Project criteria values
  console.log('\n6. PROJECT_CRITERIA_VALUES TABLE');
  const { data: pcValues, error: pcvError } = await supabase
    .from('project_criteria_values')
    .select('*')
    .limit(5);
  
  if (pcvError) {
    console.log('Error:', pcvError.message);
  } else {
    console.log('Columns:', pcValues[0] ? Object.keys(pcValues[0]).join(', ') : 'No data');
    console.log('Sample:', JSON.stringify(pcValues[0], null, 2));
  }

  // 7. Properties
  console.log('\n7. PROPERTIES TABLE');
  const { data: props, error: propsError } = await supabase
    .from('properties')
    .select('*')
    .limit(1);
  
  if (propsError) {
    console.log('Error:', propsError.message);
  } else {
    console.log('Columns:', props[0] ? Object.keys(props[0]).join(', ') : 'No data');
  }

  // 8. Visits
  console.log('\n8. VISITS TABLE');
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('*')
    .limit(1);
  
  if (visitsError) {
    console.log('Error:', visitsError.message);
  } else {
    console.log('Columns:', visits[0] ? Object.keys(visits[0]).join(', ') : 'No data');
  }

  // 9. Evaluations
  console.log('\n9. EVALUATIONS TABLE');
  const { data: evals, error: evalsError } = await supabase
    .from('evaluations')
    .select('*')
    .limit(1);
  
  if (evalsError) {
    console.log('Error:', evalsError.message);
  } else {
    console.log('Columns:', evals[0] ? Object.keys(evals[0]).join(', ') : 'No data');
  }

  // 10. Project members
  console.log('\n10. PROJECT_MEMBERS TABLE');
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('*')
    .limit(1);
  
  if (membersError) {
    console.log('Error:', membersError.message);
  } else {
    console.log('Columns:', members[0] ? Object.keys(members[0]).join(', ') : 'No data');
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

completeAudit().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
