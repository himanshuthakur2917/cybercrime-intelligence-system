export interface Investigation {
  id?: string;
  caseId: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  status?: string;
}

export interface Suspects {
  suspect_id: string;
  name: string;
  phone: number;
  account: string;
  fir_id: string;
  status: string;
}

export interface CallRecord {
  caller_phone: number;
  receiver_phone: number;
  call_count: number;
  total_duration: number;
  call_date: string;
}

export interface TransactionRecord {
  from_account: string;
  to_account: string;
  amount: number;
  date: string;
  purpose: string;
}

export interface csvData {
  suspects: Suspects[];
  calls: CallRecord[];
  transactions: TransactionRecord[];
}
