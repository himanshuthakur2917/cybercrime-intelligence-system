#!/usr/bin/env node
/**
 * TRIANGULATION DATA VALIDATION SCRIPT
 * =====================================
 * Analyzes suspects, CDR, and victim data to identify phantom towers
 * and validate triangulation data integrity
 */

const fs = require('fs');
const path = require('path');

// 📊 DATA STRUCTURES
const suspects = new Map(); // phone -> suspect data
const cdrRecords = [];
const victims = new Map(); // phone -> victim data
const towerCoordinates = new Map(); // tower_id -> {lat, lon}

console.log('\n🔍 TRIANGULATION DATA ANALYSIS\n');
console.log('═'.repeat(70));

// 📖 LOAD SUSPECTS DATA
function loadSuspects() {
  console.log('\n📥 Loading suspects data...');
  const suspectFile = path.join(
    __dirname,
    '../mock-data/v3/suspects_enhanced.csv',
  );

  try {
    const data = fs.readFileSync(suspectFile, 'utf-8');
    const lines = data.split('\n');
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = parseCsvLine(line);
      if (row.length >= 12) {
        const phone = row[0];
        const name = row[1];
        const trajectory = row[11];

        suspects.set(phone, {
          name,
          trajectory: trajectory
            ? trajectory.split('|').map((p) => {
                const [lat, lon] = p.split(',');
                return { lat: parseFloat(lat), lon: parseFloat(lon) };
              })
            : [],
        });

        count++;
      }
    }

    console.log(`✅ Loaded ${count} suspects`);
  } catch (error) {
    console.error(`❌ Error loading suspects: ${error.message}`);
  }
}

// 📖 LOAD CDR DATA
function loadCDR() {
  console.log('\n📥 Loading CDR data...');
  const cdrFile = path.join(
    __dirname,
    '../case-data/CASE-DELHI-001/cdr.csv',
  );

  try {
    const data = fs.readFileSync(cdrFile, 'utf-8');
    const lines = data.split('\n');
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [caller, callee, timestamp, duration, lat, lon, tower_id] =
        line.split(',');

      cdrRecords.push({
        caller_phone: caller,
        callee_phone: callee,
        timestamp,
        duration: parseInt(duration),
        position: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        },
        tower_id,
      });

      // Track unique towers
      if (!towerCoordinates.has(tower_id)) {
        towerCoordinates.set(tower_id, {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        });
      }

      count++;
    }

    console.log(`✅ Loaded ${count} CDR records`);
    console.log(`   Found ${towerCoordinates.size} unique towers`);
  } catch (error) {
    console.error(`❌ Error loading CDR: ${error.message}`);
  }
}

// 📊 ANALYZE PHANTOM TOWERS
function analyzePhantomTowers() {
  console.log('\n📊 PHANTOM TOWER ANALYSIS');
  console.log('─'.repeat(70));

  const phantomTowersByLet = new Map();
  const validTowersByLet = new Map();

  cdrRecords.forEach((cdr) => {
    const tower = cdr.tower_id;
    const isPhantom = tower.startsWith('DELHI-CT-');

    if (isPhantom) {
      if (!phantomTowersByLet.has(tower)) {
        phantomTowersByLet.set(tower, {
          count: 0,
          coordinates: cdr.position,
          callers: new Set(),
        });
      }
      const data = phantomTowersByLet.get(tower);
      data.count++;
      data.callers.add(cdr.caller_phone);
    } else {
      if (!validTowersByLet.has(tower)) {
        validTowersByLet.set(tower, {
          count: 0,
          coordinates: cdr.position,
          callers: new Set(),
        });
      }
      const data = validTowersByLet.get(tower);
      data.count++;
      data.callers.add(cdr.caller_phone);
    }
  });

  console.log(`\n⚠️  PHANTOM TOWERS (GENERATED IDENTIFIERS):`);
  console.log(
    `   Total phantom tower IDs: ${phantomTowersByLet.size}`,
  );
  const phantomArray = Array.from(phantomTowersByLet.entries()).slice(0, 10);
  phantomArray.forEach(([tower, data]) => {
    console.log(
      `   ${tower}: ${data.count} records | ${data.callers.size} callers | (${data.coordinates.lat.toFixed(4)}, ${data.coordinates.lon.toFixed(4)})`,
    );
  });
  if (phantomTowersByLet.size > 10) {
    console.log(`   ... and ${phantomTowersByLet.size - 10} more`);
  }

  console.log(`\n✅ VALID TOWERS (LEGACY DL-* FORMAT):`);
  console.log(`   Total valid tower IDs: ${validTowersByLet.size}`);
  const validArray = Array.from(validTowersByLet.entries()).slice(0, 10);
  validArray.forEach(([tower, data]) => {
    console.log(
      `   ${tower}: ${data.count} records | ${data.callers.size} callers | (${data.coordinates.lat.toFixed(4)}, ${data.coordinates.lon.toFixed(4)})`,
    );
  });
  if (validTowersByLet.size > 10) {
    console.log(`   ... and ${validTowersByLet.size - 10} more`);
  }

  return { phantomTowersByLet, validTowersByLet };
}

