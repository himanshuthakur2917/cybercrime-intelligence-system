# Neo4j Setup Instructions

## Option 1: Install Neo4j Desktop (Easiest for Windows)

1. **Download Neo4j Desktop**:
   - Visit: https://neo4j.com/download/
   - Download Neo4j Desktop for Windows
   - Install and launch the application

2. **Create a Database**:
   - Click "New Project" or "Add Project"
   - Click "Add" → "Local DBMS"
   - Name: "CIS-Investigation"
   - Password: "neo4j" (or your preferred password)
   - Version: Select latest (5.x)
   - Click "Create"

3. **Start the Database**:
   - Click the "Start" button on your database
   - Wait for it to show "Active"
   - The default connection will be: `bolt://localhost:7687`

4. **Update .env.local** (if different password):
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password_here
   ```

5. **Restart your Next.js server**:
   - Stop the dev server (Ctrl+C)
   - Run: `npm run dev`
   - Visit: http://localhost:3000/graphs

## Option 2: Use Neo4j Aura (Cloud - Free Tier)

1. **Create Free Account**:
   - Visit: https://neo4j.com/cloud/aura/
   - Sign up for free tier
   - Create a new instance

2. **Get Connection Details**:
   - Copy the Connection URI (looks like: `neo4j+s://xxxxx.databases.neo4j.io`)
   - Copy the username (usually `neo4j`)
   - Copy/save the generated password

3. **Update .env.local**:
   ```
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_generated_password
   ```

4. **Restart your Next.js server**:
   - Stop the dev server (Ctrl+C)
   - Run: `npm run dev`
   - Visit: http://localhost:3000/graphs

## Option 3: Docker (For Advanced Users)

```bash
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/neo4j \
  neo4j:latest
```

Then update .env.local with:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j
```

## Testing the Connection

1. Visit: http://localhost:3000/graphs
2. Click "Seed Database" button
3. Click "Fetch All Graphs" button
4. You should see data appear for S1, S2, S3, S4 graphs

## Troubleshooting

- **Connection Error**: Make sure Neo4j is running
- **Authentication Error**: Check your password in .env.local
- **Port Conflict**: Ensure port 7687 is not used by another application
- **After changing .env.local**: Always restart the Next.js dev server

## Current Configuration

Your .env.local is configured for:
- Local Neo4j instance
- Default connection: bolt://localhost:7687
- Username: neo4j
- Password: neo4j (change this after first login)
