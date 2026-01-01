# Cybercrime Intelligence System (CIS)
## Phase 1 MVP: Implementation Roadmap & Summary

---

## EXECUTIVE SUMMARY

CIS is a **government-grade AI-powered crime intelligence platform** that analyzes relationships between suspects using network science and machine learning. Phase 1 MVP focuses on real data integration with role-based access control.

### Key Innovation

**What Makes CIS Different:**
- Uses **real government data sources** (CCTNS, CDR, NCRP, e-Courts)
- **Automatic kingpin identification** via network centrality algorithms
- **AI-generated intelligence briefings** using Gemini API
- **Role-based access control** aligned with Indian police hierarchy
- **Production-ready security** with audit logging and encryption

---

## PHASE 1 MVP SCOPE

### What's Included

✅ **Data Integration**
- CCTNS FIR/Suspect data ingestion
- Telecom CDR (call records) processing
- NCRP Bank fraud complaint integration
- e-Courts case record linking

✅ **Analysis Engine**
- Network centrality analysis (degree, betweenness, eigenvector)
- Fraud ring detection (DBSCAN clustering)
- Risk scoring with sensitivity adjustment
- Money flow pattern analysis

✅ **User Interface**
- Network graph visualization (D3.js)
- Kingpin leaderboard
- Fraud ring explorer
- AI-generated briefings
- Data upload interface
- Export to PDF/JSON

✅ **Role-Based Access**
- 5 user roles (Admin, Supervisor, Officer, Analyst, Forensics)
- Granular permission matrix
- Audit logging of all actions
- Circle-based jurisdiction filtering

✅ **Security & Compliance**
- JWT authentication + MFA (TOTP)
- HTTPS/TLS encryption
- Neo4j encrypted storage
- GDPR-compliant data handling
- Police regulation adherence

### What's NOT Included

❌ Integration with live government APIs (requires official approval)
❌ Real-time CDR streaming
❌ Blockchain-based evidence chain
❌ Mobile app
❌ Multi-language support (English only)

---

## DOCUMENTATION PROVIDED

### 1. **CIS-Data-Integration.md** ✅
**For: Anyone involved with data**

- Real government data sources (CCTNS, CDR, NCRP, e-Courts)
- CSV formats and schemas
- Data acquisition methods (direct API, public portals, simulation)
- Validation & deduplication logic
- Privacy & compliance requirements
- Implementation timeline

**Key Section:** "Data Schema & Formats" - Exact structure for suspects, calls, transactions, cases

---

### 2. **CIS-RBAC-Authorization.md** ✅
**For: Backend developers, system architects, police IT**

- 5-role hierarchy with permissions matrix
- Role definitions with examples
- Authentication flow with MFA
- Authorization middleware implementation
- Audit logging system
- Compliance reporting

**Key Section:** "Permission Matrix" - What each role can do

---

### 3. **CIS-Production-Developer-Docs.md** ✅
**For: Backend, ML, Frontend developers**

#### Backend Developer Section
- Express.js setup with Neo4j
- User & role management
- Data validation pipeline
- API routes (investigations, upload, analysis)
- Service layer architecture
- CSV parsing implementation

#### ML Developer Section
- FastAPI setup
- Graph building from CSV data
- Centrality algorithms (degree, betweenness, eigenvector)
- DBSCAN fraud ring detection
- Risk scoring with sensitivity
- Complete Python code examples

#### Frontend Developer Section
- Next.js project setup
- API client implementation
- D3.js network visualization
- Component structure
- Role-based UI rendering
- TypeScript types

**Key Section:** "Core Application Structure" - Ready-to-use code snippets

---

## QUICK START GUIDE

### For Hackathon Participants (48-72 hours)

```bash
# 1. Clone repo
git clone <repo>
cd cis-mvp

# 2. Start all services
docker-compose up -d

# 3. Generate sample data
python scripts/generate_sample_data.py

# 4. Ingest data
curl -X POST http://localhost:5000/api/investigations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Case","caseId":"2025-FRD-001"}'

# 5. Upload data
curl -X POST http://localhost:5000/api/investigations/inv_123/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "suspectsCsv=@suspects.csv" \
  -F "callsCsv=@calls.csv" \
  -F "transactionsCsv=@transactions.csv"

# 6. Run analysis
curl -X POST http://localhost:5000/api/investigations/inv_123/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"performCentralityAnalysis":true,"detectFraudRings":true}'

# 7. View dashboard
open http://localhost:3000/investigations/inv_123/dashboard
```

