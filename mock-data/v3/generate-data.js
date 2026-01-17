/**
 * Mock Data Generator for Hybrid CIS v3
 * Generates 850,000 cell towers covering all of India
 */

const fs = require('fs');
const path = require('path');

// India's bounding box (approximate)
const INDIA_BOUNDS = {
  minLat: 8.0,    // Southern tip (Kanyakumari)
  maxLat: 37.0,   // Northern tip (Kashmir)
  minLon: 68.0,   // Western tip (Gujarat)
  maxLon: 97.5    // Eastern tip (Arunachal Pradesh)
};

// Indian states with approximate bounds for realistic distribution
const STATES = [
  { code: 'DL', name: 'Delhi', minLat: 28.4, maxLat: 28.9, minLon: 76.8, maxLon: 77.4, density: 3 },
  { code: 'MH', name: 'Maharashtra', minLat: 15.6, maxLat: 22.0, minLon: 72.6, maxLon: 80.9, density: 2 },
  { code: 'KA', name: 'Karnataka', minLat: 11.6, maxLat: 18.4, minLon: 74.1, maxLon: 78.4, density: 2 },
  { code: 'TN', name: 'Tamil Nadu', minLat: 8.1, maxLat: 13.6, minLon: 76.2, maxLon: 80.3, density: 2 },
  { code: 'GJ', name: 'Gujarat', minLat: 20.1, maxLat: 24.7, minLon: 68.2, maxLon: 74.5, density: 1.5 },
  { code: 'UP', name: 'Uttar Pradesh', minLat: 23.9, maxLat: 30.4, minLon: 77.1, maxLon: 84.6, density: 2 },
  { code: 'WB', name: 'West Bengal', minLat: 21.5, maxLat: 27.2, minLon: 85.8, maxLon: 89.9, density: 1.5 },
  { code: 'RJ', name: 'Rajasthan', minLat: 23.1, maxLat: 30.2, minLon: 69.5, maxLon: 78.3, density: 1 },
  { code: 'MP', name: 'Madhya Pradesh', minLat: 21.1, maxLat: 26.9, minLon: 74.0, maxLon: 82.8, density: 1 },
  { code: 'AP', name: 'Andhra Pradesh', minLat: 12.6, maxLat: 19.9, minLon: 76.8, maxLon: 84.8, density: 1.5 },
  { code: 'TS', name: 'Telangana', minLat: 15.8, maxLat: 19.9, minLon: 77.2, maxLon: 81.3, density: 1.5 },
  { code: 'KL', name: 'Kerala', minLat: 8.3, maxLat: 12.8, minLon: 74.9, maxLon: 77.4, density: 2 },
  { code: 'OR', name: 'Odisha', minLat: 17.8, maxLat: 22.6, minLon: 81.4, maxLon: 87.5, density: 1 },
  { code: 'PB', name: 'Punjab', minLat: 29.5, maxLat: 32.5, minLon: 73.9, maxLon: 76.9, density: 1.5 },
  { code: 'HR', name: 'Haryana', minLat: 27.7, maxLat: 30.9, minLon: 74.5, maxLon: 77.6, density: 1.5 },
  { code: 'BR', name: 'Bihar', minLat: 24.3, maxLat: 27.5, minLon: 83.3, maxLon: 88.3, density: 1 },
  { code: 'JH', name: 'Jharkhand', minLat: 21.9, maxLat: 25.3, minLon: 83.3, maxLon: 87.9, density: 1 },
  { code: 'AS', name: 'Assam', minLat: 24.1, maxLat: 28.0, minLon: 89.7, maxLon: 96.0, density: 0.8 },
  { code: 'CG', name: 'Chhattisgarh', minLat: 17.8, maxLat: 24.1, minLon: 80.3, maxLon: 84.4, density: 0.8 },
  { code: 'JK', name: 'Jammu & Kashmir', minLat: 32.3, maxLat: 37.0, minLon: 73.3, maxLon: 80.3, density: 0.5 },
  { code: 'UK', name: 'Uttarakhand', minLat: 28.7, maxLat: 31.5, minLon: 77.6, maxLon: 81.0, density: 0.7 },
  { code: 'HP', name: 'Himachal Pradesh', minLat: 30.4, maxLat: 33.3, minLon: 75.6, maxLon: 79.0, density: 0.6 },
  { code: 'GA', name: 'Goa', minLat: 14.9, maxLat: 15.8, minLon: 73.7, maxLon: 74.3, density: 2 },
  { code: 'TR', name: 'Tripura', minLat: 22.9, maxLat: 24.5, minLon: 91.1, maxLon: 92.3, density: 0.7 },
  { code: 'MN', name: 'Manipur', minLat: 23.8, maxLat: 25.7, minLon: 93.0, maxLon: 94.8, density: 0.5 },
  { code: 'NL', name: 'Nagaland', minLat: 25.1, maxLat: 27.0, minLon: 93.3, maxLon: 95.2, density: 0.4 },
  { code: 'MZ', name: 'Mizoram', minLat: 21.9, maxLat: 24.5, minLon: 92.2, maxLon: 93.4, density: 0.4 },
  { code: 'AR', name: 'Arunachal Pradesh', minLat: 26.6, maxLat: 29.5, minLon: 91.6, maxLon: 97.4, density: 0.3 },
  { code: 'SK', name: 'Sikkim', minLat: 27.1, maxLat: 28.1, minLon: 88.0, maxLon: 88.9, density: 0.5 },
  { code: 'ML', name: 'Meghalaya', minLat: 25.0, maxLat: 26.1, minLon: 89.8, maxLon: 92.8, density: 0.6 },
];

