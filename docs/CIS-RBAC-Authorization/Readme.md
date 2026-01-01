# Cybercrime Intelligence System (CIS)
## Role-Based Access Control & Authorization Guide

---

## TABLE OF CONTENTS

1. [Role Hierarchy](#role-hierarchy)
2. [Permission Matrix](#permission-matrix)
3. [Role Definitions](#role-definitions)
4. [Implementation Guide](#implementation-guide)
5. [Authentication & Authorization Flow](#authentication--authorization-flow)
6. [Audit & Compliance](#audit--compliance)

---

## ROLE HIERARCHY

```
┌─────────────────────────────────────────┐
│  ADMIN (Super User - NCRB/Police HQ)   │
│  - Full system access                  │
│  - User management                     │
│  - System configuration                │
└──────────────────┬──────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
┌─────▼──────────────┐   ┌──────▼──────────────┐
│ SUPERVISOR         │   │ OFFICER            │
│ (Circle CP/ACP)    │   │ (Investigation)    │
│ - Approve cases    │   │ - Create cases     │
│ - Oversee cases    │   │ - Upload data      │
│ - Export reports   │   │ - View analysis    │
└─────┬──────────────┘   └──────┬──────────────┘
      │                         │
      │     ┌───────────────────┘
      │     │
┌─────▼─────▼──────────┐
│ ANALYST              │
│ (Data Specialist)    │
│ - Run analysis       │
│ - View networks      │
│ - Generate reports   │
└─────┬────────────────┘
      │
┌─────▼──────────────────┐
│ FORENSICS             │
│ (Technical Expert)    │
│ - Extract patterns    │
│ - Technical analysis  │
│ - Data reconstruction │
└──────────────────────┘
```

---

## ROLE DEFINITIONS

### 1. ADMIN

**Typical User:** NCRB Officer / Police Headquarters Personnel

**Responsibilities:**
- System administration and configuration
- User account creation and revocation
- Access control management
- System health monitoring
- Database management

**Access Level:** `LEVEL_5` (Maximum)

**Permissions:**

| Resource | Create | Read | Update | Delete | Export |
|----------|--------|------|--------|--------|--------|
| Investigations | ✓ | ✓ | ✓ | ✓ | ✓ |
| Users | ✓ | ✓ | ✓ | ✓ | ✓ |
| Roles | ✓ | ✓ | ✓ | ✓ | ✓ |
| System Config | - | ✓ | ✓ | - | - |
| All Data | ✓ | ✓ | ✓ | ✓ | ✓ |
| Audit Logs | - | ✓ | - | - | ✓ |

**Example API Access:**

```javascript
// ADMIN can do anything
GET /api/admin/users
GET /api/admin/investigations
GET /api/admin/system/health
POST /api/admin/users
DELETE /api/admin/users/:id
GET /api/admin/audit-logs
```

---

### 2. SUPERVISOR

**Typical User:** Circle CP, ACP, or Senior Police Officer

**Responsibilities:**
- Oversee multiple investigations
- Approve investigation requests from officers
- Review and validate analysis results
- Generate command-level reports
- Monitor case progress

**Access Level:** `LEVEL_4` (High)

**Permissions:**

| Resource | Create | Read | Update | Delete | Export |
|----------|--------|------|--------|--------|--------|
| Investigations | ✓ (own) | ✓ (all in circle) | ✓ | ✗ | ✓ |
| Analysis Results | ✗ | ✓ | ✗ | ✗ | ✓ |
| Officer Cases | ✗ | ✓ (assigned) | ✓ (approve) | ✗ | ✓ |
| Reports | ✓ | ✓ | ✓ | ✗ | ✓ |
| Briefings | ✗ | ✓ | ✗ | ✗ | ✓ |

**Example API Access:**

```javascript
// SUPERVISOR can oversee cases
GET /api/investigations?circle=East_Singhbhum
GET /api/investigations/:id
PUT /api/investigations/:id/approve
GET /api/investigations/:id/analysis
POST /api/investigations/:id/export
GET /api/investigations/:id/briefing/:suspectId
```

---

### 3. OFFICER

**Typical User:** Police Officer, Sub-Inspector, Investigation Officer

**Responsibilities:**
- Create and manage investigations
- Upload evidence and data
- Run analysis on cases
- View investigation progress
- Generate preliminary reports

**Access Level:** `LEVEL_3` (Medium)

**Permissions:**

| Resource | Create | Read | Update | Delete | Export |
|----------|--------|------|--------|--------|--------|
| Own Investigations | ✓ | ✓ | ✓ | ✗ | ✓ |
| Assigned Cases | ✗ | ✓ | ✓ (data only) | ✗ | ✓ |
| Data Upload | ✓ | ✓ | ✓ | ✓ | ✗ |
| Analysis Results | ✗ | ✓ | ✗ | ✗ | ✓ |
| Briefings | ✗ | ✓ | ✗ | ✗ | ✓ |

**Example API Access:**

```javascript
// OFFICER can create and manage own investigations
POST /api/investigations/create
GET /api/investigations/:id
POST /api/investigations/:id/upload
GET /api/investigations/:id/analysis
GET /api/investigations/:id/graph
GET /api/investigations/:id/leaderboard
POST /api/investigations/:id/analyze
GET /api/investigations/:id/briefing/:suspectId

// OFFICER cannot delete or export audit logs
DELETE /api/investigations/:id  // ✗ FORBIDDEN
GET /api/audit-logs  // ✗ FORBIDDEN
```

---

### 4. ANALYST

**Typical User:** Data Scientist, Criminal Analyst, Intelligence Specialist

**Responsibilities:**
- Analyze investigation networks
- Identify patterns and relationships
- Generate insights and reports
- Support officer investigations
- Create presentation materials

**Access Level:** `LEVEL_2` (Low-Medium)

**Permissions:**

| Resource | Create | Read | Update | Delete | Export |
|----------|--------|------|--------|--------|--------|
| Investigations | ✗ | ✓ (assigned) | ✗ | ✗ | ✓ |
| Analysis Results | ✗ | ✓ | ✗ | ✗ | ✓ |
| Networks/Graphs | ✗ | ✓ | ✗ | ✗ | ✓ |
| Reports | ✓ | ✓ | ✓ (own) | ✗ | ✓ |
| Briefings | ✗ | ✓ | ✗ | ✗ | ✓ |

**Example API Access:**

```javascript
// ANALYST can view and analyze
GET /api/investigations/:id
GET /api/investigations/:id/analysis
GET /api/investigations/:id/graph
GET /api/investigations/:id/leaderboard
GET /api/investigations/:id/rings
POST /api/investigations/:id/export

// ANALYST cannot upload data or approve
POST /api/investigations/:id/upload  // ✗ FORBIDDEN
PUT /api/investigations/:id/approve  // ✗ FORBIDDEN
```

---

### 5. FORENSICS

**Typical User:** Cyber-Forensics Expert, Technical Investigator

**Responsibilities:**
- Perform deep technical analysis
- Extract digital evidence
- Reconstruct communication patterns
- Analyze transaction flows
- Provide expert testimony support

**Access Level:** `LEVEL_1` (Low, Specialized)

**Permissions:**

| Resource | Create | Read | Update | Delete | Export |
|----------|--------|------|--------|--------|--------|
| Raw Data | ✗ | ✓ (assigned) | ✗ | ✗ | ✓ |
| Analysis Results | ✗ | ✓ | ✗ | ✗ | ✓ |
| Network Patterns | ✗ | ✓ | ✗ | ✗ | ✓ |
| Technical Reports | ✓ | ✓ | ✓ (own) | ✗ | ✓ |
| CDR Analysis | ✗ | ✓ | ✗ | ✗ | ✓ |

**Example API Access:**

```javascript
// FORENSICS can perform deep analysis
GET /api/investigations/:id/graph
GET /api/investigations/:id/cdr-analysis
GET /api/investigations/:id/transaction-analysis
POST /api/investigations/:id/export

// FORENSICS cannot manage investigations
POST /api/investigations/create  // ✗ FORBIDDEN
GET /api/investigations  // ✗ FORBIDDEN (must specify :id)
```

---

## PERMISSION MATRIX

### Detailed Access Matrix

| Action | Admin | Supervisor | Officer | Analyst | Forensics |
|--------|-------|-----------|---------|---------|-----------|
| **Investigation Management** |
| Create Investigation | ✓ | ✓ | ✓ | ✗ | ✗ |
| View All Investigations | ✓ | ✓ (circle) | ✓ (own) | ✓ (assigned) | ✓ (assigned) |
| Edit Investigation | ✓ | ✓ | ✓ (own) | ✗ | ✗ |
| Delete Investigation | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approve Investigation | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Data Management** |
| Upload Data | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Raw Data | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Data | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delete Data | ✓ | ✗ | ✓ (own) | ✗ | ✗ |
| **Analysis** |
| Run Analysis | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Results | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Analysis Settings | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Reports & Export** |
| Generate Reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export Data (CSV) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export PDF | ✓ | ✓ | ✓ | ✓ | ✓ |
| **System** |
| User Management | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Audit Logs | ✓ | ✓ | ✗ | ✗ | ✗ |
| System Configuration | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## IMPLEMENTATION GUIDE

### Backend: User & Role Setup

#### User Schema (MongoDB/PostgreSQL)

```javascript
// User model
{
  _id: ObjectId,
  name: "Officer Kumar",
  email: "kumar@police.gov.in",
  phone: "9876543210",
  badgeNumber: "JH-2024-001",
  department: "East Singhbhum Police",
  circle: "East Singhbhum",  // jurisdiction
  roles: ["OFFICER"],  // array of roles
  permissions: [],  // auto-populated from role
  status: "ACTIVE",  // ACTIVE, INACTIVE, SUSPENDED
  createdAt: "2024-01-01T00:00:00Z",
  lastLogin: "2024-12-20T10:30:00Z",
  passwordHash: "bcrypt_hash",
  mfaEnabled: true,
  mfaSecret: "base32_encoded_secret"
}
```

#### Role Schema

```javascript
{
  _id: ObjectId,
  name: "OFFICER",
  displayName: "Police Officer",
  level: 3,
  description: "Investigation Officer with case management access",
  permissions: [
    "investigation:create",
    "investigation:read_own",
    "investigation:update_own",
    "data:upload",
    "data:read",
    "analysis:run",
    "analysis:read",
    "report:generate",
    "export:csv",
    "export:pdf"
  ],
  restrictions: [
    "investigation:delete",
    "investigation:approve",
    "user:manage",
    "audit:read"
  ],
  createdAt: "2023-01-01T00:00:00Z"
}
```

#### Creating Users with Roles

```javascript
// Backend: Create user with role
async function createUserWithRole(userData, roleId) {
  // 1. Validate role exists
  const role = await Role.findById(roleId)
  if (!role) throw new Error('Role not found')
  
  // 2. Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10)
  
  // 3. Create user
  const user = new User({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    badgeNumber: userData.badgeNumber,
    department: userData.department,
    circle: userData.circle,
    roles: [roleId],
    permissions: role.permissions,  // inherit from role
    passwordHash,
    status: 'ACTIVE',
    mfaEnabled: true
  })
  
  await user.save()
  
  // 4. Generate MFA secret
  const mfaSecret = speakeasy.generateSecret({
    name: `CIS (${userData.name})`,
    issuer: 'CIS'
  })
  
  user.mfaSecret = mfaSecret.base32
  await user.save()
  
  return {
    userId: user._id,
    name: user.name,
    role: role.displayName,
    mfaQrCode: mfaSecret.otpauth_url
  }
}
```

### Middleware: Permission Checking

#### Express Middleware

```javascript
// Verify token and extract user
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User not found or inactive' })
    }
    
    req.user = {
      id: user._id,
      name: user.name,
      roles: user.roles,
      permissions: user.permissions,
      circle: user.circle,
      level: user.level
    }
    
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Check specific permission
function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    if (!req.user.permissions.includes(permissionName)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permissionName,
        user: req.user.name
      })
    }
    
    next()
  }
}

// Check role
function requireRole(roleNames) {
  return (req, res, next) => {
    const userRoles = req.user.roles.map(r => r.name)
    const hasRole = roleNames.some(role => userRoles.includes(role))
    
    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient role',
        required: roleNames,
        user: req.user.name
      })
    }
    
    next()
  }
}
```

### Route Protection Examples

```javascript
// Routes with middleware
router.post('/investigations/create',
  authMiddleware,
  requirePermission('investigation:create'),
  investigationController.create
)

router.get('/investigations/:id',
  authMiddleware,
  requirePermission('investigation:read'),
  async (req, res, next) => {
    // Additional check: user can only view investigations assigned to them
    const investigation = await Investigation.findById(req.params.id)
    
    if (investigation.assignedOfficer !== req.user.id && 
        !['ADMIN', 'SUPERVISOR'].includes(req.user.roles)) {
      return res.status(403).json({ error: 'Cannot access this investigation' })
    }
    
    next()
  },
  investigationController.getById
)

router.delete('/investigations/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  investigationController.delete
)

router.post('/investigations/:id/upload',
  authMiddleware,
  requirePermission('data:upload'),
  investigationController.upload
)

router.post('/investigations/:id/analyze',
  authMiddleware,
  requirePermission('analysis:run'),
  investigationController.analyze
)

router.get('/audit-logs',
  authMiddleware,
  requirePermission('audit:read'),
  auditController.getLogs
)
```

---

## AUTHENTICATION & AUTHORIZATION FLOW

### Login Flow

```
┌─────────────────┐
│  User Login     │
│ Email + Password│
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Verify credentials       │
│ Hash password match?     │
└────────┬──────┬──────────┘
         │      │
      ✓  │      │  ✗
         │      ▼
         │  ┌─────────────────┐
         │  │ Return 401      │
         │  │ Invalid creds   │
         │  └─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Generate MFA challenge   │
│ Send TOTP to authenticator│
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ User enters MFA code     │
│ Validate TOTP (30 sec)   │
└────────┬──────┬──────────┘
         │      │
      ✓  │      │  ✗
         │      ▼
         │  ┌─────────────────┐
         │  │ Return 401      │
         │  │ Invalid MFA     │
         │  └─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Load user permissions    │
│ Load user roles          │
│ Generate JWT token       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Return JWT token         │
│ + User info              │
│ + Roles & Permissions    │
└──────────────────────────┘
```

### Authorization Check Flow

```
Request: GET /api/investigations/:id
│
├─ Has Authorization header?
│  ├─ NO → Return 401 Unauthorized
│  └─ YES → Extract token
│
├─ Valid JWT signature?
│  ├─ NO → Return 401 Invalid token
│  └─ YES → Decode payload
│
├─ User exists & ACTIVE?
│  ├─ NO → Return 401 User not found
│  └─ YES → Continue
│
├─ Has "investigation:read" permission?
│  ├─ NO → Return 403 Forbidden
│  └─ YES → Continue
│
├─ Can access this specific investigation?
│  ├─ If ADMIN → YES
│  ├─ If SUPERVISOR → Check circle match
│  ├─ If OFFICER → Check if created by user
│  ├─ If ANALYST → Check if assigned
│  └─ Otherwise → Return 403 Forbidden
│
└─ Return investigation data
```

---

## AUDIT & COMPLIANCE

### Audit Log Schema

```javascript
{
  _id: ObjectId,
  timestamp: ISODate,
  userId: ObjectId,
  userName: String,
  action: String,  // 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN_FAILED'
  resource: String,  // 'investigation', 'suspect', 'user', etc.
  resourceId: String,
  investigationId: String,
  details: {
    ipAddress: String,
    userAgent: String,
    status: 'SUCCESS' | 'FAILURE',
    errorMessage: String,
    changesApplied: Object  // for UPDATE actions
  },
  dataClassification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET',
  requiresApproval: Boolean,
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
}
```

### Audit Logging Examples

```javascript
// Log successful login
await AuditLog.create({
  timestamp: new Date(),
  userId: user._id,
  userName: user.name,
  action: 'LOGIN_SUCCESS',
  resource: 'user',
  resourceId: user._id.toString(),
  details: {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'SUCCESS',
    mfaVerified: true
  }
})

// Log failed login
await AuditLog.create({
  timestamp: new Date(),
  userName: email,
  action: 'LOGIN_FAILED',
  resource: 'user',
  details: {
    ipAddress: req.ip,
    status: 'FAILURE',
    errorMessage: 'Invalid password',
    attemptCount: 3
  }
})

// Log investigation view
await AuditLog.create({
  timestamp: new Date(),
  userId: req.user.id,
  userName: req.user.name,
  action: 'READ',
  resource: 'investigation',
  resourceId: investigationId,
  investigationId: investigationId,
  details: {
    ipAddress: req.ip,
    status: 'SUCCESS'
  }
})

// Log data export
await AuditLog.create({
  timestamp: new Date(),
  userId: req.user.id,
  userName: req.user.name,
  action: 'EXPORT',
  resource: 'investigation',
  resourceId: investigationId,
  investigationId: investigationId,
  details: {
    format: 'PDF',
    fileName: 'Operation_ABC_Report.pdf',
    ipAddress: req.ip,
    status: 'SUCCESS'
  },
  dataClassification: 'CONFIDENTIAL'
})

// Log database deletion (approval required)
await AuditLog.create({
  timestamp: new Date(),
  userId: req.user.id,
  userName: req.user.name,
  action: 'DELETE',
  resource: 'investigation',
  resourceId: investigationId,
  investigationId: investigationId,
  details: {
    status: 'PENDING_APPROVAL',
    reason: 'Case closed'
  },
  dataClassification: 'CONFIDENTIAL',
  requiresApproval: true
})
```

### Compliance Reports

```javascript
// Generate 30-day audit report for circle
async function getAuditReport(circle, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const logs = await AuditLog.find({
    timestamp: { $gte: startDate }
  })
  
  // Get users in this circle
  const officers = await User.find({ circle })
  
  const report = {
    period: `${startDate.toDateString()} - ${new Date().toDateString()}`,
    circle,
    totalActions: logs.length,
    actionsByType: {
      CREATE: logs.filter(l => l.action === 'CREATE').length,
      READ: logs.filter(l => l.action === 'READ').length,
      UPDATE: logs.filter(l => l.action === 'UPDATE').length,
      DELETE: logs.filter(l => l.action === 'DELETE').length,
      EXPORT: logs.filter(l => l.action === 'EXPORT').length,
      LOGIN_FAILED: logs.filter(l => l.action === 'LOGIN_FAILED').length
    },
    failedAttempts: logs.filter(l => l.details.status === 'FAILURE').length,
    dataExports: logs.filter(l => l.action === 'EXPORT').map(l => ({
      user: l.userName,
      date: l.timestamp,
      format: l.details.format,
      investigation: l.investigationId
    })),
    users: officers.map(u => ({
      name: u.name,
      badge: u.badgeNumber,
      role: u.roles[0].name,
      loginCount: logs.filter(l => l.userId === u._id && l.action === 'LOGIN_SUCCESS').length,
      actionsCount: logs.filter(l => l.userId === u._id).length
    }))
  }
  
  return report
}
```

---

## SUMMARY

| Feature | Details |
|---------|---------|
| **Roles** | Admin, Supervisor, Officer, Analyst, Forensics |
| **Access Levels** | 5 (Admin) → 1 (Forensics) |
| **Permission Model** | Granular, role-based permissions |
| **Authentication** | JWT + MFA (TOTP) |
| **Audit** | Complete logging of all actions |
| **Compliance** | GDPR-ready, Police regulation compliant |

This RBAC system ensures that each user can only access data and perform actions appropriate to their role and jurisdiction.
