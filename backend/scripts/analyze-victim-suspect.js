
const neo4j = require('neo4j-driver');

async function checkRelationships() {
    const driver = neo4j.driver(
        'neo4j+s://c6ff3293.databases.neo4j.io',
        neo4j.auth.basic('neo4j', 'AHBH5jkXRHTfiSpRSiyvPjBUjyTgvII06IbAimFvNvI')
    );
    const session = driver.session();

    const victimPhone = "9876543210"; // Rajendra Kumar Agarwal
    console.log(`Analyzing relationships for Victim Phone: ${victimPhone}`);

    try {
        // 1. Check if Victim node exists
        const victimResult = await session.run(
            'MATCH (v:Victim {phone: $phone}) RETURN v.name as name, v.victimId as id, labels(v) as labels',
            { phone: victimPhone }
        );
        console.log(`Victim search result: ${victimResult.records.length} nodes found`);
        if (victimResult.records.length > 0) {
            const v = victimResult.records[0];
            console.log(`- Name: ${v.get('name')}, ID: ${v.get('id')}, Labels: ${v.get('labels')}`);
        }

        // 2. Check for Suspect nodes matching victim phone
        const suspectResult = await session.run(
            'MATCH (s:Suspect {phone: $phone}) RETURN s.name as name, s.id as id, s.isVictim as isVictim, labels(s) as labels',
            { phone: victimPhone }
        );
        console.log(`Suspect nodes with victim phone: ${suspectResult.records.length} nodes found`);
        suspectResult.records.forEach(r => {
            console.log(`- Name: ${r.get('name')}, ID: ${r.get('id')}, isVictim: ${r.get('isVictim')}, Labels: ${r.get('labels')}`);
        });

        // 3. Check for calls TO the victim's phone
        const callsResult = await session.run(
            `MATCH (s:Suspect)-[r:CALLED|CDR_CALL]->(target) 
             WHERE target.phone = $phone OR (target:Suspect AND target.phone = $phone)
             RETURN s.name as caller, s.phone as callerPhone, r.callStartTime as time, labels(target) as targetLabels`,
            { phone: victimPhone }
        );
        console.log(`Calls to victim: ${callsResult.records.length} found`);
        callsResult.records.forEach(r => {
            console.log(`- From: ${r.get('caller')} (${r.get('callerPhone')}) at ${r.get('time')}`);
        });

        // 4. Check for suspects linked via callingSuspects property
        const linkedResult = await session.run(
            `MATCH (v:Victim {phone: $phone}) 
             RETURN v.callingSuspects as callingSuspects`,
            { phone: victimPhone }
        );
        if (linkedResult.records.length > 0) {
            console.log(`Victim callingSuspects column: ${linkedResult.records[0].get('callingSuspects')}`);
        }

    } catch (err) {
        console.error('Error during analysis:', err);
    } finally {
        await session.close();
        await driver.close();
    }
}

checkRelationships();