const PROVIDERS = ['Jio', 'Airtel', 'Vodafone-Idea', 'BSNL', 'MTNL'];
const TOWER_TYPES = ['MACRO', 'MICRO', 'PICO', 'FEMTO'];

// Generate random float between min and max
function randomFloat(min, max, decimals = 6) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate random integer between min and max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random element from array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate tower ID
function generateTowerId(stateCode, index) {
  return `${stateCode}-${String(index).padStart(6, '0')}`;
}

// Main generation function
async function generateCellTowers() {
  const TOTAL_TOWERS = 850000;
  const outputPath = path.join(__dirname, 'cell_towers.csv');
  
  console.log(`🏗️  Generating ${TOTAL_TOWERS.toLocaleString()} cell towers...`);
  console.log(`📁 Output: ${outputPath}`);
  
  // Calculate towers per state based on density
  const totalDensity = STATES.reduce((sum, s) => sum + s.density, 0);
  const stateAllocations = STATES.map(state => ({
    ...state,
    count: Math.floor((state.density / totalDensity) * TOTAL_TOWERS)
  }));
  
  // Adjust to hit exact target
  const allocated = stateAllocations.reduce((sum, s) => sum + s.count, 0);
  stateAllocations[0].count += TOTAL_TOWERS - allocated;
  
  // Create write stream
  const writeStream = fs.createWriteStream(outputPath);
  
  // Write header
  writeStream.write('cell_id,name,lat,lon,range_km,state,city,tower_type,provider\n');
  
  let totalWritten = 0;
  const startTime = Date.now();
  
  for (const state of stateAllocations) {
    const batchSize = 10000;
    let stateIndex = 0;
    
    while (stateIndex < state.count) {
      const batch = [];
      const batchEnd = Math.min(stateIndex + batchSize, state.count);
      
      for (let i = stateIndex; i < batchEnd; i++) {
        const lat = randomFloat(state.minLat, state.maxLat);
        const lon = randomFloat(state.minLon, state.maxLon);
        const rangeKm = randomFloat(0.5, 5.0, 1);
        const provider = randomChoice(PROVIDERS);
        const towerType = randomChoice(TOWER_TYPES);
        const towerId = generateTowerId(state.code, i);
        const name = `${state.name} Tower ${i + 1}`;
        
        batch.push(`${towerId},"${name}",${lat},${lon},${rangeKm},${state.name},${state.name},${towerType},${provider}`);
      }
      
      writeStream.write(batch.join('\n') + '\n');
      totalWritten += batch.length;
      stateIndex = batchEnd;
      
      // Progress update
      if (totalWritten % 100000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = Math.round(totalWritten / elapsed);
        console.log(`  ✅ ${totalWritten.toLocaleString()} towers (${rate.toLocaleString()}/sec)`);
      }
    }
  }
  
  writeStream.end();
  
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(`\n🎉 Complete! Generated ${totalWritten.toLocaleString()} towers in ${elapsed.toFixed(1)}s`);
      resolve(totalWritten);
    });
  });
}

