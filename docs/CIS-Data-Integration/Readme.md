# Cybercrime Intelligence System (CIS)
## Data Integration & Acquisition Guide
**Phase 1 MVP: Real Government Data Integration**

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Government Data Sources](#government-data-sources)
3. [Data Schema & Formats](#data-schema--formats)
4. [Data Acquisition Methods](#data-acquisition-methods)
5. [Data Validation & Ingestion](#data-validation--ingestion)
6. [Privacy & Compliance](#privacy--compliance)
7. [Training & Implementation](#training--implementation)

---

## OVERVIEW

CIS Phase 1 MVP uses **REAL government data** from four primary sources:

| Source | Type | Format | Update Frequency | Use Case |
|--------|------|--------|------------------|----------|
| **CCTNS** | FIRs, Suspects, Cases | CSV/API | Daily | Crime pattern analysis |
| **Telecom CDR** | Call records | CSV/API | Daily | Network relationship mapping |
| **NCRP** | Bank fraud complaints | CSV/API | Real-time | Financial transaction tracking |
| **e-Courts** | Court records | CSV/API | Daily | Case status & conviction history |

### Data Flow

```
Government Systems
    ↓
CSV/API Extraction
    ↓
CIS Ingest Pipeline
    ↓
Data Validation
    ↓
Neo4j Graph Database
    ↓
ML Analysis Pipeline
    ↓
Role-Based Dashboard
```

---

## GOVERNMENT DATA SOURCES

### 1. CCTNS (Crime & Criminal Tracking Network & Systems)

**Provider:** NCRB (National Crime Records Bureau)  
**Coverage:** All 28 crore crime records in India  
**Contains:** FIRs, Suspects, Arrests, Case Status

#### CSV Format

**File: suspects.csv**
```csv
fir_id,suspect_id,name,phone,address,ipc_sections,arrest_date,status
FIR/2024/12/001,S1,Vikram Patel,9876543210,123 Main St,420;506,2024-12-15,ARRESTED
FIR/2024/12/001,S2,Rajesh Kumar,9876543211,456 Oak Ave,420;511,,WANTED
FIR/2024/12/002,S3,Amit Singh,9876543212,789 Pine Rd,506,,INVESTIGATION
```

**File: fir_details.csv**
```csv
fir_id,date_filed,complainant,complaint_type,amount_involved,jurisdiction,status
FIR/2024/12/001,2024-12-10,Ramesh Singh,Cybercrime - Online Fraud,50000,East Singhbhum,INVESTIGATION
FIR/2024/12/002,2024-12-11,Priya Sharma,Bank Fraud,120000,East Singhbhum,REGISTERED
FIR/2024/12/003,2024-12-12,Amit Kumar,Cheating,200000,West Singhbhum,INVESTIGATION
```

#### Data Acquisition Methods

**Option A: Direct NCRB API Access (Real System)**
```bash
# Request access from NCRB
# Email: api-requests@ncrb.gov.in
# Requires: Police department authorization, MOU, security audit

# After approval, access via:
curl -H "Authorization: Bearer $NCRB_TOKEN" \
  "https://cctns-api.ncrb.gov.in/v1/suspects?state=JH&district=East%20Singhbhum&last_hours=24"
```

**Option B: Download Sample Data (For Hackathon)**
```bash
# Public datasets available at data.gov.in
curl -O "https://data.gov.in/resources/state_wise_crime_2024.csv"
```

**Option C: Export from Digital Police Portal**
```
1. Login to: https://digitalpolice.gov.in
2. Navigate: Dashboard → Export → CCTNS Search Results
3. Select: Date range, State, Crime type
4. Download: CSV export
```

---

### 2. Telecom CDR (Call Detail Records)

**Provider:** NCRB Central Hub (aggregated from Airtel, Jio, Vodafone, etc.)  
**Contains:** Caller, Receiver, Duration, Tower Location, Timestamp  
**Update Frequency:** Daily (previous day's data)

#### CSV Format

**File: calls.csv**
```csv
caller_phone,receiver_phone,call_date,call_time,duration_seconds,circle,tower_id
9876543210,9876543211,2024-02-10,09:30:45,300,Jharkhand,TOWER_JH_001
9876543210,9876543212,2024-02-10,14:20:30,120,Jharkhand,TOWER_JH_002
9876543211,9876543212,2024-02-11,08:00:15,450,Jharkhand,TOWER_JH_003
9876543210,9876543213,2024-02-11,10:45:00,180,Jharkhand,TOWER_JH_001
```

#### Data Acquisition Methods

**Option A: NCRB Central Hub (Real System)**
```bash
# Requires: FIR filed, SP approval, formal request to NCRB
# Process:
# 1. File FIR for cyber crime
# 2. Get SP authorization
# 3. Send formal request to NCRB with:
#    - FIR number
#    - Phone numbers to trace
#    - Date range
#    - Justification

# Response: SFTP download link (secure)
sftp ncrb@sftp.ncrb.gov.in:/data/cdr-2024-02-10.csv
```

**Option B: Simulate CDR (Hackathon)**
```python
# Python script to generate realistic CDR patterns
import csv
from datetime import datetime, timedelta
import random

suspects = {
    'S1': '9876543210',  # Kingpin (27 calls in 5 days)
    'S2': '9876543211',  # Coordinator (12 calls)
    'S3': '9876543212',  # Mule (8 calls)
    'S4': '9876543213',  # Mule (5 calls)
    'S5': '9876543214'   # Mule (2 calls)
}

with open('calls.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['caller_phone', 'receiver_phone', 'call_date', 'call_time', 
                     'duration_seconds', 'circle', 'tower_id'])
    
    base_date = datetime(2024, 2, 10)
    
    # S1 (kingpin) calls everyone frequently
    for i in range(27):
        day = base_date + timedelta(days=random.randint(0, 4))
        time = f"{random.randint(9, 20)}:{random.randint(0, 59):02d}:{random.randint(0, 59):02d}"
        receiver = random.choice([suspects['S2'], suspects['S3'], 
                                 suspects['S4'], suspects['S5']])
        duration = random.randint(60, 600)
        writer.writerow(['9876543210', receiver, day.date(), time, duration, 
                        'Jharkhand', 'TOWER_JH_001'])
```

---

### 3. NCRP (Bank Fraud Complaints)

**Provider:** Ministry of Home Affairs (i4c.mha.gov.in)  
**Contains:** Fraud complaints, account details, transaction amounts, recovery status  
**Update Frequency:** Real-time (as complaints filed)

#### CSV Format

**File: bank_fraud.csv**
```csv
complaint_id,date_filed,complainant_name,accused_account,bank_name,amount_defrauded,status,recovery_amount
NCRP/2024/12/001,2024-12-10,Ramesh Singh,IDBI_901234,IDBI Bank,50000,UNDER_INVESTIGATION,0
NCRP/2024/12/002,2024-12-11,Priya Sharma,HDFC_567890,HDFC Bank,120000,UNDER_INVESTIGATION,25000
NCRP/2024/12/003,2024-12-12,Amit Kumar,SBI_234567,SBI,200000,UNDER_INVESTIGATION,0
```

#### Data Acquisition Methods

**Option A: NCRP API (Real System)**
```bash
# Access: i4c.mha.gov.in
# Authentication: Police AADHAAR/credentials
# Endpoint: https://api.ncrp.gov.in/v1/fraud-complaints

curl -H "Authorization: Bearer $NCRP_TOKEN" \
  "https://api.ncrp.gov.in/v1/fraud-complaints?state=JH&status=UNDER_INVESTIGATION&days=7"

# Response:
# {
#   "complaints": [
#     {
#       "complaint_id": "NCRP/2024/12/001",
#       "complainant": "Ramesh Singh",
#       "amount": 50000,
#       "accused_account": "IDBI_901234",
#       "status": "UNDER_INVESTIGATION"
#     }
#   ]
# }
```

**Option B: Download from Public NCRP Portal**
```
1. Go to: https://i4c.mha.gov.in/
2. Login: Police credentials (SP level)
3. Navigate: Crime → Bank Fraud → Download Data
4. Select: Date range, State
5. Download: CSV export
```

**Option C: Simulate Data (Hackathon)**
```csv
complaint_id,date_filed,complainant_name,accused_account,bank_name,amount_defrauded,status
NCRP/2024/12/001,2024-12-10,Ramesh Singh,IDBI_901234,IDBI Bank,50000,UNDER_INVESTIGATION
NCRP/2024/12/002,2024-12-11,Priya Sharma,HDFC_567890,HDFC Bank,120000,UNDER_INVESTIGATION
NCRP/2024/12/003,2024-12-12,Amit Kumar,SBI_234567,SBI,200000,UNDER_INVESTIGATION
```

---

### 4. e-Courts (Court Records)

**Provider:** e-Courts.gov.in / ICJS  
**Contains:** Case status, charges (IPC sections), hearings, judgments  
**Update Frequency:** Daily

#### CSV Format

**File: court_cases.csv**
```csv
case_id,accused_name,court,ipc_sections,charges,status,last_hearing,next_hearing,judge_name
CASE/2024/001,Vikram Patel,District Court East Singhbhum,420;506,"Cheating, Criminal Intimidation",PENDING,2024-12-10,2024-12-24,Hon. Judge Sharma
CASE/2024/002,Rajesh Kumar,District Court East Singhbhum,420;511,"Cheating, Dishonestly Receiving",PENDING,2024-12-12,2024-12-28,Hon. Judge Verma
CASE/2023/456,Vikram Patel,High Court Jharkhand,506,"Criminal Intimidation",UNDER_APPEAL,2024-10-15,2024-01-15,Hon. Justice Gupta
```

#### Data Acquisition Methods

**Option A: CrimeCheck Public API (Hackathon-Friendly)**
```bash
# Public API: No authentication needed
# Covers all Indian courts

curl -X POST "https://crime.getupforchange.com/api/" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Jharkhand",
    "district": "East Singhbhum",
    "year": "2024"
  }'

# Response:
# {
#   "cases": [
#     {
#       "case_id": "CASE/2024/001",
#       "accused_name": "Vikram Patel",
#       "court": "District Court, East Singhbhum",
#       "charges": "420 IPC (Cheating), 506 IPC (Threats)",
#       "status": "Pending",
#       "last_hearing": "2024-12-10",
#       "next_hearing": "2024-12-24"
#     }
#   ]
# }
```

**Option B: e-Courts Official Portal**
```
1. Go to: https://ecourts.gov.in
2. Navigate: Case Information → Search
3. Search by: Case number, Accused name, Court
4. Export: Click "Generate Report"
5. Save as CSV
```

**Option C: Simulate Data**
```csv
case_id,accused_name,court,ipc_sections,status,last_hearing
CASE/2024/001,Vikram Patel,District Court,420,PENDING,2024-12-10
CASE/2024/002,Rajesh Kumar,District Court,420,PENDING,2024-12-12
```

---

## DATA SCHEMA & FORMATS

### Unified Data Model for CIS

#### Suspect/Node Schema

```json
{
  "suspect_id": "S1",
  "name": "Vikram Patel",
  "phone": "9876543210",
  "bank_account": "IDBI_901234",
  "fir_ids": ["FIR/2024/12/001"],
  "arrest_date": "2024-12-15",
  "status": "ARRESTED",
  "ipc_sections": [420, 506],
  "case_ids": ["CASE/2024/001", "CASE/2023/456"],
  "data_sources": ["CCTNS", "CDR", "NCRP", "e-Courts"],
  "created_at": "2024-12-15T10:00:00Z",
  "last_updated": "2024-12-20T15:30:00Z"
}
```

#### Call/Edge Schema

```json
{
  "call_id": "CALL_001",
  "caller": "9876543210",
  "receiver": "9876543211",
  "date": "2024-02-10",
  "time": "09:30:45",
  "duration_seconds": 300,
  "circle": "Jharkhand",
  "tower_id": "TOWER_JH_001",
  "frequency": 5,  // appears 5 times in dataset
  "data_source": "CDR",
  "created_at": "2024-02-10T09:30:45Z"
}
```

#### Transaction/Financial Edge Schema

```json
{
  "transaction_id": "TXN_001",
  "from_account": "IDBI_901234",
  "from_suspect": "S1",
  "to_account": "HDFC_567890",
  "to_suspect": "S2",
  "amount": 75000,
  "date": "2024-02-10",
  "time": "14:30:00",
  "complaint_id": "NCRP/2024/12/001",
  "status": "UNDER_INVESTIGATION",
  "data_source": "NCRP",
  "created_at": "2024-02-10T14:30:00Z"
}
```

#### Case/Reference Schema

```json
{
  "case_id": "CASE/2024/001",
  "fir_id": "FIR/2024/12/001",
  "accused": ["S1", "S2", "S3"],
  "court": "District Court, East Singhbhum",
  "ipc_sections": [420, 506, 511],
  "charges": "Cheating, Criminal Intimidation, Dishonestly Receiving Stolen Property",
  "status": "PENDING",
  "last_hearing": "2024-12-10",
  "next_hearing": "2024-12-24",
  "judge_name": "Hon. Judge Sharma",
  "data_source": "e-Courts",
  "created_at": "2024-12-01T08:00:00Z"
}
```

---

## DATA VALIDATION & INGESTION

### Validation Rules

#### Suspects Validation

```javascript
// Required fields
REQUIRED_FIELDS = ['suspect_id', 'name', 'phone']

// Phone number validation
PHONE_REGEX = /^[6-9]\d{9}$/  // 10-digit Indian mobile

// Email validation (if provided)
EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Account number validation
ACCOUNT_REGEX = /^[A-Z0-9_]{8,20}$/
```

#### Call Records Validation

```javascript
REQUIRED_FIELDS = ['caller_phone', 'receiver_phone', 'call_date', 'duration_seconds']

// Date format: YYYY-MM-DD
DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Time format: HH:MM:SS
TIME_REGEX = /^\d{2}:\d{2}:\d{2}$/

// Duration: positive integer
DURATION_MIN = 1
DURATION_MAX = 86400  // 24 hours

// Phone format validation
if (!PHONE_REGEX.test(caller_phone) || !PHONE_REGEX.test(receiver_phone)) {
  SKIP_RECORD("Invalid phone format")
}

if (caller_phone === receiver_phone) {
  SKIP_RECORD("Self-call")
}
```

#### Transaction Validation

```javascript
REQUIRED_FIELDS = ['from_account', 'to_account', 'amount', 'date']

// Amount validation
AMOUNT_MIN = 0
AMOUNT_MAX = 10000000  // ₹1 crore

// Date format
DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Account format
ACCOUNT_REGEX = /^[A-Z0-9_]{8,20}$/

// Check for impossible transfers
if (from_account === to_account) {
  SKIP_RECORD("Self-transfer")
}

// Validate amount is reasonable
if (amount < AMOUNT_MIN || amount > AMOUNT_MAX) {
  SKIP_RECORD("Invalid amount")
}
```

### Deduplication Strategy

```javascript
// For Call Records: Unique key = (caller, receiver, date, time)
// Keep: First occurrence
// Remove: Duplicate records within 5 minutes

// For Transactions: Unique key = (from_account, to_account, date, amount)
// Keep: First occurrence
// Remove: Exact duplicates

// For Suspects: Unique key = suspect_id
// Keep: Most recent update
// Remove: Older versions
```

### Ingestion Pipeline

```javascript
async function ingestData(investigationId, csvData) {
  // Step 1: Parse CSV
  const { suspects, calls, transactions } = await parseCSVFiles(csvData)
  
  // Step 2: Validate data
  const validationResults = {
    suspects: await validateSuspects(suspects),
    calls: await validateCalls(calls),
    transactions: await validateTransactions(transactions)
  }
  
  // Step 3: Deduplicate
  const deduplicated = {
    suspects: deduplicateSuspects(validationResults.suspects.valid),
    calls: deduplicateCalls(validationResults.calls.valid),
    transactions: deduplicateTransactions(validationResults.transactions.valid)
  }
  
  // Step 4: Normalize phone numbers & accounts
  const normalized = {
    suspects: normalizeSuspects(deduplicated.suspects),
    calls: normalizeCalls(deduplicated.calls),
    transactions: normalizeTransactions(deduplicated.transactions)
  }
  
  // Step 5: Create graph
  await createGraphFromData(investigationId, normalized)
  
  // Step 6: Validate graph integrity
  const stats = await validateGraphIntegrity(investigationId)
  
  return {
    status: 'success',
    investigationId,
    stats: {
      suspectNodes: deduplicated.suspects.length,
      callEdges: deduplicated.calls.length,
      transactionEdges: deduplicated.transactions.length,
      validationErrors: validationResults.errors.length,
      timestamp: new Date()
    }
  }
}
```

---

## PRIVACY & COMPLIANCE

### Data Handling Requirements

1. **GDPR/Privacy Compliance**
   - Minimize personal data collection
   - Store only phone numbers for suspects (not names of victims)
   - Mask sensitive information in logs
   - Auto-delete data after 90 days (configurable)

2. **Police Regulations**
   - Access logged and audited
   - Role-based access control (see RBAC section)
   - Encrypted storage (AES-256)
   - Secure transmission (HTTPS/TLS)

3. **Data Retention**
   - Active investigations: Keep indefinitely
   - Closed cases: Retain 7 years (statute of limitations)
   - Audit logs: Retain 2 years

### Audit Logging

```javascript
async function logAccess(userId, action, investigationId, dataType) {
  const auditLog = {
    timestamp: new Date(),
    userId,
    action,  // 'VIEW', 'ANALYZE', 'EXPORT', 'DELETE'
    investigationId,
    dataType,  // 'SUSPECTS', 'CALLS', 'TRANSACTIONS'
    ipAddress: req.ip,
    status: 'SUCCESS' | 'FAILED'
  }
  
  await auditLogStore.save(auditLog)
}
```

---

## TRAINING & IMPLEMENTATION

### Phase 1: Setup (Week 1)

**ML Developer:**
```bash
# Install dependencies
pip install networkx scikit-learn pandas numpy pydantic fastapi

# Create test data
python scripts/generate_sample_cis_data.py

# Train on 100 test cases
python ml_backend/train.py --dataset sample_cis_data --test-size 0.2
```

**Backend Developer:**
```bash
# Setup Neo4j
docker run --name neo4j-cis -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password neo4j:latest

# Connect and test
npm test -- tests/integration/graph-creation.test.js

# Ingest sample data
npm run ingest -- --file sample_data/suspects.csv --file sample_data/calls.csv
```

**Frontend Developer:**
```bash
# Install D3.js and visualization libs
npm install d3 recharts zustand

# Test with sample graph
npm run dev -- --sample-graph

# Verify visualization renders 1000+ nodes
```

### Phase 2: Real Data Integration (Week 2-3)

**Request Government Access:**
1. Email NCRB: api-requests@ncrb.gov.in
2. Email NCRP: contact@ncrp.gov.in
3. Provide:
   - Police department authorization letter
   - Technical specifications
   - Security audit report
   - Data handling plan
   - MOU (Memorandum of Understanding)

**Expected Timeline:**
- NCRB API access: 2-4 weeks
- NCRP API access: 1-2 weeks
- CDR data: 1-2 weeks (after FIR filed)

### Phase 3: Validation (Week 4)

```bash
# Validate ingestion with real data
npm run validate -- --source CCTNS --sample-size 1000
npm run validate -- --source CDR --sample-size 5000
npm run validate -- --source NCRP --sample-size 500
npm run validate -- --source e-Courts --sample-size 200

# Run performance tests
npm run test:performance -- --node-count 10000 --edge-count 50000

# Expected: Graph creation < 30 seconds for 10K nodes
```

---

## SUMMARY

| Aspect | Details |
|--------|---------|
| **Data Sources** | CCTNS, CDR, NCRP, e-Courts |
| **Update Frequency** | Daily to Real-time |
| **MVP Approach** | Use simulated data for hackathon, real data for deployment |
| **Validation** | Multi-stage: schema, uniqueness, integrity |
| **Privacy** | Encrypted, audited, GDPR-compliant |
| **Access** | Role-based with audit logging |

This document provides the complete blueprint for integrating real government data into CIS while allowing hackathon participants to use realistic simulated data for MVP development.