### For Government Deployment (Production)

1. **Week 1: Setup**
   - Deploy Docker stack on secure servers
   - Configure SSL/TLS certificates
   - Setup Neo4j database with encryption
   - Create admin user with MFA

2. **Week 2-3: Request API Access**
   - Email NCRB for CCTNS API access
   - Email NCRP for fraud data access
   - File FIR for CDR access
   - Request e-Courts SFTP credentials

3. **Week 4: Integration**
   - Connect to real government APIs
   - Run validation tests
   - Configure data sync schedules
   - Setup audit logging

4. **Week 5: Training & Deployment**
   - Train police personnel on system
   - Deploy to production servers
   - Monitor performance metrics
   - Begin live investigations

---

## ROLE-SPECIFIC QUICK REFERENCE

### Backend Developer

**Your Deliverables:**
1. Authentication system (JWT + MFA)
2. User & role management
3. Data ingestion pipeline
4. API endpoints for all operations
5. Neo4j database schema
6. Audit logging

**Key Files:**
- `src/middleware/auth.js` - Authentication logic
- `src/services/investigationService.js` - Core business logic
- `src/routes/investigations.js` - API endpoints
- `src/models/User.js` - User schema

**Critical Deadlines:**
- Day 1: Authentication working
- Day 2: File upload & validation
- Day 3: Neo4j graph creation
- Day 4: ML integration
- Day 5: Export & reporting

---

### ML Developer

**Your Deliverables:**
1. Centrality analysis algorithm
2. Fraud ring detection
3. Risk scoring engine
4. Pattern analysis
5. FastAPI service
6. Integration with backend

**Key Files:**
- `src/algorithms/centrality.py` - Centrality calculations
- `src/algorithms/clustering.py` - DBSCAN implementation
- `src/algorithms/risk_scoring.py` - Risk assessment
- `src/main.py` - FastAPI app

**Critical Deadlines:**
- Day 1: Graph building working
- Day 2: Centrality algorithms
- Day 3: Ring detection
- Day 4: Risk scoring
- Day 5: Integration testing

---

### Frontend Developer

**Your Deliverables:**
1. Dashboard layout
2. Network visualization (D3.js)
3. Leaderboard table
4. File upload interface
5. Role-based UI access
6. Export functionality

**Key Files:**
- `components/NetworkGraph.tsx` - D3.js visualization
- `components/Leaderboard.tsx` - Suspect rankings
- `app/investigations/[id]/dashboard/page.tsx` - Main dashboard
- `lib/api.ts` - API client

**Critical Deadlines:**
- Day 1: Layout & navigation
- Day 2: File upload working
- Day 3: Network visualization
- Day 4: Leaderboard & tables
- Day 5: Briefing display

---

## DATA FILE FORMATS

### Quick Reference

**suspects.csv** (Required)
```
fir_id,suspect_id,name,phone,address,ipc_sections,arrest_date,status
FIR/2024/12/001,S1,Vikram Patel,9876543210,123 Main,420;506,2024-12-15,ARRESTED
```

**calls.csv** (Required)
```
caller_phone,receiver_phone,call_date,call_time,duration_seconds,circle,tower_id
9876543210,9876543211,2024-02-10,09:30:45,300,Jharkhand,TOWER_JH_001
```

**transactions.csv** (Required)
```
from_account,to_account,amount,date,complaint_id
IDBI_901234,HDFC_567890,75000,2024-02-10,NCRP/2024/12/001
```

**court_cases.csv** (Optional)
```
case_id,accused_name,court,ipc_sections,status,last_hearing
CASE/2024/001,Vikram Patel,District Court,420;506,PENDING,2024-12-10
```

---

## ARCHITECTURE DECISION RECORD (ADR)

### Why Neo4j for Graph Storage?