// Generate restricted zones (sensitive areas)
async function generateRestrictedZones() {
  const outputPath = path.join(__dirname, 'restricted_zones.csv');
  
  console.log('\n🔒 Generating restricted zones...');
  
  const zones = [
    // Airports
    { name: 'Delhi IGI Airport Zone', polygon: 'POLYGON((77.0600 28.5200, 77.1200 28.5200, 77.1200 28.5800, 77.0600 28.5800, 77.0600 28.5200))' },
    { name: 'Mumbai CSIA Zone', polygon: 'POLYGON((72.8500 19.0800, 72.9000 19.0800, 72.9000 19.1100, 72.8500 19.1100, 72.8500 19.0800))' },
    { name: 'Bengaluru KEA Zone', polygon: 'POLYGON((77.6800 13.1900, 77.7200 13.1900, 77.7200 13.2200, 77.6800 13.2200, 77.6800 13.1900))' },
    { name: 'Chennai MAA Zone', polygon: 'POLYGON((80.1500 12.9800, 80.2000 12.9800, 80.2000 13.0200, 80.1500 13.0200, 80.1500 12.9800))' },
    { name: 'Kolkata CCU Zone', polygon: 'POLYGON((88.4200 22.6400, 88.4700 22.6400, 88.4700 22.6800, 88.4200 22.6800, 88.4200 22.6400))' },
    { name: 'Hyderabad RGI Zone', polygon: 'POLYGON((78.4200 17.2300, 78.4700 17.2300, 78.4700 17.2700, 78.4200 17.2700, 78.4200 17.2300))' },
    { name: 'Ranchi Birsa Airport Zone', polygon: 'POLYGON((85.3150 23.3200, 85.3350 23.3200, 85.3350 23.3350, 85.3150 23.3350, 85.3150 23.3200))' },
    // Military bases
    { name: 'Jaisalmer Military Zone', polygon: 'POLYGON((70.8000 26.8000, 71.0000 26.8000, 71.0000 27.0000, 70.8000 27.0000, 70.8000 26.8000))' },
    { name: 'Leh Military Zone', polygon: 'POLYGON((77.5000 34.1000, 77.6000 34.1000, 77.6000 34.2000, 77.5000 34.2000, 77.5000 34.1000))' },
    { name: 'Pokhran Test Range', polygon: 'POLYGON((71.8000 27.0000, 72.0000 27.0000, 72.0000 27.2000, 71.8000 27.2000, 71.8000 27.0000))' },
    // Government complexes
    { name: 'Parliament House Zone', polygon: 'POLYGON((77.2000 28.6100, 77.2100 28.6100, 77.2100 28.6200, 77.2000 28.6200, 77.2000 28.6100))' },
    { name: 'Rashtrapati Bhavan Zone', polygon: 'POLYGON((77.1950 28.6100, 77.2050 28.6100, 77.2050 28.6200, 77.1950 28.6200, 77.1950 28.6100))' },
    { name: 'Mantralaya Mumbai Zone', polygon: 'POLYGON((72.9200 18.9250, 72.9300 18.9250, 72.9300 18.9350, 72.9200 18.9350, 72.9200 18.9250))' },
    { name: 'Vidhana Soudha Zone', polygon: 'POLYGON((77.5850 12.9750, 77.5950 12.9750, 77.5950 12.9850, 77.5850 12.9850, 77.5850 12.9750))' },
    // Border areas
    { name: 'Wagah Border Zone', polygon: 'POLYGON((74.5500 31.6000, 74.6000 31.6000, 74.6000 31.6500, 74.5500 31.6500, 74.5500 31.6000))' },
    { name: 'Attari Border Zone', polygon: 'POLYGON((74.5000 31.3500, 74.5500 31.3500, 74.5500 31.4000, 74.5000 31.4000, 74.5000 31.3500))' },
    // Nuclear facilities
    { name: 'BARC Mumbai Zone', polygon: 'POLYGON((72.9100 19.0000, 72.9300 19.0000, 72.9300 19.0200, 72.9100 19.0200, 72.9100 19.0000))' },
    { name: 'Kudankulam Nuclear Zone', polygon: 'POLYGON((77.6800 8.1600, 77.7200 8.1600, 77.7200 8.2000, 77.6800 8.2000, 77.6800 8.1600))' },
    { name: 'Tarapur Nuclear Zone', polygon: 'POLYGON((72.6500 19.8000, 72.7000 19.8000, 72.7000 19.8500, 72.6500 19.8500, 72.6500 19.8000))' },
    // Defense research
    { name: 'DRDO Hyderabad Zone', polygon: 'POLYGON((78.3800 17.4500, 78.4200 17.4500, 78.4200 17.4900, 78.3800 17.4900, 78.3800 17.4500))' },
  ];
  
  const header = 'name,polygon_wkt\n';
  const rows = zones.map(z => `"${z.name}","${z.polygon}"`).join('\n');
  
  fs.writeFileSync(outputPath, header + rows + '\n');
  console.log(`  ✅ ${zones.length} restricted zones generated`);
}

