/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocFromServer
} from 'firebase/firestore';
import { Shift, Student, Attendance, Payment } from './types';

// Icons
import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckSquare,
  CircleDollarSign,
  LogOut,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

// Components
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import ShiftsManager from './components/ShiftsManager';
import StudentsManager from './components/StudentsManager';
import AttendanceTracker from './components/AttendanceTracker';
import TuitionManager from './components/TuitionManager';

const DEMO_KEY_PREFIX = 'edutrack_demo_';

// Rich Mock Data Seed
const SEED_SHIFTS: Shift[] = [
  {
    id: 's1',
    name: 'Ca Chiều thứ 2-4-6',
    time: '17:30 - 19:00',
    days: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
    course: 'Toán Học Lớp 10',
    fee: 800000,
    createdAt: new Date().toISOString()
  },
  {
    id: 's2',
    name: 'Ca Sáng thứ 7-CN',
    time: '08:00 - 09:30',
    days: ['Thứ 7', 'Chủ Nhật'],
    course: 'Tiếng Anh Giao Tiếp',
    fee: 1200000,
    createdAt: new Date().toISOString()
  },
  {
    id: 's3',
    name: 'Ca Tối thứ 3-5',
    time: '19:30 - 21:00',
    days: ['Thứ 3', 'Thứ 5'],
    course: 'Vật Lý Lớp 11',
    fee: 900000,
    createdAt: new Date().toISOString()
  }
];

