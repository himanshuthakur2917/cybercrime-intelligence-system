// CIS Mock Data - All suspects, calls, transactions, and timeline events

export interface Suspect {
  id: string;
  name: string;
  phone: string;
  account: string;
  role: 'Kingpin' | 'Coordinator' | 'Mule' | 'Support';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  centralityScore: number;
  callsInitiated: number;
  callsReceived: number;
}

export interface Call {
  from: string;
  to: string;
  count: number;
  totalDuration: number; // in minutes
  dates: string[];
}

export interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  fromSuspect: string;
  toSuspect: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'flagged';
}

export interface TimelineEvent {
  id: string;
  suspectId: string;
  type: 'call' | 'transaction' | 'alert';
  description: string;
  date: string;
  time: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface NetworkNode {
  id: string;
  name: string;
  role: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  radius: number;
  score: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  calls: number;
}

// Suspects Data
export const suspects: Suspect[] = [
  {
    id: 'S4',
    name: 'Vikram Patel',
    phone: '+91 76543 21098',
    account: 'IDBI_901234',
    role: 'Kingpin',
    riskLevel: 'critical',
    riskScore: 87,
    centralityScore: 87,
    callsInitiated: 27,
    callsReceived: 8,
  },
  {
    id: 'S1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    account: 'ICICI_123456',
    role: 'Coordinator',
    riskLevel: 'high',
    riskScore: 78,
    centralityScore: 78,
    callsInitiated: 15,
    callsReceived: 12,
  },
  {
    id: 'S2',
    name: 'Amit Singh',
    phone: '+91 98765 43211',
    account: 'HDFC_789012',
    role: 'Coordinator',
    riskLevel: 'high',
    riskScore: 75,
    centralityScore: 75,
    callsInitiated: 10,
    callsReceived: 8,
  },
  {
    id: 'S3',
    name: 'Priya Sharma',
    phone: '+91 98765 43212',
    account: 'AXIS_345678',
    role: 'Coordinator',
    riskLevel: 'high',
    riskScore: 72,
    centralityScore: 72,
    callsInitiated: 22,
    callsReceived: 20,
  },
  {
    id: 'S5',
    name: 'Neha Gupta',
    phone: '+91 98765 43213',
    account: 'SBI_567890',
    role: 'Mule',
    riskLevel: 'low',
    riskScore: 32,
    centralityScore: 32,
    callsInitiated: 0,
    callsReceived: 5,
  },
];

// Calls Data
export const calls: Call[] = [
  { from: 'S1', to: 'S4', count: 12, totalDuration: 45, dates: ['2025-02-10', '2025-02-11', '2025-02-12'] },
  { from: 'S2', to: 'S4', count: 6, totalDuration: 22, dates: ['2025-02-11', '2025-02-12'] },
  { from: 'S3', to: 'S4', count: 20, totalDuration: 78, dates: ['2025-02-10', '2025-02-11', '2025-02-12', '2025-02-13'] },
  { from: 'S4', to: 'S5', count: 5, totalDuration: 15, dates: ['2025-02-14'] },
  { from: 'S1', to: 'S2', count: 3, totalDuration: 10, dates: ['2025-02-11'] },
  { from: 'S2', to: 'S3', count: 2, totalDuration: 8, dates: ['2025-02-12'] },
  { from: 'S4', to: 'S1', count: 8, totalDuration: 30, dates: ['2025-02-12', '2025-02-13'] },
];

// Transactions Data
export const transactions: Transaction[] = [
  {
    id: 'TXN001',
    fromAccount: 'ICICI_123456',
    toAccount: 'IDBI_901234',
    fromSuspect: 'S1',
    toSuspect: 'S4',
    amount: 75000,
    date: '2025-02-10',
    status: 'completed',
  },
  {
    id: 'TXN002',
    fromAccount: 'HDFC_789012',
    toAccount: 'IDBI_901234',
    fromSuspect: 'S2',
    toSuspect: 'S4',
    amount: 120000,
    date: '2025-02-11',
    status: 'completed',
  },
  {
    id: 'TXN003',
    fromAccount: 'IDBI_901234',
    toAccount: 'SBI_567890',
    fromSuspect: 'S4',
    toSuspect: 'S5',
    amount: 200000,
    date: '2025-02-14',
    status: 'flagged',
  },
  {
    id: 'TXN004',
    fromAccount: 'AXIS_345678',
    toAccount: 'ICICI_123456',
    fromSuspect: 'S3',
    toSuspect: 'S1',
    amount: 45000,
    date: '2025-02-12',
    status: 'completed',
  },
  {
    id: 'TXN005',
    fromAccount: 'External_999',
    toAccount: 'AXIS_345678',
    fromSuspect: 'External',
    toSuspect: 'S3',
    amount: 100000,
    date: '2025-02-09',
    status: 'completed',
  },
];

// Timeline Events
export const timelineEvents: TimelineEvent[] = [
  {
    id: 'EVT001',
    suspectId: 'S4',
    type: 'transaction',
    description: 'Sent ₹200K to S5 (Mule)',
    date: '2025-02-14',
    time: '2:30 PM',
    riskLevel: 'critical',
  },
  {
    id: 'EVT002',
    suspectId: 'S4',
    type: 'call',
    description: 'Burst of 8 calls between S4 & S1',
    date: '2025-02-12',
    time: '9:15 AM',
    riskLevel: 'high',
  },
  {
    id: 'EVT003',
    suspectId: 'S4',
    type: 'transaction',
    description: 'Received ₹120K from S2',
    date: '2025-02-11',
    time: '12:30 PM',
    riskLevel: 'medium',
  },
  {
    id: 'EVT004',
    suspectId: 'S4',
    type: 'transaction',
    description: 'Received ₹75K from S1',
    date: '2025-02-10',
    time: '10:15 AM',
    riskLevel: 'medium',
  },
  {
    id: 'EVT005',
    suspectId: 'S1',
    type: 'call',
    description: 'First contact with S4 established',
    date: '2025-02-10',
    time: '9:34 AM',
    riskLevel: 'low',
  },
];

// Network Graph Data
export const networkNodes: NetworkNode[] = [
  { id: 'S4', name: 'Vikram Patel', role: 'Kingpin', risk: 'critical', radius: 35, score: 87 },
  { id: 'S1', name: 'Rajesh Kumar', role: 'Coordinator', risk: 'high', radius: 25, score: 78 },
  { id: 'S2', name: 'Amit Singh', role: 'Coordinator', risk: 'high', radius: 25, score: 75 },
  { id: 'S3', name: 'Priya Sharma', role: 'Coordinator', risk: 'high', radius: 25, score: 72 },
  { id: 'S5', name: 'Neha Gupta', role: 'Mule', risk: 'low', radius: 15, score: 32 },
];

export const networkLinks: NetworkLink[] = [
  { source: 'S1', target: 'S4', calls: 12 },
  { source: 'S2', target: 'S4', calls: 6 },
  { source: 'S3', target: 'S4', calls: 20 },
  { source: 'S4', target: 'S5', calls: 5 },
  { source: 'S1', target: 'S2', calls: 3 },
  { source: 'S2', target: 'S3', calls: 2 },
];

// Summary Statistics
export const investigationStats = {
  totalSuspects: 5,
  totalCalls: 56,
  moneyFlow: 540000,
  riskLevel: 'critical' as const,
  activityPeriod: 'Feb 10-14, 2025',
  networkDensity: 87,
};

// Fraud Rings Data
export const fraudRings = [
  {
    id: 1,
    name: 'Core Operation Network',
    status: 'active',
    riskLevel: 'critical' as const,
    members: ['S1', 'S2', 'S3', 'S4'],
    characteristics: {
      size: 4,
      density: 100,
      totalCalls: 47,
      activityPeriod: 'Feb 10-14, 2025',
      totalMoney: 340000,
      pattern: 'Star topology (S4 = hub)',
      likelihood: 98,
    },
  },
  {
    id: 2,
    name: 'Support / Mule Account',
    status: 'supporting',
    riskLevel: 'low' as const,
    members: ['S5'],
    characteristics: {
      size: 1,
      density: 0,
      totalCalls: 5,
      activityPeriod: 'Feb 14, 2025',
      totalMoney: 200000,
      pattern: 'Receive only',
      likelihood: 75,
    },
  },
];

// Risk color mapping
export const riskColors = {
  critical: '#D32F2F',
  high: '#F57C00',
  medium: '#FBC02D',
  low: '#388E3C',
};

// Format currency
export function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Get suspect by ID
export function getSuspectById(id: string): Suspect | undefined {
  return suspects.find(s => s.id === id);
}

// Get risk badge class
export function getRiskBadgeClass(riskLevel: 'critical' | 'high' | 'medium' | 'low'): string {
  const classes = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };
  return classes[riskLevel];
}

// Get timeline border class
export function getTimelineBorderClass(riskLevel: 'critical' | 'high' | 'medium' | 'low'): string {
  const classes = {
    critical: 'red-border',
    high: 'orange-border',
    medium: 'yellow-border',
    low: 'teal-border',
  };
  return classes[riskLevel];
}