- ✅ Native graph queries (Cypher language)
- ✅ Excellent performance for relationship queries
- ✅ Built-in indexing and optimization
- ✅ Supports 100M+ nodes
- ✅ ACID transactions
- ❌ Not a document store (separate database needed for metadata)

### Why FastAPI for ML Service?

- ✅ Async support for long-running analysis
- ✅ Automatic API documentation (Swagger)
- ✅ Python ecosystem (networkx, scikit-learn)
- ✅ Type hints and validation
- ✅ Easy to scale horizontally
- ❌ Python slower than compiled languages (acceptable for Phase 1)

### Why Next.js for Frontend?

- ✅ Server-side rendering (better SEO for reports)
- ✅ API routes (backend in same codebase if needed)
- ✅ Excellent TypeScript support
- ✅ Vercel deployment (free tier available)
- ✅ Large ecosystem (D3.js, recharts integration)
- ❌ JavaScript security considerations (mitigated with proper HTTPS)

---

## COMMON PITFALLS & SOLUTIONS

| Problem | Solution |
|---------|----------|
| **Neo4j node IDs colliding** | Use UUID or namespaced IDs (e.g., "inv_123_S1") |
| **ML service timeout on large graphs** | Implement batch processing, async jobs |
| **CSV parsing failures** | Validate schema before ingestion, log errors |
| **Frontend D3.js performance** | Limit to 5000 nodes, use WebGL for larger graphs |
| **Authentication token expiry** | Implement refresh tokens, auto-refresh before expiry |
| **Audit log disk space** | Archive logs monthly, compress old data |
| **Memory leaks in Node.js** | Monitor with clinic.js, set max listeners |
| **Python package conflicts** | Use virtual environments, pin versions |

---

## TESTING STRATEGY

### Unit Tests

```bash
# Backend
npm test -- tests/unit/investigationService.test.js

# ML
pytest ml_backend/tests/unit/test_centrality.py

# Frontend
npm test -- tests/unit/NetworkGraph.test.tsx
```

### Integration Tests

```bash
# Full pipeline: upload → ingest → analyze
npm test -- tests/integration/full-flow.test.js

# API endpoints
npm test -- tests/integration/api.test.js

# Database operations
npm test -- tests/integration/neo4j.test.js
```

### Performance Tests

```bash
# Load test: 10K nodes, 50K edges
npm run test:load -- --nodes 10000 --edges 50000

# Expected: Analysis < 5 seconds
# Expected: Memory usage < 2GB
```

### Security Tests

```bash
# OWASP Top 10 check
npm run test:security

# Penetration testing
npm run test:pen -- --scope api

# Expected: 0 critical vulnerabilities
```

---

## MONITORING & OBSERVABILITY

### Key Metrics to Track

```javascript
// Backend
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query latency
- Authentication failures
- API rate limit violations
- File upload success rate

// ML Service
- Analysis execution time
- Memory usage
- CPU utilization
- Model inference latency
- Queue depth (if using jobs)

// Frontend
- Page load time
- Time to Interactive (TTI)
- JavaScript errors
- Network latency
- User engagement (clicks, time spent)
```

### Logging Setup

```javascript
// All services should log:
- Timestamp
- User ID
- Action (READ, CREATE, ANALYZE, EXPORT)
- Resource (investigation, suspect, case)
- Status (SUCCESS, FAILURE)
- Duration (in ms)
- IP address (for security)

// Example:
{
  "timestamp": "2024-12-20T15:30:45Z",
  "userId": "usr_123",
  "action": "ANALYZE",
  "resource": "investigation",
  "resourceId": "inv_abc123",
  "status": "SUCCESS",
  "duration": 4250,
  "ipAddress": "192.168.1.1"
}
```

---

## SUCCESS CRITERIA

### Phase 1 MVP Success

✅ **System loads 10,000 nodes in < 30 seconds**
✅ **Analysis completes in < 5 seconds**
✅ **Network visualization renders smoothly (60 FPS)**
✅ **Users can upload CSV files without errors**
✅ **Role-based access control working correctly**
✅ **Audit logs record all user actions**
✅ **AI briefings generated for all suspects**
✅ **Export to PDF works correctly**
✅ **Authentication with MFA working**
✅ **Zero unhandled exceptions in 8-hour test run**

