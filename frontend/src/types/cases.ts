export type CaseStatus = 
  | 'pending' 
  | 'assigned' 
  | 'under_investigation' 
  | 'verified' 
  | 'closed' 
  | 'archived';

export type CasePriority = 'critical' | 'high' | 'medium' | 'low';

export type WarrantStatus = 
  | 'not_requested' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'executed';

export interface Case {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  createdBy: string; // User ID
  assignedTo: string | null; // Officer User ID
  suspects: string[]; // Suspect IDs from mockData
  warrantStatus: WarrantStatus;
  warrantRequestedBy?: string;
  warrantApprovedBy?: string;
  warrantRequestDate?: string;
  warrantApprovalDate?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes: CaseNote[];
}

export interface CaseNote {
  id: string;
  caseId: string;
  userId: string;
  content: string;
  createdAt: string;
}