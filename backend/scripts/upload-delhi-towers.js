const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadCellTowers() {
  const csvPath = path.join(__dirname, '../../data/delhi-cell-towers.csv');
  const towers = [];

  console.log('📡 Reading Delhi cell towers from CSV...');

  if (!fs.existsSync(csvPath)) {
    console.error('❌ Delhi cell towers CSV not found at:', csvPath);
    process.exit(1);
  }

  // First, parse the towers
  const parser = fs.createReadStream(csvPath).pipe(parse({ columns: true }));
  for await (const row of parser) {
    // Correct ID format from DELHI-CT-001 to DL-000001 to match Neo4j
    const idNum = row.cell_id.split('-').pop(); // Get 001, 002 etc
    const correctedId = `DL-${idNum.padStart(6, '0')}`;

    towers.push({
      cell_id: correctedId, // Corrected ID
      name: row.name,
      location: `POINT(${row.lon} ${row.lat})`, // PostGIS format
      range_km: parseFloat(row.range_km) || 2.0,
      operator: row.operator,
      address: row.address,
    });
  }

  console.log(`✅ Parsed ${towers.length} cell towers with corrected IDs`);

  // Cleanup: Delete existing data in cell_towers_2
  console.log('🧹 Cleaning up existing data in cell_towers_2...');
  const { error: deleteError } = await supabase
    .from('cell_towers_2')
    .delete()
    .neq('cell_id', 'FORCE_DELETE_ALL');

  if (deleteError) {
    console.warn('⚠️  Cleanup warning:', deleteError.message);
  } else {
    console.log('✅ Existing data cleared');
  }

  console.log('🚀 Uploading to cell_towers_2 table...');

  try {
    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < towers.length; i += batchSize) {
      const batch = towers.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('cell_towers_2')
        .upsert(batch, { onConflict: 'cell_id' });

      if (error) {
        console.error(`❌ Error uploading batch ${i / batchSize + 1}:`, error.message);
      } else {
        console.log(`✅ Uploaded batch ${i / batchSize + 1} (${batch.length} towers)`);
      }
    }

    console.log('🎉 100 Delhi cell towers uploaded successfully with DL-XXXXXX format!');
  } catch (err) {
    console.error('❌ Upload failed:', err);
    throw err;
  }
}

uploadCellTowers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
