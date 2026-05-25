export interface Shift {
  id: string;
  name: string;        // e.g. "Ca 1: Sáng Thứ 2-4-6"
  time: string;        // e.g. "08:00 - 09:30"
  days: string[];      // e.g. ["Monday", "Wednesday", "Friday"]
  course: string;      // e.g. "Toán 10"
  fee: number;         // Tuition fee per shift (VND/month or VND/session)
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  shifts: string[];    // IDs of shifts this student is in
  status: 'active' | 'inactive';
  joinDate: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused';

export interface Attendance {
  id: string;          // formatted as date_shiftId_studentId
  date: string;        // YYYY-MM-DD
  shiftId: string;
  studentId: string;
  status: AttendanceStatus;
  note: string;
  updatedAt: string;
}

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface Payment {
  id: string;
  studentId: string;
  shiftId: string;
  month: string;       // e.g. "2026-05"
  amountPaid: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentDate?: string; // YYYY-MM-DD
  note: string;
  receiptUrl?: string; // URL or local dataURI
  updatedAt: string;
}