### Hackathon Judging Criteria

| Criterion | Weight | Success |
|-----------|--------|---------|
| **Network Visualization** | 20% | Renders 100+ nodes smoothly |
| **Analysis Accuracy** | 25% | Kingpin correctly identified |
| **Data Integration** | 20% | All 4 data sources shown |
| **Role-Based Access** | 15% | At least 3 roles working |
| **AI Integration** | 10% | Briefings generated via Gemini |
| **Code Quality** | 10% | No critical bugs, good structure |

---

## GETTING HELP

### Documentation Quick Links

| Topic | File | Section |
|-------|------|---------|
| **Data sources** | CIS-Data-Integration.md | Government Data Sources |
| **Roles & permissions** | CIS-RBAC-Authorization.md | Role Definitions |
| **API endpoints** | CIS-Production-Developer-Docs.md | API Routes |
| **ML algorithms** | CIS-Production-Developer-Docs.md | ML Developer Guide |
| **Component structure** | CIS-Production-Developer-Docs.md | Frontend Developer Guide |
| **CSV formats** | CIS-Data-Integration.md | Data Schema |
| **Authentication flow** | CIS-RBAC-Authorization.md | Authentication Flow |

### Common Questions

**Q: Can I use test/simulated data for hackathon?**
A: Yes! Use the simulated data generation scripts. Real API access requires government approval (2-4 weeks).

**Q: What if ML service is slow?**
A: Implement job queues (Bull, Celery) and background processing.

**Q: How do I handle large CSV files?**
A: Stream processing instead of loading entire file into memory.

**Q: Can users share investigations across roles?**
A: Yes, via role-based access control. Officers can share with Supervisors.

**Q: How often should I backup data?**
A: Daily incremental + weekly full backups. Audit logs separately.

---

## FINAL CHECKLIST BEFORE SUBMISSION

### Backend
- [ ] All API endpoints implemented
- [ ] JWT authentication working
- [ ] MFA validation implemented
- [ ] Neo4j schema created
- [ ] CSV validation logic complete
- [ ] Error handling comprehensive
- [ ] Audit logging functional

### ML
- [ ] Centrality algorithms working
- [ ] Ring detection tested
- [ ] Risk scoring validated
- [ ] Integration with backend confirmed
- [ ] Performance targets met
- [ ] Unit tests passing

### Frontend
- [ ] Dashboard displays correctly
- [ ] Network visualization works
- [ ] File upload functional
- [ ] Data displays without errors
- [ ] Role-based UI correct
- [ ] Export working

### DevOps
- [ ] Docker compose file working
- [ ] All services start correctly
- [ ] Logs aggregated properly
- [ ] Database initialized
- [ ] SSL/TLS configured

### Security
- [ ] No hardcoded credentials
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Audit logs enabled

---

## WHAT'S NEXT AFTER PHASE 1?

### Phase 2 (Months 2-3)
- Real government API integration
- Mobile app (React Native)
- Advanced ML models (GNN, transformers)
- Real-time dashboards (WebSocket)
- Blockchain evidence chain

### Phase 3 (Months 4-6)
- State-level deployment
- Advanced analytics
- Predictive modeling
- Inter-agency collaboration
- Mobile field investigation app

### Phase 4+ (National Scale)
- All-India deployment
- Interpol integration
- International case collaboration
- AI-powered suspect identification
- Automated prosecution support

---

## CONTACT & SUPPORT

This project is developed for **RanchiHacks 2025** by the Cybercrime Intelligence team.

**Key Team Roles:**
- **Project Lead:** Coordinates across teams
- **Backend Lead:** Oversees API & database
- **ML Lead:** Manages analysis engine
- **Frontend Lead:** Owns UI/UX

**For questions during development:**
1. Check relevant documentation file
2. Search GitHub issues
3. Ask team in daily standup
4. Escalate to project lead

---

**Remember: This system will help Indian police solve cybercrime cases faster. Build it well. Build it secure. 🚀**

---

**Last Updated:** December 20, 2024
**Version:** 1.0.0
**Status:** Ready for Phase 1 MVP Implementation
