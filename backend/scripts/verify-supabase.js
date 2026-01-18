const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifySupabase() {
  console.log('📡 Verifying Supabase Cell Tower Tables...');

  // Check cell_towers
  const { count: count1, error: error1 } = await supabase
    .from('cell_towers')
    .select('*', { count: 'exact', head: true });
  
  if (error1) {
    console.log('❌ Table "cell_towers" error/not found:', error1.message);
  } else {
    console.log(`✅ Table "cell_towers" has ${count1} rows`);
  }

  // Check cell_towers_2
  const { count: count2, error: error2 } = await supabase
    .from('cell_towers_2')
    .select('*', { count: 'exact', head: true });
  
  if (error2) {
    console.log('❌ Table "cell_towers_2" error/not found:', error2.message);
  } else {
    console.log(`✅ Table "cell_towers_2" has ${count2} rows`);
  }

  // Check for specific Delhi towers in cell_towers_2
  if (!error2 && count2 > 0) {
    const { data: sample, error: sampleError } = await supabase
      .from('cell_towers_2')
      .select('cell_id, name, lat, lon')
      .limit(5);
    
    if (sampleError) {
      console.log('❌ Error fetching sample from cell_towers_2:', sampleError.message);
    } else {
      console.log('\n📊 Sample rows from cell_towers_2:');
      console.table(sample);
      
      const hasGeneratedCoords = sample.some(t => t.lat != null && t.lon != null);
      if (!hasGeneratedCoords) {
        console.warn('\n⚠️ WARNING: lat/lon columns appear to be empty/null in cell_towers_2!');
      } else {
        console.log('\n✅ lat/lon columns are populated in cell_towers_2');
      }
    }
  }

  if (count2 === 0 && count1 > 0) {
    console.log('\n💡 TIP: It looks like data is in "cell_towers" but "cell_towers_2" is empty.');
    console.log('You might need to copy data: INSERT INTO cell_towers_2 SELECT * FROM cell_towers;');
  }
}

verifySupabase().catch(console.error);
