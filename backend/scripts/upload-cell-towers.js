/**
 * Upload Cell Towers to Supabase PostGIS
 * Reads cell_towers.csv and inserts into Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadCellTowers() {
  const csvPath = path.join(__dirname, '../../mock-data/v3/cell_towers.csv');
  
  console.log('📡 Starting cell tower upload to Supabase...');
  console.log(`📁 Reading from: ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ cell_towers.csv not found!');
    process.exit(1);
  }

  const towers = [];
  let rowCount = 0;

  // Read CSV file using csv-parse stream
  const parser = fs.createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    })
  );

  console.log('📖 Parsing CSV...');
  for await (const row of parser) {
    rowCount++;
    
    // Transform CSV row to Supabase format
    towers.push({
      cell_id: row.cell_id,
      name: row.name || row.cell_id,
      location: `POINT(${row.lon} ${row.lat})`,
      range_km: parseFloat(row.range_km) || 2.0,
      operator: row.provider || null,
      tower_type: row.tower_type || 'GSM',
    });

    if (rowCount % 10000 === 0) {
      console.log(`📦 Processed ${rowCount} rows...`);
    }
  }

  console.log(`✅ Parsed ${rowCount} cell towers from CSV`);
  
  console.log('🧹 Cleaning up existing data in cell_towers_2...');
  const { error: deleteError } = await supabase
    .from('cell_towers_2')
    .delete()
    .neq('cell_id', 'FORCE_DELETE_ALL'); // Dummy condition to delete all rows

  if (deleteError) {
    console.warn('⚠️  Cleanup failed or table does not support delete:', deleteError.message);
    console.log('Continuing with upsert (will overwrite existing IDs)...');
  } else {
    console.log('✅ Existing data cleared');
  }

  console.log('⬆️  Uploading to Supabase in batches...');

  // Upload in batches of 1000 using RPC for better performance
  const BATCH_SIZE = 1000;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < towers.length; i += BATCH_SIZE) {
    const batch = towers.slice(i, i + BATCH_SIZE);
    
    try {
      // Use direct insert to cell_towers_2 with PostGIS string
      const { data, error } = await supabase
        .from('cell_towers_2')
        .upsert(batch, { onConflict: 'cell_id' });

      if (error) {
        console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
        errors += batch.length;
      } else {
        uploaded += batch.length;
        if (uploaded % 5000 === 0 || uploaded === towers.length) {
          console.log(`✅ Uploaded ${uploaded}/${towers.length} towers (${Math.round((uploaded / towers.length) * 100)}%)`);
        }
      }
    } catch (err) {
      console.error(`❌ Error uploading batch:`, err.message);
      errors += batch.length;
    }
  }

  console.log('\n📊 Upload Summary:');
  console.log(`   ✅ Successful: ${uploaded}`);
  console.log(`   ❌ Failed: ${errors}`);
  console.log(`   📈 Total: ${rowCount}`);

  if (uploaded > 0) {
    console.log('\n🎉 Cell towers uploaded successfully!');
  } else {
    console.error('\n❌ No towers were uploaded. Check Supabase connection.');
  }
}

uploadCellTowers().catch(console.error);
