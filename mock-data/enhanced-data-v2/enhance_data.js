/**
 * Improved Data Enhancement Script
 * Uses matched_suspect_id and matched_victim_id to resolve names
 */
const fs = require('fs');
const path = require('path');

const dataDir = __dirname;

// Parse CSV properly (handles quotes)
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

// Build ID→name lookups (primary method)
const suspectById = {};
suspects.forEach(s => { suspectById[s.suspect_id] = s.name; });

const victimById = {};
victims.forEach(v => { victimById[v.victim_id] = v.name; });

// Build phone→name lookups (fallback)
const suspectByPhone = {};
suspects.forEach(s => { 
  suspectByPhone[s.phone] = s.name; 
  if (s.alternate_phone) suspectByPhone[s.alternate_phone] = s.name;
});

const victimByPhone = {};
victims.forEach(v => { 
  victimByPhone[v.phone] = v.name; 
  if (v.alternate_phone) victimByPhone[v.alternate_phone] = v.name;
});

console.log(`✅ Loaded ${suspects.length} suspects, ${victims.length} victims, ${calls.length} calls`);

// Enhance calls
console.log('🔄 Enhancing call records...');
let matchedBoth = 0;
let matchedCaller = 0;
let matchedReceiver = 0;

const enhanced = calls.map(call => {
  // 1. Try to resolve caller name using matched_suspect_id first
  let caller_name = '';
  let caller_role = 'UNKNOWN';
  
  if (call.matched_suspect_id && call.matched_suspect_id !== 'UNKNOWN') {
    caller_name = suspectById[call.matched_suspect_id] || '';
    if (caller_name) caller_role = 'SUSPECT';
  }
  // Fallback to phone lookup
  if (!caller_name) {
    caller_name = suspectByPhone[call.caller_phone] || '';
    if (caller_name) caller_role = 'SUSPECT';
  }
  
  // 2. Try to resolve receiver name using matched_victim_id first
  let receiver_name = '';
  let receiver_role = 'UNKNOWN';
  
  if (call.matched_victim_id && call.matched_victim_id !== 'UNKNOWN') {
    receiver_name = victimById[call.matched_victim_id] || '';
    if (receiver_name) receiver_role = 'VICTIM';
  }
  // Fallback to phone lookup (try victim first, then suspect)
  if (!receiver_name) {
    receiver_name = victimByPhone[call.receiver_phone] || '';
    if (receiver_name) receiver_role = 'VICTIM';
  }
  if (!receiver_name) {
    receiver_name = suspectByPhone[call.receiver_phone] || '';
    if (receiver_name) receiver_role = 'SUSPECT';
  }
  
  // Stats
  if (caller_name && receiver_name) matchedBoth++;
  if (caller_name) matchedCaller++;
  if (receiver_name) matchedReceiver++;
  
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
console.log('\n📊 Resolution Results:');
console.log(`  Caller resolved: ${matchedCaller}/${calls.length} (${(matchedCaller/calls.length*100).toFixed(1)}%)`);
console.log(`  Receiver resolved: ${matchedReceiver}/${calls.length} (${(matchedReceiver/calls.length*100).toFixed(1)}%)`);
console.log(`  Both resolved: ${matchedBoth}/${calls.length} (${(matchedBoth/calls.length*100).toFixed(1)}%)`);
console.log('🎉 Done!');
