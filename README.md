# 🕵️‍♂️ Cybercrime Intelligence System (CIS)

A production-grade intelligence platform designed for law enforcement to visualize, track, and manage complex cybercrime networks. CIS leverages graph databases and real-time geolocation data to turn fragmented information into actionable intelligence.

---

## 🚀 Core Features

### 1. 🌐 Network Visualization
*   **Interactive Graph Mapping**: Visualize relationships between suspects, victims, and entities using high-performance D3.js visualizations.
*   **Neo4j Integration**: Powered by a robust graph backend to detect hidden patterns and "ring" structures in criminal organizations.
*   **Entity Linking**: Automatically correlate multi-source data (CDR, FIR, Bank Fraud) into a unified network view.

### 2. 📍 Geolocation & Suspect Tracking
*   **CDR Trajectory Analysis**: Trace the movement of suspects based on Call Detail Records (CDR) and cell tower handovers.
*   **Cell Tower Triangulation**: Pinpoint suspect locations with high accuracy using signal strength and tower proximity data.
*   **Real-time Tracking**: Interactive map views to monitor suspect trajectories over specific time windows.

### 3. 📂 Production Case Management
*   **End-to-End Lifecycle**: Manage cases from initial report (FIR) to final investigation status.
*   **Evidence Centralization**: Attach documents, CDR records, and bank statements directly to specific case files.
*   **Case Timeline**: Automated timeline generation showing the progression of investigations.

### 4. 🔍 Pattern Analysis & Linkage
*   **Harassment Detection**: Automatically identifies predatory calling patterns, harassment clusters, and high-frequency communication between suspects and victims.
*   **Communication Linkage**: Analyzes the frequency and geolocation of calls to uncover stable relationships and hidden coordination between entities.
*   **Geospatial Intelligence**: Correlates call records with cell tower data to visualize where specific communication patterns originate.

### 5. 👮 Officer & Team Management
*   **Admin Dashboard**: Centralized control for administrators to manage investigator profiles and system access.
*   **Case Assignment**: Dynamically assign cases to specific officers or forensic analysts.
*   **Audit Logging**: Detailed tracking of all officer actions within the system for compliance and transparency.

---

## 🛠 Technical Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) | Modern, responsive UI with Tailwind CSS & Shadcn/UI |
| **Backend** | [NestJS](https://nestjs.com/) | Scalable, modular Node.js framework for robust APIs |
| **Graph DB** | [Neo4j](https://neo4j.com/) | Native graph database for complex relationship analysis |
| **Relation DB** | [Supabase/Postgres](https://supabase.com/) | Storage for structured case data, profiles, and auth |
| **Vis Engine** | [D3.js](https://d3js.org/) | High-performance interactive network visualizations |

---

## 🏗 System Architecture

```text
+-----------------------------------------------------------+
|                      Frontend Layer                       |
|           [ Next.js Dashboard (React/Tailwind) ]          |
+----------------------------+------------------------------+
                             |
                             | REST API / JWT
                             v
+-----------------------------------------------------------+
|                      Service Layer                        |
|                 [ NestJS Backend API Core ]               |
+--------------+-----------------------------+--------------+
               |                             |
               | Cypher Query                | Prisma / SQL
               v                             v
+----------------------------+  +---------------------------+
|        Data Layer          |  |        Data Layer         |
| [ Neo4j Graph DB ]         |  | [ Supabase / Postgres ]   |
| (Relationships/Kingpins)   |  | (Case Meta/Profiles/Auth) |
+----------------------------+  +---------------------------+
```

## 🔄 Data Flow Architecture

```text
Investigator        Frontend (Next.js)      Backend (NestJS)      Storage (Neo4j/Supabase)
     |                     |                      |                       |
     |-- Upload Records -->|                      |                       |
     | (CDR/FIR/NCRP)      |--- POST /upload ---->|                       |
     |                     |                      |-- Validate/Parse ---->|
     |                     |                      |                       |
     |                     |                      |-- Map Relationships ->| [Neo4j]
     |                     |                      |                       |
     |                     |                      |--- Save Case Meta --->| [Supabase]
     |                     |                      |                       |
     |-- View Intelligence ->|                      |                       |
     |                     |---- GET /intel/ ---->|                       |
     |                     |                      |-- Graph Traversal --->| [Neo4j]
     |                     |                      |<--- Data Result ------|
     |                     |<-- Optimized JSON ---|                       |
     |<-- D3.js Viz -------|                      |                       |
     |                     |                      |                       |
```

1.  **Ingestion**: Structured and unstructured data (CDR, NCRP, FIR) is uploaded via an encrypted pipeline.
2.  **Processing**: The NestJS backend validates and parses data, flagging inconsistencies.
3.  **Storage**: 
    *   **Neo4j** stores nodes (Suspects, Phones) and edges (Calls, Transactions).
    *   **Supabase** stores case metadata, officer assignments, and audit logs.
4.  **Analysis**: The system runs graph algorithms to identify "Kingpins" and calculates trajectories for movement analysis.
5.  **Visualization**: The Next.js frontend renders interactive graphs and maps for the investigator.

---

## 🔐 Role-Based Access Control (RBAC)

*   **Super Admin**: Full system control, officer management, and global audit access.
*   **Supervisor**: Case approval, team performance monitoring, and advanced report generation.
*   **Investigator/Officer**: Day-to-day case management, suspect tracking, and evidence collection.
*   **Forensic Analyst**: Specialized data analysis and technical report generation.

---

## 📈 Real-World Impact

*   **Accelerated Investigation**: Reduces time to identify criminal rings from weeks to minutes.
*   **Data Silo Elimination**: Merges telecom, banking, and police records into one pane of glass.
*   **Enhanced Conviction Rates**: Provides mathematically backed relationship proof that stands up in court.
*   **Proactive Prevention**: Identifies emerging fraud clusters before they scale.

---

## 🛣 Future Scope & Scalability

*   **AI Briefings**: Automated investigation summaries using LLMs (Gemini integration).
*   **Cross-Jurisdiction Sync**: Secure data sharing between state and national intelligence hubs.
*   **Predictive Policing**: Machine learning models to predict future hotspots based on historical data.
*   **Distributed Architecture**: Ready for horizontal scaling via Docker and Kubernetes for high-load state-level deployments.

---

*Developed by the Team Solution Squad - Empowering Law Enforcement with Advanced Intelligence.*