// Generate suspects
async function generateSuspects() {
  const TOTAL_SUSPECTS = 500;
  const outputPath = path.join(__dirname, 'suspects.csv');
  
  console.log(`\n👤 Generating ${TOTAL_SUSPECTS} suspects...`);
  
  const firstNames = ['Rajesh', 'Suresh', 'Arun', 'Vikram', 'Deepak', 'Amit', 'Rahul', 'Sanjay', 'Priya', 'Neha', 'Pooja', 'Sunita', 'Geeta', 'Meena', 'Kiran', 'Farooq', 'Mohammad', 'Abdul', 'Imran', 'Zara'];
  const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Yadav', 'Joshi', 'Mishra', 'Khan', 'Bhat', 'Reddy', 'Nair', 'Menon', 'Rao'];
  const aliases = ['Ghost', 'Shadow', 'Mastermind', 'Tech Wizard', 'Money King', 'The Don', 'Hawk', 'Fox', 'Tiger', 'Leopard'];
  const networkRoles = ['KINGPIN', 'FINANCIER', 'ENFORCER', 'RECRUITER', 'MULE', 'CALLER', 'HACKER', 'BROKER', 'SIM_PROVIDER', 'CONNECTOR'];
  
  const header = 'phone,name,risk,alias,network_role\n';
  const rows = [];
  
  for (let i = 0; i < TOTAL_SUSPECTS; i++) {
    const phone = `98${randomInt(10000000, 99999999)}`;
    const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    const risk = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][randomInt(0, 3)];
    const alias = randomChoice(aliases);
    const role = randomChoice(networkRoles);
    
    rows.push(`${phone},"${name}",${risk},${alias},${role}`);
  }
  
  fs.writeFileSync(outputPath, header + rows.join('\n') + '\n');
  console.log(`  ✅ ${TOTAL_SUSPECTS} suspects generated`);
}

// Generate victims
async function generateVictims() {
  const TOTAL_VICTIMS = 1000;
  const outputPath = path.join(__dirname, 'victims.csv');
  
  console.log(`\n🎯 Generating ${TOTAL_VICTIMS} victims...`);
  
  const firstNames = ['Ramesh', 'Sunil', 'Mohan', 'Shyam', 'Gopal', 'Anita', 'Rita', 'Sita', 'Uma', 'Lata', 'Kamla', 'Vijay', 'Ajay', 'Ravi', 'Suresh'];
  const lastNames = ['Agarwal', 'Bansal', 'Choudhary', 'Dubey', 'Gandhi', 'Hegde', 'Iyer', 'Jain', 'Kapoor', 'Lal', 'Mukherjee', 'Naidu', 'Pandey', 'Qureshi', 'Roy'];
  
  const header = 'phone,name,reported_loss,complaint_date\n';
  const rows = [];
  
  for (let i = 0; i < TOTAL_VICTIMS; i++) {
    const phone = `91${randomInt(10000000, 99999999)}`;
    const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    const loss = randomInt(5000, 5000000);
    const date = new Date(2024, randomInt(0, 11), randomInt(1, 28)).toISOString().split('T')[0];
    
    rows.push(`${phone},"${name}",${loss},${date}`);
  }
  
  fs.writeFileSync(outputPath, header + rows.join('\n') + '\n');
  console.log(`  ✅ ${TOTAL_VICTIMS} victims generated`);
}

