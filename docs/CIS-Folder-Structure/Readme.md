## Project Folder Structure

### Monorepo Layout

```bash
cis/
├── backend/
├── ml-backend/
├── frontend/
├── docs/
├── scripts/
├── docker-compose.yml
└── README.md
```

- **backend/**: Node.js/Express API, orchestration, auth, RBAC, data pipeline.
- **ml-backend/**: Python/FastAPI ML analysis engine.
- **frontend/**: Next.js UI with role-based dashboards and visualizations.
- **docs/**: All markdown documentation.
- **scripts/**: Utilities (sample data, seeding, health checks).
- **docker-compose.yml**: Local/prod multi-service stack.
- **README.md**: High-level project overview and setup.

***

## Backend Structure (Node.js / Express)

```bash
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── ml-service.js
│   │   ├── gemini.js
│   │   └── env.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── Investigation.js
│   │   └── AuditLog.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── investigationController.js
│   │   ├── suspectsController.js
│   │   └── adminController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── csvService.js
│   │   ├── graphService.js
│   │   ├── mlService.js
│   │   ├── geminiService.js
│   │   └── analysisService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── fileUpload.js
│   │   ├── rateLimit.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── investigations.js
│   │   ├── suspects.js
│   │   ├── admin.js
│   │   └── export.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── errors.js
│   └── index.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── uploads/
├── package.json
└── .env.example
```

**config/**

- `database.js`: Creates and exports Neo4j driver connection (URI, user, password).
- `ml-service.js`: Axios client for Python ML service (`/analyze`, `/health`).
- `gemini.js`: Gemini API client configuration (model, key, timeout).
- `env.js`: Centralized environment variable loading and validation.

**models/**

- `User.js`: User schema (name, email, badgeNumber, roles, permissions, mfa, status).
- `Role.js`: Role schema (name, level, permissions, restrictions).
- `Investigation.js`: Metadata for investigations (id, caseId, status, timestamps, owner).
- `AuditLog.js`: Audit event structure (userId, action, resource, status, ip, metadata).

**controllers/**

- `authController.js`: Login, MFA verify, refresh token, logout.
- `investigationController.js`: Create/list investigations, upload, trigger analysis, get graph/leaderboard.
- `suspectsController.js`: Get suspect details, briefings, risk summaries.
- `adminController.js`: User/role management, audit log queries, system health for admins.

**services/**

- `authService.js`: JWT issue/verify, password hashing, MFA TOTP validation.
- `csvService.js`: Parse/validate suspects/calls/transactions CSV, deduplicate, normalize.
- `graphService.js`: Create/read/update Neo4j graph (nodes, edges, stats, indices).
- `mlService.js`: Build payload from Neo4j graph and call ML `/analyze`, handle retries.
- `geminiService.js`: Build prompts and call Gemini to generate suspect/investigation briefings.
- `analysisService.js`: Orchestrate ingest → ML → briefings → persist results.

**middleware/**

- `auth.js`: Extract and verify JWT, attach `req.user`.
- `rbac.js`: Check role/permission for protected routes (e.g., `requirePermission('analysis:run')`).
- `fileUpload.js`: Multer config, size limits, allowed MIME types for CSV.
- `rateLimit.js`: Basic per-IP/per-user rate limiting.
- `errorHandler.js`: Centralized error → HTTP response mapping and logging.

**routes/**

- `auth.js`: `/api/auth/login`, `/api/auth/mfa/verify`, `/api/auth/refresh`.
- `investigations.js`: `/api/investigations/create`, `/:id/upload`, `/:id/analyze`, `/:id/graph`, `/:id/leaderboard`, `/:id/rings`.
- `suspects.js`: `/:investigationId/suspects/:suspectId`, `/:suspectId/brief`.
- `admin.js`: `/api/admin/users`, `/api/admin/roles`, `/api/admin/audit-logs`, `/api/admin/system/health`.
- `export.js`: `/api/investigations/:id/export` (PDF/JSON).

**utils/**

- `logger.js`: Winston/Pino logger instance with request/response logging.
- `validators.js`: Reusable Joi/Zod style validators for payloads and query params.
- `errors.js`: Custom error classes (ValidationError, AuthError, ForbiddenError, etc.).

**root**

- `index.js`: Express app bootstrap (middleware, routes, error handler).
- `tests/`: Jest/supertest specs for units and integration.
- `uploads/`: Temp CSV storage (should be volume-mounted and periodically cleaned).
- `.env.example`: Template environment config for new environments.

***

## ML Backend Structure (Python / FastAPI)

```bash
ml-backend/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── centrality.py
│   │   ├── clustering.py
│   │   ├── patterns.py
│   │   └── risk_scoring.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── request.py
│   │   └── response.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── graph_builder.py
│   │   ├── logger.py
│   │   └── config.py
│   └── main.py
├── tests/
│   ├── unit/
│   └── fixtures/
├── requirements.txt
└── .env.example
```

**api/**

- `routes.py`: Defines `/analyze` and `/health` endpoints, orchestrates algorithms and builds response.

**algorithms/**

- `centrality.py`: `CentralityAnalyzer` with degree, betweenness, eigenvector, composite score, role classification.
- `clustering.py`: `FraudRingDetector` using DBSCAN, feature extraction, ring grouping and severity.
- `patterns.py`: Money flow and temporal pattern analysis (sources/sinks/intermediaries, timelines).
- `risk_scoring.py`: `RiskScorer` combining centrality, connectivity, activity, money flow into riskScore/riskLevel.

**models/**

- `request.py`: Pydantic models for `NodeInput`, `EdgeInput`, `AnalysisRequest`.
- `response.py`: Pydantic models for `CentralityResult`, `RiskResult`, `FraudRing`, `AnalysisResponse`.

**utils/**

- `graph_builder.py`: Build `networkx.DiGraph` from node/edge payloads with attributes.
- `logger.py`: Structured logging for ML service (requests, timings, exceptions).
- `config.py`: Read env (port, log level, max nodes/edges, timeouts).

**root**

- `main.py`: FastAPI app creation, route include, startup/shutdown hooks.
- `tests/`: Pytest unit tests for each algorithm and API integration.
- `requirements.txt`: Locked dependencies for reproducible environments.

***

## Frontend Structure (Next.js / React)

```bash
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── mfa/page.tsx
│   ├── investigations/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── rings/page.tsx
│   │   │   ├── briefings/page.tsx
│   │   │   └── upload/page.tsx
│   └── api/ (optional)
├── components/
│   ├── NetworkGraph.tsx
│   ├── Leaderboard.tsx
│   ├── FraudRings.tsx
│   ├── BriefingPanel.tsx
│   ├── FileUpload.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── RoleGuard.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── types.ts
│   └── utils.ts
├── store/
│   ├── useAuthStore.ts
│   ├── useInvestigationsStore.ts
│   └── useAnalysisStore.ts
├── styles/
│   └── globals.css
├── public/
│   └── sample-files/
├── package.json
└── .env.local.example
```

**app/**

- `layout.tsx`: Root layout, wraps app with header/sidebar, theme, global providers.
- `page.tsx`: Landing/dashboard, recent investigations, quick stats.
- `auth/login/page.tsx`: Username/password login, token storage.
- `auth/mfa/page.tsx`: MFA TOTP verification step.
- `investigations/page.tsx`: List of investigations (filter, search, status).
- `investigations/[id]/layout.tsx`: Shared layout for per-investigation sub-pages (tabs, summary).
- `investigations/[id]/dashboard/page.tsx`: Main network view + key metrics card.
- `investigations/[id]/leaderboard/page.tsx`: Kingpin/centrality leaderboard.
- `investigations/[id]/rings/page.tsx`: Fraud rings table/list and details.
- `investigations/[id]/briefings/page.tsx`: Investigation-level AI summary, suspect brief access.
- `investigations/[id]/upload/page.tsx`: CSV upload wizard for FIR/CDR/transactions.

**components/**

- `NetworkGraph.tsx`: D3 force-directed graph of suspects and relationships.
- `Leaderboard.tsx`: Table of suspects sorted by centrality/risk.
- `FraudRings.tsx`: Card/list view of clusters, members, severity, amounts.
- `BriefingPanel.tsx`: Modal drawer for AI briefing of a specific suspect.
- `FileUpload.tsx`: Multi-file (suspects/calls/transactions) upload with progress and validation messages.

**components/common/**

- `Header.tsx`: Top nav with user info, role, logout.
- `Sidebar.tsx`: Navigation menu (dashboard, investigations, admin if role allows).
- `RoleGuard.tsx`: HOC/component to conditionally render children based on roles/permissions.
- `LoadingSpinner.tsx`: Reusable loading indicator.

**lib/**

- `api.ts`: All REST calls to backend (createInvestigation, uploadData, getGraph, getLeaderboard, getBriefing, export, etc.).
- `auth.ts`: Token helpers (get/set/clear), role parsing, client-side guards.
- `types.ts`: Shared TypeScript interfaces for nodes, edges, rings, briefings, investigations.
- `utils.ts`: Helpers (formatCurrency, formatDate, riskColor mapping, error handling).

**store/**

- `useAuthStore.ts`: Auth state (token, user, role), login/logout actions.
- `useInvestigationsStore.ts`: List, selected investigation, filters.
- `useAnalysisStore.ts`: Graph data, leaderboard, rings, briefings cache.

***

## Docs \& Scripts

```bash
docs/
├── CIS-Data-Integration.md
├── CIS-RBAC-Authorization.md
├── CIS-Production-Developer-Docs.md
├── CIS-MVP-Roadmap.md
├── CIS-Documentation-Index.md
└── CIS-Docs-Summary.md

scripts/
├── generate_sample_data.py
├── seed_users.ts
└── health_check.sh
```

- **`generate_sample_data.py`**: Creates realistic FIR/CDR/bank/court CSVs for local/dev.
- **`seed_users.ts`**: Seeds Admin/Supervisor/Officer/Analyst/Forensics accounts with roles and permissions.
- **`health_check.sh`**: Simple script to hit `/health` endpoints of backend and ML service.