// 📊 ANALYZE SUSPECT TRIANGULATION DATA
function analyzeSuspectTriangulation() {
  console.log('\n📊 SUSPECT TRIANGULATION ANALYSIS');
  console.log('─'.repeat(70));

  const suspectTowers = new Map(); // phone -> towers

  cdrRecords.forEach((cdr) => {
    if (!suspectTowers.has(cdr.caller_phone)) {
      suspectTowers.set(cdr.caller_phone, new Set());
    }
    suspectTowers.get(cdr.caller_phone).add(cdr.tower_id);
  });

  console.log(
    `\nSuspects with triangulation data (${suspectTowers.size}):`,
  );

  const sortedSuspects = Array.from(suspectTowers.entries())
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10); // Top 10

  sortedSuspects.forEach(([phone, towers]) => {
    const suspect = suspects.get(phone) || { name: 'Unknown' };
    const towerArray = Array.from(towers);
    const phantomCount = towerArray.filter((t) =>
      t.startsWith('DELHI-CT-'),
    ).length;
    const validCount = towerArray.length - phantomCount;

    console.log(`\n📍 ${suspect.name} (${phone})`);
    console.log(`   Total towers: ${towerArray.length}`);
    console.log(
      `   ✅ Valid: ${validCount} | ❌ Phantom: ${phantomCount}`,
    );
    if (towerArray.length <= 10) {
      console.log(`   Towers: ${towerArray.join(', ')}`);
    } else {
      console.log(
        `   Towers: ${towerArray.slice(0, 10).join(', ')}...`,
      );
    }

    // Calculate triangulation center from trajectory
    if (suspect.trajectory && suspect.trajectory.length > 0) {
      const avgLat =
        suspect.trajectory.reduce((sum, p) => sum + p.lat, 0) /
        suspect.trajectory.length;
      const avgLon =
        suspect.trajectory.reduce((sum, p) => sum + p.lon, 0) /
        suspect.trajectory.length;

      console.log(
        `   Trajectory center: (${avgLat.toFixed(4)}, ${avgLon.toFixed(4)})`,
      );
    }
  });
}

// 📊 COMPARE TRAJECTORIES VS CDR
function compareTrajectoryVsCDR() {
  console.log('\n📊 TRAJECTORY vs CDR POSITION ANALYSIS');
  console.log('─'.repeat(70));

  let distanceMatches = 0;
  let distanceMismatches = 0;
  const mismatches = [];

  suspects.forEach((suspect, phone) => {
    if (suspect.trajectory.length === 0) return;

    // Get CDR positions for this suspect
    const cdrForSuspect = cdrRecords.filter((c) => c.caller_phone === phone);
    if (cdrForSuspect.length === 0) return;

    // Calculate average distance between trajectory center and CDR positions
    const trajCenter = {
      lat:
        suspect.trajectory.reduce((sum, p) => sum + p.lat, 0) /
        suspect.trajectory.length,
      lon:
        suspect.trajectory.reduce((sum, p) => sum + p.lon, 0) /
        suspect.trajectory.length,
    };

    const cdrAvg = {
      lat:
        cdrForSuspect.reduce((sum, c) => sum + c.position.lat, 0) /
        cdrForSuspect.length,
      lon:
        cdrForSuspect.reduce((sum, c) => sum + c.position.lon, 0) /
        cdrForSuspect.length,
    };

    const distance = calculateDistance(
      trajCenter.lat,
      trajCenter.lon,
      cdrAvg.lat,
      cdrAvg.lon,
    );

    if (distance < 5) {
      // Within 5 km
      distanceMatches++;
    } else {
      distanceMismatches++;
      mismatches.push({
        name: suspect.name,
        phone,
        distance,
        trajCenter,
        cdrAvg,
      });
    }
  });

  console.log(`\n✅ Matches (within 5 km): ${distanceMatches}`);
  console.log(`❌ Mismatches (>5 km): ${distanceMismatches}`);

  if (mismatches.length > 0) {
    console.log('\nTop mismatches:');
    mismatches
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 5)
      .forEach((m) => {
        console.log(`\n❌ ${m.name} (${m.phone})`);
        console.log(
          `   Trajectory: (${m.trajCenter.lat.toFixed(4)}, ${m.trajCenter.lon.toFixed(4)})`,
        );
        console.log(
          `   CDR avg: (${m.cdrAvg.lat.toFixed(4)}, ${m.cdrAvg.lon.toFixed(4)})`,
        );
        console.log(`   Distance: ${m.distance.toFixed(2)} km`);
      });
  }
}

// 🧮 HELPER: Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🧮 HELPER: Parse CSV line (handle quoted fields)
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// 🎯 MAIN EXECUTION
async function main() {
  try {
    await loadSuspects();
    await loadCDR();

    const { phantomTowersByLet, validTowersByLet } = analyzePhantomTowers();
    analyzeSuspectTriangulation();
    compareTrajectoryVsCDR();

    // 📋 SUMMARY
    console.log('\n' + '═'.repeat(70));
    console.log('\n📋 SUMMARY');
    console.log('─'.repeat(70));
    console.log(
      `Total CDR records: ${cdrRecords.length}`,
    );
    console.log(
      `Total unique towers: ${towerCoordinates.size}`,
    );
    console.log(
      `  ✅ Valid DL-* towers: ${validTowersByLet.size}`,
    );
    console.log(
      `  ❌ Phantom DELHI-CT-* towers: ${phantomTowersByLet.size}`,
    );
    console.log(
      `Total suspects: ${suspects.size}`,
    );

    // 🎯 RECOMMENDATIONS
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('─'.repeat(70));
    console.log(
      '1. ✅ Replace CDR imports to use only DL-* tower IDs from Supabase',
    );
    console.log(
      '2. ❌ Stop using DELHI-CT-* phantom towers (they have coordinates but no real tower data)',
    );
    console.log(
      '3. 🔄 Re-run triangulation after fixing tower IDs in CDR',
    );
    console.log(
      '4. 📊 Validate trajectory data independently from CDR',
    );

    console.log('\n' + '═'.repeat(70) + '\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