const SEED_STUDENTS: Student[] = [
  {
    id: 'st1',
    name: 'Nguyễn Hoàng Nam',
    phone: '0912345678',
    email: 'hoangnam@gmail.com',
    birthDate: '2010-05-15',
    shifts: ['s1', 's2'],
    status: 'active',
    joinDate: '2026-01-10',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st2',
    name: 'Trần Thị Mỹ Linh',
    phone: '0987654321',
    email: 'mylinh@gmail.com',
    birthDate: '2010-11-20',
    shifts: ['s1'],
    status: 'active',
    joinDate: '2026-02-15',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st3',
    name: 'Phạm Minh Đức',
    phone: '0904112233',
    email: 'minhduc@gmail.com',
    birthDate: '2009-08-05',
    shifts: ['s2', 's3'],
    status: 'active',
    joinDate: '2026-01-20',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st4',
    name: 'Lê Thanh Bình',
    phone: '0933445566',
    email: 'thanhbinh@gmail.com',
    birthDate: '2011-02-14',
    shifts: ['s3'],
    status: 'active',
    joinDate: '2026-03-01',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st5',
    name: 'Vũ Ngân Hà',
    phone: '0977889900',
    email: 'nganha@gmail.com',
    birthDate: '2010-07-28',
    shifts: ['s1', 's3'],
    status: 'active',
    joinDate: '2026-01-15',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bypassAuth, setBypassAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data States
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard');

  // Loading States
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setBypassAuth(false);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Validate FireStore DB Online connection as mandated by skill
  useEffect(() => {
    if (user) {
      const testConnection = async () => {
        try {
          const testRef = doc(db, 'test', 'connection');
          await getDocFromServer(testRef);
          console.log("Firebase connection validated successfully.");
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration or network status.");
          }
        }
      };
      testConnection();
    }
  }, [user]);

  // 3. Real-time Firebase Sync or Local Storage Fallback
  useEffect(() => {
    // Determine database mode
    const isOnline = user !== null;

    if (isOnline) {
      // --- LIVE FIRESTORE DATA SYNC ---
      setLoadingShifts(true);
      setLoadingStudents(true);
      setLoadingAttendances(true);
      setLoadingPayments(true);

      // A. Shifts
      const unsubShifts = onSnapshot(collection(db, 'shifts'), (snapshot) => {
        const list: Shift[] = [];
        snapshot.forEach(doc => list.push(doc.data() as Shift));
        setShifts(list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
        setLoadingShifts(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'shifts');
      });

      // B. Students
      const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach(doc => list.push(doc.data() as Student));
        setStudents(list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
        setLoadingStudents(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'students');
      });

      // C. Attendances
      const unsubAttendances = onSnapshot(collection(db, 'attendances'), (snapshot) => {
        const list: Attendance[] = [];
        snapshot.forEach(doc => list.push(doc.data() as Attendance));
        setAttendances(list);
        setLoadingAttendances(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'attendances');
      });

      // D. Payments
      const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
        const list: Payment[] = [];
        snapshot.forEach(doc => list.push(doc.data() as Payment));
        setPayments(list);
        setLoadingPayments(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'payments');
      });

      return () => {
        unsubShifts();
          unsubStudents();
          unsubAttendances();
          unsubPayments();
      };
    } else if (bypassAuth) {
      // --- OFFLINE/BYPASS LOCAL STORAGE STORAGE ---
      const localShiftsStr = localStorage.getItem(`${DEMO_KEY_PREFIX}shifts`);
      const localStudentsStr = localStorage.getItem(`${DEMO_KEY_PREFIX}students`);
      const localAttendancesStr = localStorage.getItem(`${DEMO_KEY_PREFIX}attendances`);
      const localPaymentsStr = localStorage.getItem(`${DEMO_KEY_PREFIX}payments`);

      if (localShiftsStr) setShifts(JSON.parse(localShiftsStr));
      else {
        setShifts(SEED_SHIFTS);
        localStorage.setItem(`${DEMO_KEY_PREFIX}shifts`, JSON.stringify(SEED_SHIFTS));
      }

      if (localStudentsStr) setStudents(JSON.parse(localStudentsStr));
      else {
        setStudents(SEED_STUDENTS);
        localStorage.setItem(`${DEMO_KEY_PREFIX}students`, JSON.stringify(SEED_STUDENTS));
      }

      if (localAttendancesStr) setAttendances(JSON.parse(localAttendancesStr));
      else setAttendances([]);

      if (localPaymentsStr) setPayments(JSON.parse(localPaymentsStr));
      else setPayments([]);
      
      setLoadingShifts(false);
      setLoadingStudents(false);
      setLoadingAttendances(false);
      setLoadingPayments(false);
    }
  }, [user, bypassAuth]);

  // A. Shift Mutations
  const handleAddShift = async (shiftInput: Omit<Shift, 'id' | 'createdAt'>) => {
    const id = 'sh_' + Math.random().toString(36).substring(2, 11);
    const newShift: Shift = {
      ...shiftInput,
      id,
      createdAt: new Date().toISOString()
    };

    if (user) {
      const path = `shifts/${id}`;
      try {
        await setDoc(doc(db, 'shifts', id), newShift);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const updated = [newShift, ...shifts];
      setShifts(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}shifts`, JSON.stringify(updated));
    }
  };

  const handleEditShift = async (shiftToEdit: Shift) => {
    if (user) {
      const path = `shifts/${shiftToEdit.id}`;
      try {
        await setDoc(doc(db, 'shifts', shiftToEdit.id), shiftToEdit);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const updated = shifts.map(sh => sh.id === shiftToEdit.id ? shiftToEdit : sh);
      setShifts(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}shifts`, JSON.stringify(updated));
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (user) {
      const path = `shifts/${id}`;
      try {
        await deleteDoc(doc(db, 'shifts', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const updated = shifts.filter(sh => sh.id !== id);
      setShifts(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}shifts`, JSON.stringify(updated));
    }
  };

  // B. Student Mutations
  const handleAddStudent = async (studentInput: Omit<Student, 'id' | 'createdAt'>) => {
    const id = 'st_' + Math.random().toString(36).substring(2, 11);
    const newStudent: Student = {
      ...studentInput,
      id,
      createdAt: new Date().toISOString()
    };

    if (user) {
      const path = `students/${id}`;
      try {
        await setDoc(doc(db, 'students', id), newStudent);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const updated = [newStudent, ...students];
      setStudents(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}students`, JSON.stringify(updated));
    }
  };

  const handleEditStudent = async (studentToEdit: Student) => {
    if (user) {
      const path = `students/${studentToEdit.id}`;
      try {
        await setDoc(doc(db, 'students', studentToEdit.id), studentToEdit);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const updated = students.map(st => st.id === studentToEdit.id ? studentToEdit : st);
      setStudents(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}students`, JSON.stringify(updated));
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (user) {
      const path = `students/${id}`;
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const updated = students.filter(st => st.id !== id);
      setStudents(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}students`, JSON.stringify(updated));
    }
  };

  // C. Attendance Mutations (supports bulk list updating)
  const handleSaveAttendance = async (attendanceData: Omit<Attendance, 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    
    if (user) {
      for (const item of attendanceData) {
        const fullRecord: Attendance = {
          ...item,
          updatedAt: now
        };
        const path = `attendances/${item.id}`;
        try {
          await setDoc(doc(db, 'attendances', item.id), fullRecord);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } else {
      // Offline merge
      let updated = [...attendances];
      attendanceData.forEach(item => {
        const fullRecord: Attendance = {
          ...item,
          updatedAt: now
        };
        const matchIdx = updated.findIndex(idx => idx.id === item.id);
        if (matchIdx >= 0) {
          updated[matchIdx] = fullRecord;
        } else {
          updated.push(fullRecord);
        }
      });
      setAttendances(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}attendances`, JSON.stringify(updated));
    }
  };

  // Refresh Attendance Trigger helper for fetching
  const handleRefreshAttendances = async () => {
    if (user) {
      setLoadingAttendances(true);
      // Wait shortly to pretend refreshing
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      await delay(600);
      setLoadingAttendances(false);
    }
  };

  // D. Monthly Payments Mutations
  const handleUpdatePayment = async (paymentInput: Omit<Payment, 'updatedAt'>) => {
    const fullPayment: Payment = {
      ...paymentInput,
      updatedAt: new Date().toISOString()
    };

    if (user) {
      const path = `payments/${paymentInput.id}`;
      try {
        await setDoc(doc(db, 'payments', paymentInput.id), fullPayment);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      let updated = [...payments];
      const matchIdx = updated.findIndex(p => p.id === paymentInput.id);
      if (matchIdx >= 0) {
        updated[matchIdx] = fullPayment;
      } else {
        updated.push(fullPayment);
      }
      setPayments(updated);
      localStorage.setItem(`${DEMO_KEY_PREFIX}payments`, JSON.stringify(updated));
    }
  };

  const handleLogout = async () => {
    if (user) {
      await signOut(auth);
    } else {
      setBypassAuth(false);
    }
  };

  // Preloading View
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full mx-auto"></div>
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  // Login Barrier Check
  if (!user && !bypassAuth) {
    return <AuthScreen onBypass={() => setBypassAuth(true)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Bảng Điểu Khiển', icon: LayoutDashboard },
    { id: 'shifts', label: 'Lớp & Ca Học', icon: Calendar },
    { id: 'students', label: 'Học Sinh', icon: Users },
    { id: 'attendance', label: 'Điểm Danh', icon: CheckSquare },
    { id: 'tuition', label: 'Ghi Học Phí', icon: CircleDollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex text-slate-700 font-sans antialiased">
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-400 border-r border-slate-800 shrink-0 print:hidden justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/10">
              <GraduationCap size={22} />
            </div>
            <div>
              <span className="font-bold text-base leading-none block">EduTrack Pro</span>
              <span className="text-3xs text-indigo-400 font-semibold uppercase tracking-widest block mt-0.5">Quản lý chuyên cần</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/20'
                      : 'hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database context user profile at bottom */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="bg-slate-800/40 p-3.5 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phiên làm việc</span>
            <span className="font-bold text-slate-200 text-xs mt-0.5 flex items-center gap-1.5">
              <Sparkles size={11} className="text-indigo-400 shrink-0" />
              {user ? (
                <span className="truncate max-w-[150px]">{user.email || user.uid}</span>
              ) : (
                "Bản Demo Ngoại Tuyến"
              )}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              {user ? "Dữ liệu đám mây (Online)" : "Lưu bộ nhớ trình duyệt"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut size={14} />
            Đăng xuất hệ thống
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-40 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap size={18} />
          </div>
          <span className="font-bold text-slate-800 text-sm">EduTrack Pro</span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE OVERLAY NAVIGATION CONTAINER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 pt-16 print:hidden">
          <div className="bg-white p-6 rounded-b-3xl border-b border-slate-100 space-y-6">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="h-px bg-slate-100"></div>

            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="block text-slate-400">Trình trạng</span>
                <span className="font-bold text-slate-800">{user ? "Trực tuyến (Live DB)" : "Ngoại tuyến (Demo Mode)"}</span>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 font-bold rounded-lg cursor-pointer hover:bg-rose-100 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER AND INNER WRAPPER CONTAINER */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:p-8 pt-20 md:pt-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Main conditional tab routing */}
          {activeTab === 'dashboard' && (
            <Dashboard
              shifts={shifts}
              students={students}
              attendances={attendances}
              onSetTab={setActiveTab}
            />
          )}

          {activeTab === 'shifts' && (
            <ShiftsManager
              shifts={shifts}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              onDeleteShift={handleDeleteShift}
            />
          )}

          {activeTab === 'students' && (
            <StudentsManager
              students={students}
              shifts={shifts}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTracker
              shifts={shifts}
              students={students}
              attendances={attendances}
              onSaveAttendance={handleSaveAttendance}
              loadingAttendances={loadingAttendances}
              onRefreshAttendances={handleRefreshAttendances}
            />
          )}

          {activeTab === 'tuition' && (
            <TuitionManager
              shifts={shifts}
              students={students}
              payments={payments}
              onUpdatePayment={handleUpdatePayment}
              loadingPayments={loadingPayments}
            />
          )}

        </div>
      </main>
    </div>
  );
}
