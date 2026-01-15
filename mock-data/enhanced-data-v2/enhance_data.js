/**
 * Data Enhancement Script
 * Adds caller/receiver names and roles to calls data
 */
const fs = require('fs');
const path = require('path');

const dataDir = __dirname;

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else current += char;
    }
    values.push(current.trim());
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || '' }), {});
  });
}

// Load data
console.log('📂 Loading data files...');
const suspects = parseCSV(fs.readFileSync(path.join(dataDir, 'suspects_enhanced.csv'), 'utf8'));
const victims = parseCSV(fs.readFileSync(path.join(dataDir, 'victims_enhanced.csv'), 'utf8'));
const calls = parseCSV(fs.readFileSync(path.join(dataDir, 'calls_enhanced.csv'), 'utf8'));

// Build lookups
const suspectByPhone = {};
suspects.forEach(s => { suspectByPhone[s.phone] = s.name; });

const victimByPhone = {};
victims.forEach(v => { victimByPhone[v.phone] = v.name; });

const suspectById = {};
suspects.forEach(s => { suspectById[s.suspect_id] = s.name; });

const victimById = {};
victims.forEach(v => { victimById[v.victim_id] = v.name; });

console.log(`✅ Loaded ${suspects.length} suspects, ${victims.length} victims, ${calls.length} calls`);

// Enhance calls
console.log('🔄 Enhancing call records...');
const enhanced = calls.map(call => {
  // Resolve caller name (from suspect)
  let caller_name = suspectByPhone[call.caller_phone] || '';
  if (!caller_name && call.matched_suspect_id && call.matched_suspect_id !== 'UNKNOWN') {
    caller_name = suspectById[call.matched_suspect_id] || '';
  }
  
  // Resolve receiver name (from victim first, then suspect)
  let receiver_name = victimByPhone[call.receiver_phone] || '';
  if (!receiver_name && call.matched_victim_id && call.matched_victim_id !== 'UNKNOWN') {
    receiver_name = victimById[call.matched_victim_id] || '';
  }
  if (!receiver_name) {
    receiver_name = suspectByPhone[call.receiver_phone] || '';
  }
  
  // Determine roles
  const caller_role = suspectByPhone[call.caller_phone] ? 'SUSPECT' : 'UNKNOWN';
  const receiver_role = victimByPhone[call.receiver_phone] ? 'VICTIM' : 
                       suspectByPhone[call.receiver_phone] ? 'SUSPECT' : 'UNKNOWN';
  
  return {
    ...call,
    caller_name: caller_name || 'Unknown',
    receiver_name: receiver_name || 'Unknown', 
    caller_role,
    receiver_role
  };
});

// Write enhanced calls
const headers = Object.keys(enhanced[0]);
const csvContent = [
  headers.map(h => `"${h}"`).join(','),
  ...enhanced.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
].join('\n');

fs.writeFileSync(path.join(dataDir, 'calls_with_names.csv'), csvContent);
console.log('✅ Created calls_with_names.csv');

// Stats
const resolved = enhanced.filter(c => c.caller_name !== 'Unknown' && c.receiver_name !== 'Unknown').length;
console.log(`📊 ${resolved}/${enhanced.length} calls have both names resolved (${(resolved/enhanced.length*100).toFixed(1)}%)`);
console.log('🎉 Done!');
