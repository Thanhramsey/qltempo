export interface Shift {
  id: string;
  name: string;        // e.g. "Ca 1: Sáng Thứ 2-4-6"
  time: string;        // e.g. "08:00 - 09:30"
  weekday: string;     // e.g. "Thứ 2"
  days?: string[];     // Backward compatible legacy field
  course: string;      // e.g. "Toán 10"
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  tuitionCycleType?: TuitionCycleType; // optional for backward compatibility with older records
  shifts: string[];    // IDs of shifts this student is in
  status: 'active' | 'inactive';
  joinDate: string;
  createdAt: string;
}

export interface TuitionCycleConfigRecord {
  id: string;
  name: string;
  sessionsTarget: number;
  feeVnd: number;
  excusedAbsenceFree: number;
  unexcusedAbsenceFree: number;
  warningFromSession: number;
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
export type TuitionCycleType = string;

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff' | 'teacher';
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  cycleIndex: number;  // 1-based cycle index
  sessionsTarget: number; // per student's cycle package (e.g. 24 or 8)
  shiftId?: string;    // Legacy field
  month?: string;      // Legacy field
  amountPaid: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentDate?: string; // YYYY-MM-DD
  note: string;
  receiptUrl?: string; // URL or local dataURI
  updatedAt: string;
}
