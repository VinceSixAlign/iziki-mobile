const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aiylthjfiqemwzxcgjnf.supabase.co';
const supabaseKey = 'sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exhaustiveAudit() {
  console.log('=== EXHAUSTIVE SUPABASE & DATA TYPE AUDIT ===\n');

  // 1. Auth Session Structure
  console.log('1. AUTH SESSION EXACT STRUCTURE');
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('Session data type:', typeof sessionData);
  console.log('Session keys:', Object.keys(sessionData));
  console.log('Session.session:', sessionData.session);
  console.log('Full structure:', JSON.stringify(sessionData, null, 2));

  // 2. Create test user and get ACTUAL session
  const testEmail = `deepaudit_${Date.now()}@example.com`;
  console.log('\n2. CREATING REAL USER TO TEST SESSION');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
  });

  if (!authError && authData.session) {
    console.log('Session object keys:', Object.keys(authData.session));
    console.log('User object keys:', Object.keys(authData.user));
    console.log('\nChecking every session field type:');
    Object.entries(authData.session).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value).substring(0, 50)}...`);
    });
    
    console.log('\nChecking every user field type:');
    Object.entries(authData.user).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value).substring(0, 50)}...`);
    });

    // 3. Create a project and inspect EVERY field
    console.log('\n3. CREATING PROJECT - ANALYZING EVERY FIELD TYPE');
    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({
        title: 'Deep Audit Test',
        project_type: 'buy',
        project_status: 'active',
        urgency_level: 'medium',
        currency: 'EUR',
        owner_id: authData.user.id,
      })
      .select()
      .single();

    if (!projError) {
      console.log('\nProject field types:');
      Object.entries(project).forEach(([key, value]) => {
        const type = typeof value;
        const constructor = value?.constructor?.name || 'null';
        console.log(`  ${key}: ${type} (${constructor}) = ${JSON.stringify(value)}`);
      });

      // 4. Get system criteria and check types
      console.log('\n4. SYSTEM CRITERIA - CHECKING ALL FIELD TYPES');
      const { data: criteria } = await supabase
        .from('system_criteria')
        .select('*')
        .limit(3);

      criteria?.forEach(c => {
        console.log(`\nCriterion: ${c.key}`);
        Object.entries(c).forEach(([key, value]) => {
          console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)}`);
        });
      });

      // 5. Create project criteria and check
      console.log('\n5. INSERTING PROJECT CRITERIA - CHECKING RETURNED TYPES');
      const { data: projCrit } = await supabase
        .from('project_criteria')
        .insert([
          { project_id: project.id, criterion_key: 'balcony', preference_level: 'required' },
          { project_id: project.id, criterion_key: 'garage', preference_level: 'optional' }
        ])
        .select();

      if (projCrit) {
        console.log('\nProject criteria field types:');
        projCrit.forEach((pc, idx) => {
          console.log(`\nRecord ${idx}:`);
          Object.entries(pc).forEach(([key, value]) => {
            console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)}`);
          });
        });
      }

      // 6. Insert criteria values and check
      console.log('\n6. INSERTING CRITERIA VALUES - CHECKING BOOLEAN HANDLING');
      const { data: critValues } = await supabase
        .from('project_criteria_values')
        .insert([
          { project_criterion_id: projCrit[0].id, value_bool: true },
          { project_criterion_id: projCrit[1].id, value_bool: false }
        ])
        .select();

      if (critValues) {
        console.log('\nCriteria values field types:');
        critValues.forEach((cv, idx) => {
          console.log(`\nRecord ${idx}:`);
          Object.entries(cv).forEach(([key, value]) => {
            const type = typeof value;
            const isActualBoolean = value === true || value === false;
            const isStringBoolean = value === 'true' || value === 'false';
            console.log(`  ${key}: ${type} = ${JSON.stringify(value)} (actual bool: ${isActualBoolean}, string bool: ${isStringBoolean})`);
          });
        });
      }

      // 7. Query back and check types
      console.log('\n7. QUERYING DATA BACK - CHECKING IF TYPES CHANGE');
      const { data: queriedProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      console.log('\nQueried project field types:');
      Object.entries(queriedProject).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)}`);
      });

      // 8. Check enum values from all_enums
      console.log('\n8. ALL_ENUMS - CHECKING VALUE TYPES');
      const { data: enumVals } = await supabase
        .from('all_enums')
        .select('*')
        .limit(5);

      enumVals?.forEach(e => {
        console.log(`\nEnum record:`);
        Object.entries(e).forEach(([key, value]) => {
          console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)}`);
        });
      });

      // Clean up
      await supabase.from('project_criteria_values').delete().eq('project_criterion_id', projCrit[0].id);
      await supabase.from('project_criteria').delete().eq('project_id', project.id);
      await supabase.from('projects').delete().eq('id', project.id);
    }
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

exhaustiveAudit().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
