
const neo4j = require('neo4j-driver');

async function checkData() {
    const driver = neo4j.driver(
        'neo4j+s://c6ff3293.databases.neo4j.io',
        neo4j.auth.basic('neo4j', 'AHBH5jkXRHTfiSpRSiyvPjBUjyTgvII06IbAimFvNvI') // Default credentials
    );
    const session = driver.session();

    const caseId = "30622644-39e7-4658-a64a-69a29f01afb8"
    console.log(`Checking data for Case ID: ${caseId}`);

    try {
        // Check Investigation node
        const invResult = await session.run(
            'MATCH (i:Investigation {id: $caseId}) RETURN i',
            { caseId }
        );
        console.log(`Investigation nodes found: ${invResult.records.length}`);

        // Check Suspects linked to Investigation
        const suspectResult = await session.run(
            'MATCH (i:Investigation {id: $caseId})-[:CONTAINS]->(s:Suspect) RETURN count(s) as count',
            { caseId }
        );
        console.log(`Suspects linked to investigation: ${suspectResult.records[0].get('count').toNumber()}`);

        // Check CDR Calls
        const cdrResult = await session.run(
            'MATCH (i:Investigation {id: $caseId})-[:CONTAINS]->(s:Suspect)-[r:CDR_CALL]->(v:Suspect) RETURN count(r) as count',
            { caseId }
        );
        console.log(`CDR Calls linked to suspects in investigation: ${cdrResult.records[0].get('count').toNumber()}`);

        // Check Tower IDs in CDR
        const towerResult = await session.run(
            'MATCH (i:Investigation {id: $caseId})-[:CONTAINS]->(s:Suspect)-[r:CDR_CALL]->(v:Suspect) RETURN r.callerTowerId, count(*) LIMIT 5',
            { caseId }
        );
        console.log('Sample Tower IDs in CDR:');
        towerResult.records.forEach(r => console.log(`- ${r.get(0)} (${r.get(1).toNumber()} calls)`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await session.close();
        await driver.close();
    }
}

checkData();
