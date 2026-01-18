const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function checkData() {
  const session = driver.session();
  try {
    console.log('--- Investigations ---');
    const invResult = await session.run('MATCH (i:Investigation) RETURN i.id as id');
    invResult.records.forEach(r => console.log('ID:', r.get('id')));

    console.log('\n--- CDR Calls for all investigations ---');
    const cdrResult = await session.run(`
      MATCH (i:Investigation)-[:CONTAINS]->(s:Suspect)-[r:CDR_CALL]->(v:Suspect)
      RETURN i.id as invId, count(r) as callCount
    `);
    cdrResult.records.forEach(r => console.log('Inv:', r.get('invId'), 'Calls:', r.get('callCount')));

    console.log('\n--- Direct Suspects count ---');
    const suspectResult = await session.run('MATCH (s:Suspect) RETURN count(s) as count');
    console.log('Total Suspects:', suspectResult.records[0].get('count'));

  } finally {
    await session.close();
    await driver.close();
  }
}

checkData();
