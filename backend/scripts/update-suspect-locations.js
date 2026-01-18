
import fs from 'fs';
import path from 'path';

const suspectsPath = 'c:\\Users\\gaurav\\OneDrive\\Desktop\\Hacks\\cybercrime-intelligence-system\\mock-data\\v3\\suspects_enhanced.csv';
const towersPath = 'c:\\Users\\gaurav\\OneDrive\\Desktop\\Hacks\\cybercrime-intelligence-system\\data\\delhi-cell-towers.csv';

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i];
        });
        return obj;
    });
    return { headers, data };
}

const { data: towers } = parseCSV(towersPath);
const { headers, data: suspects } = parseCSV(suspectsPath);

// Generate random points near a tower
function generateNearbyPoints(tower, count = 5) {
    const points = [];
    const baseLat = parseFloat(tower.lat);
    const baseLon = parseFloat(tower.lon);
    
    for (let i = 0; i < count; i++) {
        const lat = (baseLat + (Math.random() - 0.5) * 0.01).toFixed(4);
        const lon = (baseLon + (Math.random() - 0.5) * 0.01).toFixed(4);
        points.push(`${lat},${lon}`);
    }
    return points;
}

const updatedSuspects = suspects.map((s, index) => {
    // Pick a tower based on index to distribute suspects across Delhi
    const tower = towers[index % towers.length];
    const points = generateNearbyPoints(tower, 6);
    
    return {
        ...s,
        last_known_location: points[points.length - 1],
        trajectory_history: points.join('|')
    };
});

const newHeaders = [...headers, 'last_known_location', 'trajectory_history'];
const csvContent = [
    newHeaders.join(','),
    ...updatedSuspects.map(s => newHeaders.map(h => {
        const val = s[h] || '';
        return val.includes(',') || val.includes('|') ? `"${val}"` : val;
    }).join(','))
].join('\n');

fs.writeFileSync(suspectsPath, csvContent);
console.log('Updated suspects_enhanced.csv with location data.');