// Generate CDR (Call Detail Records)
async function generateCDR() {
  const TOTAL_CDR = 50000;
  const outputPath = path.join(__dirname, 'cdr.csv');
  
  console.log(`\n📞 Generating ${TOTAL_CDR.toLocaleString()} CDR records...`);
  
  const header = 'caller_phone,callee_phone,timestamp,duration_sec,lat,lon,cell_tower_id\n';
  const rows = [];
  
  for (let i = 0; i < TOTAL_CDR; i++) {
    const caller = `98${randomInt(10000000, 99999999)}`;
    const callee = `91${randomInt(10000000, 99999999)}`;
    const timestamp = new Date(2024, randomInt(0, 11), randomInt(1, 28), randomInt(0, 23), randomInt(0, 59)).toISOString();
    const duration = randomInt(5, 3600);
    const lat = randomFloat(INDIA_BOUNDS.minLat, INDIA_BOUNDS.maxLat);
    const lon = randomFloat(INDIA_BOUNDS.minLon, INDIA_BOUNDS.maxLon);
    const stateCode = randomChoice(STATES).code;
    const towerId = `${stateCode}-${String(randomInt(0, 50000)).padStart(6, '0')}`;
    
    rows.push(`${caller},${callee},${timestamp},${duration},${lat},${lon},${towerId}`);
  }
  
  fs.writeFileSync(outputPath, header + rows.join('\n') + '\n');
  console.log(`  ✅ ${TOTAL_CDR.toLocaleString()} CDR records generated`);
}

// Generate transactions
async function generateTransactions() {
  const TOTAL_TXN = 30000;
  const outputPath = path.join(__dirname, 'transactions.csv');
  
  console.log(`\n💰 Generating ${TOTAL_TXN.toLocaleString()} transactions...`);
  
  const types = ['UPI', 'NEFT', 'IMPS', 'RTGS', 'WALLET', 'CARD'];
  const header = 'from_phone,to_phone,amount,timestamp,type,suspicious_score\n';
  const rows = [];
  
  for (let i = 0; i < TOTAL_TXN; i++) {
    const from = `98${randomInt(10000000, 99999999)}`;
    const to = `91${randomInt(10000000, 99999999)}`;
    const amount = randomInt(100, 1000000);
    const timestamp = new Date(2024, randomInt(0, 11), randomInt(1, 28), randomInt(0, 23), randomInt(0, 59)).toISOString();
    const type = randomChoice(types);
    const score = randomFloat(0, 1, 2);
    
    rows.push(`${from},${to},${amount},${timestamp},${type},${score}`);
  }
  
  fs.writeFileSync(outputPath, header + rows.join('\n') + '\n');
  console.log(`  ✅ ${TOTAL_TXN.toLocaleString()} transactions generated`);
}

// Main
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🇮🇳 Hybrid CIS v3 Mock Data Generator          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║   Generating India-wide mock data:               ║');
  console.log('║   • 850,000 cell towers (all India)              ║');
  console.log('║   • 20 restricted zones                          ║');
  console.log('║   • 500 suspects                                 ║');
  console.log('║   • 1,000 victims                                ║');
  console.log('║   • 50,000 CDR records                           ║');
  console.log('║   • 30,000 transactions                          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  await generateCellTowers();
  await generateRestrictedZones();
  await generateSuspects();
  await generateVictims();
  await generateCDR();
  await generateTransactions();
  
  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`\n✨ All data generated in ${totalTime.toFixed(1)} seconds!`);
}

main().catch(console.error);
