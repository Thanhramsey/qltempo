import React, { useEffect, useMemo, useState } from 'react';
import { Student, Shift, Attendance } from '../types';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  UserCheck,
  UserX,
  X,
  Download,
  History,
  Save,
  Loader2,
  Music2,
  Clock3,
  CalendarDays,
  BookOpen,
  Star,
  Bell,
  Sun,
  Moon,
  Cake,
  type LucideIcon,
} from 'lucide-react';
import { exportStudentsList } from '../utils/csvExport';
import { COURSE_SESSION_TARGET, getStudentCycleProgress } from '../utils/tuitionCycle';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface StudentsManagerProps {
  students: Student[];
  shifts: Shift[];
  attendances: Attendance[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onEditStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onSaveAttendance: (attendanceData: Omit<Attendance, 'updatedAt'>[]) => Promise<void>;
}

function parseDateString(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDateString(date: Date | null): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isTodayBirthday(birthDate?: string): boolean {
  if (!birthDate) return false;
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return false;

  const today = new Date();
  return today.getMonth() + 1 === m && today.getDate() === d;
}

interface ShiftColorTheme {
  chip: string;
  selectedRow: string;
  selectedTag: string;
  selectedTagClose: string;
  selectedPill: string;
  iconText: string;
  icon: LucideIcon;
}

const SHIFT_COLOR_THEMES: ShiftColorTheme[] = [
  {
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    selectedRow: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    selectedTag: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    selectedTagClose: 'text-indigo-500 hover:text-rose-600',
    selectedPill: 'text-indigo-600 bg-indigo-100/60',
    iconText: 'text-indigo-600',
    icon: Music2,
  },
  {
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    selectedRow: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    selectedTag: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    selectedTagClose: 'text-emerald-500 hover:text-rose-600',
    selectedPill: 'text-emerald-600 bg-emerald-100/60',
    iconText: 'text-emerald-600',
    icon: Clock3,
  },
  {
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
    selectedRow: 'bg-amber-50 border-amber-200 text-amber-800',
    selectedTag: 'bg-amber-50 border-amber-200 text-amber-800',
    selectedTagClose: 'text-amber-600 hover:text-rose-600',
    selectedPill: 'text-amber-700 bg-amber-100/70',
    iconText: 'text-amber-600',
    icon: CalendarDays,
  },
  {
    chip: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    selectedRow: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    selectedTag: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    selectedTagClose: 'text-cyan-600 hover:text-rose-600',
    selectedPill: 'text-cyan-700 bg-cyan-100/70',
    iconText: 'text-cyan-600',
    icon: BookOpen,
  },
  {
    chip: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
    selectedRow: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
    selectedTag: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
    selectedTagClose: 'text-fuchsia-600 hover:text-rose-600',
    selectedPill: 'text-fuchsia-700 bg-fuchsia-100/70',
    iconText: 'text-fuchsia-600',
    icon: Star,
  },
  {
    chip: 'bg-rose-50 text-rose-800 border-rose-200',
    selectedRow: 'bg-rose-50 border-rose-200 text-rose-800',
    selectedTag: 'bg-rose-50 border-rose-200 text-rose-800',
    selectedTagClose: 'text-rose-600 hover:text-rose-700',
    selectedPill: 'text-rose-700 bg-rose-100/70',
    iconText: 'text-rose-600',
    icon: Bell,
  },
  {
    chip: 'bg-teal-50 text-teal-800 border-teal-200',
    selectedRow: 'bg-teal-50 border-teal-200 text-teal-800',
    selectedTag: 'bg-teal-50 border-teal-200 text-teal-800',
    selectedTagClose: 'text-teal-600 hover:text-rose-600',
    selectedPill: 'text-teal-700 bg-teal-100/70',
    iconText: 'text-teal-600',
    icon: Sun,
  },
  {
    chip: 'bg-orange-50 text-orange-800 border-orange-200',
    selectedRow: 'bg-orange-50 border-orange-200 text-orange-800',
    selectedTag: 'bg-orange-50 border-orange-200 text-orange-800',
    selectedTagClose: 'text-orange-600 hover:text-rose-600',
    selectedPill: 'text-orange-700 bg-orange-100/70',
    iconText: 'text-orange-600',
    icon: Moon,
  },
];

function getShiftTheme(shiftId: string) {
  const hash = shiftId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return SHIFT_COLOR_THEMES[hash % SHIFT_COLOR_THEMES.length];
}

export default function StudentsManager({ students, shifts, attendances, onAddStudent, onEditStudent, onDeleteStudent, onSaveAttendance }: StudentsManagerProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [historySaving, setHistorySaving] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'present' | 'absent_excused' | 'absent_unexcused'>('all');
  const [historyDrafts, setHistoryDrafts] = useState<Record<string, { status: Attendance['status']; note: string }>>({});

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftDayFilter, setSelectedShiftDayFilter] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [formShiftSearch, setFormShiftSearch] = useState('');
  const [formDayFilter, setFormDayFilter] = useState<string>('all');

  const dayOrder: Record<string, number> = {
    'Thứ 2': 1,
    'Thứ 3': 2,
    'Thứ 4': 3,
    'Thứ 5': 4,
    'Thứ 6': 5,
    'Thứ 7': 6,
    'Chủ Nhật': 7,
  };

  const getShiftDay = (shift: Shift) => shift.weekday || shift.days?.[0] || 'Khác';

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      const dayA = dayOrder[getShiftDay(a)] || 99;
      const dayB = dayOrder[getShiftDay(b)] || 99;
      if (dayA !== dayB) return dayA - dayB;
      return a.time.localeCompare(b.time);
    });
  }, [shifts]);

  const availableDays = useMemo(() => {
    return Array.from(new Set(sortedShifts.map((sh) => getShiftDay(sh))));
  }, [sortedShifts]);

  const shiftsForListFilter = useMemo(() => {
    if (selectedShiftDayFilter === 'all') return sortedShifts;
    return sortedShifts.filter((shift) => getShiftDay(shift) === selectedShiftDayFilter);
  }, [sortedShifts, selectedShiftDayFilter]);

  useEffect(() => {
    if (selectedShiftFilter === 'all') return;
    const stillExists = shiftsForListFilter.some((shift) => shift.id === selectedShiftFilter);
    if (!stillExists) {
      setSelectedShiftFilter('all');
    }
  }, [selectedShiftDayFilter, selectedShiftFilter, shiftsForListFilter]);

  const filteredFormShifts = useMemo(() => {
    const q = formShiftSearch.trim().toLowerCase();
    return sortedShifts.filter((sh) => {
      const day = getShiftDay(sh);
      const matchesDay = formDayFilter === 'all' || day === formDayFilter;
      const matchesSearch =
        !q ||
        sh.name.toLowerCase().includes(q) ||
        sh.course.toLowerCase().includes(q) ||
        sh.time.toLowerCase().includes(q) ||
        day.toLowerCase().includes(q);

      return matchesDay && matchesSearch;
    });
  }, [sortedShifts, formDayFilter, formShiftSearch]);

  const selectedShiftDetails = useMemo(() => {
    return selectedShifts
      .map((id) => shifts.find((shift) => shift.id === id))
      .filter(Boolean) as Shift[];
  }, [selectedShifts, shifts]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    setSelectedShifts([]);
    setStatus('active');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setFormShiftSearch('');
    setFormDayFilter('all');
    setIsOpenForm(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setPhone(student.phone);
    setEmail(student.email || '');
    setBirthDate(student.birthDate || '');
    setSelectedShifts(student.shifts || []);
    setStatus(student.status);
    setJoinDate(student.joinDate);
    setFormShiftSearch('');
    setFormDayFilter('all');
    setIsOpenForm(true);
  };

  const toggleFormShift = (shiftId: string) => {
    if (selectedShifts.includes(shiftId)) {
      setSelectedShifts(selectedShifts.filter(id => id !== shiftId));
    } else {
      setSelectedShifts([...selectedShifts, shiftId]);
    }
  };

  const handleSelectFilteredShifts = () => {
    const filteredIds = filteredFormShifts.map((sh) => sh.id);
    setSelectedShifts((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearFilteredShifts = () => {
    const filteredIds = new Set(filteredFormShifts.map((sh) => sh.id));
    setSelectedShifts((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  const handleRemoveSelectedShift = (shiftId: string) => {
    setSelectedShifts((prev) => prev.filter((id) => id !== shiftId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedShifts.length === 0) {
      alert("Vui lòng điền họ tên và chọn ít nhất 1 ca học!");
      return;
    }

    setLoading(true);
    try {
      if (editingStudent) {
        await onEditStudent({
          ...editingStudent,
          name,
          phone,
          email,
          birthDate,
          shifts: selectedShifts,
          status,
          joinDate
        });
      } else {
        await onAddStudent({
          name,
          phone,
          email,
          birthDate,
          shifts: selectedShifts,
          status,
          joinDate
        });
      }
      setIsOpenForm(false);
    } catch (err) {
      console.error(err);
      alert("Gặp lỗi khi lưu thông tin học sinh!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa học sinh này hoàn toàn khỏi hệ thống?")) {
      try {
        await onDeleteStudent(id);
      } catch (err) {
        console.error(err);
        alert("Gặp lỗi khi xóa học sinh!");
      }
    }
  };

  // Filter and search students
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesShift = (() => {
      if (!student.shifts || student.shifts.length === 0) return false;

      if (selectedShiftFilter !== 'all') {
        return student.shifts.includes(selectedShiftFilter);
      }

      if (selectedShiftDayFilter !== 'all') {
        return student.shifts.some((shiftId) => {
          const shift = shifts.find((sh) => sh.id === shiftId);
          return shift ? getShiftDay(shift) === selectedShiftDayFilter : false;
        });
      }

      return true;
    })();

    const matchesStatus =
      statusFilter === 'all' ||
      student.status === statusFilter;

    return matchesSearch && matchesShift && matchesStatus;
  });

  const handleExport = () => {
    exportStudentsList(filteredStudents, shifts);
  };

  const historyRows = useMemo(() => {
    if (!historyStudent) return [];

    const rows = attendances
      .filter((att) => att.studentId === historyStudent.id)
      .map((att) => {
        const shift = shifts.find((sh) => sh.id === att.shiftId);
        return {
          ...att,
          shiftLabel: shift
            ? `${shift.name} - ${shift.weekday || shift.days?.[0] || 'N/A'} (${shift.time})`
            : att.shiftId,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    if (historyStatusFilter === 'all') return rows;
    return rows.filter((row) => row.status === historyStatusFilter);
  }, [historyStudent, attendances, shifts, historyStatusFilter]);

  const handleOpenHistory = (student: Student) => {
    setHistoryStudent(student);
    setHistoryStatusFilter('all');

    const initialDrafts: Record<string, { status: Attendance['status']; note: string }> = {};
    attendances
      .filter((att) => att.studentId === student.id)
      .forEach((att) => {
        initialDrafts[att.id] = {
          status: att.status,
          note: att.note || '',
        };
      });

    setHistoryDrafts(initialDrafts);
    setIsHistoryOpen(true);
  };

  const handleHistoryFieldChange = (
    attendanceId: string,
    field: 'status' | 'note',
    value: string
  ) => {
    setHistoryDrafts((prev) => ({
      ...prev,
      [attendanceId]: {
        status: field === 'status'
          ? (value as Attendance['status'])
          : (prev[attendanceId]?.status || 'present'),
        note: field === 'note' ? value : (prev[attendanceId]?.note || ''),
      },
    }));
  };

  const handleSaveHistoryChanges = async () => {
    if (!historyStudent) return;

    const studentAttendances = attendances.filter((att) => att.studentId === historyStudent.id);
    const changedRecords = studentAttendances
      .filter((att) => {
        const draft = historyDrafts[att.id];
        if (!draft) return false;
        return draft.status !== att.status || draft.note !== (att.note || '');
      })
      .map((att) => ({
        id: att.id,
        date: att.date,
        shiftId: att.shiftId,
        studentId: att.studentId,
        status: historyDrafts[att.id].status,
        note: historyDrafts[att.id].note,
      }));

    if (changedRecords.length === 0) {
      alert('Không có thay đổi nào để lưu.');
      return;
    }

    setHistorySaving(true);
    try {
      await onSaveAttendance(changedRecords);
      alert(`Đã cập nhật ${changedRecords.length} bản ghi điểm danh.`);
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật lịch sử điểm danh. Vui lòng thử lại.');
    } finally {
      setHistorySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Roster actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            Quản lý học sinh ({students.length})
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu thông tin liên hệ, sửa lý lịch, ghi danh nhiều ca học và cập nhật trạng thái học tập.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            <Download size={16} />
            Xuất Excel (CSV)
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer transition-all duration-200"
          >
            <Plus size={16} />
            Thêm Học Sinh
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Filter by Weekday */}
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <select
            value={selectedShiftDayFilter}
            onChange={(e) => setSelectedShiftDayFilter(e.target.value)}
            className="tempo-select w-full pl-10 py-2 rounded-xl text-slate-700 text-sm font-medium bg-white cursor-pointer"
          >
            <option value="all">Tất cả thứ</option>
            {availableDays.map((day) => {
              const count = sortedShifts.filter((shift) => getShiftDay(shift) === day).length;
              return (
                <option key={day} value={day}>{day} ({count} ca)</option>
              );
            })}
          </select>
        </div>

        {/* Filter by Shift */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="tempo-select w-full pl-10 py-2 rounded-xl text-slate-700 text-sm font-medium bg-white cursor-pointer"
          >
            <option value="all">
              {selectedShiftDayFilter === 'all'
                ? `Tất cả ca học (${shifts.length})`
                : `Tất cả ca của ${selectedShiftDayFilter} (${shiftsForListFilter.length})`}
            </option>
            {shiftsForListFilter.map(sh => (
              <option key={sh.id} value={sh.id}>{sh.name} ({sh.course})</option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="relative">
          <UserCheck className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tempo-select w-full pl-10 py-2 rounded-xl text-slate-700 text-sm font-medium bg-white cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang theo học (Active)</option>
            <option value="inactive">Đã nghỉ học (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="mx-auto text-slate-200 mb-3" size={48} />
            <h3 className="font-semibold text-slate-700 text-lg">Không tìm thấy học sinh</h3>
            <p className="text-sm text-slate-400 mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc gỡ chọn bộ lọc xem sao nhé.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 border-b border-indigo-300 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                  <th className="px-6 py-4 min-w-[250px]">Họ và Tên</th>
                  <th className="px-6 py-4">Liên hệ (SĐT / Email)</th>
                  <th className="px-6 py-4">Ngày sinh</th>
                  <th className="px-6 py-4">Lớp chính - Ca đăng ký</th>
                  <th className="px-6 py-4">Tiến độ 24 buổi</th>
                  <th className="px-6 py-4">Ngày nhập học</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredStudents.map((student) => {
                  const studentShifts = (student.shifts || []).map(shId => {
                    return shifts.find(s => s.id === shId);
                  }).filter(Boolean);
                  const progress = getStudentCycleProgress(attendances, student.id);
                  const progressPercent = Math.round((progress.currentCycleSessions / COURSE_SESSION_TARGET) * 100);
                  const birthdayToday = isTodayBirthday(student.birthDate);

                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        birthdayToday
                          ? 'bg-amber-50/70 hover:bg-amber-100/60 border-l-4 border-amber-300'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 min-w-[250px]">
                        <div
                          title={student.name}
                          className={`inline-flex max-w-[240px] items-center px-2.5 py-1 rounded-lg border font-extrabold text-sm shadow-xs whitespace-nowrap overflow-hidden text-ellipsis ${
                          birthdayToday
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                        }`}>
                          {student.name}
                        </div>
                        {birthdayToday && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                            <Cake size={11} />
                            Sinh nhật hôm nay
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={13} className="text-slate-400" />
                          <span className="font-semibold font-mono">{student.phone}</span>
                        </div>
                        {student.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <Mail size={13} className="text-slate-400" />
                            <span>{student.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {student.birthDate ? (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon size={13} className="text-slate-400" />
                            <span>{student.birthDate.split('-').reverse().join('/')}</span>
                          </div>
                        ) : "---"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {studentShifts.length === 0 ? (
                            <span className="text-2xs text-rose-500 font-medium">Chưa ghi danh ca nào</span>
                          ) : (
                            studentShifts.map((sh: any) => {
                              const theme = getShiftTheme(sh.id);
                              const ShiftIcon = theme.icon;
                              return (
                              <span key={sh.id} className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 text-xs font-semibold rounded-md border ${theme.chip}`}>
                                <ShiftIcon size={12} className={theme.iconText} />
                                {sh.name} - {sh.weekday || sh.days?.[0] || 'N/A'} ({sh.time})
                              </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[210px]">
                        <div className={`rounded-lg border px-3 py-2 ${
                          progress.isNearCycleEnd
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-600">Chu kỳ {progress.currentCycleIndex}</span>
                            <span className={`font-bold ${progress.isNearCycleEnd ? 'text-amber-700' : 'text-indigo-700'}`}>
                              {progress.currentCycleSessions}/{COURSE_SESSION_TARGET}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white overflow-hidden">
                            <div
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              className={`h-full ${progress.isNearCycleEnd ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            ></div>
                          </div>
                          <div className={`text-[10px] mt-1 font-semibold ${progress.isNearCycleEnd ? 'text-amber-700' : 'text-slate-500'}`}>
                            {progress.isNearCycleEnd
                              ? `Sắp đủ khóa, còn ${progress.sessionsRemaining} buổi`
                              : `Đã học tổng ${progress.totalPresentSessions} buổi`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {student.joinDate ? student.joinDate.split('-').reverse().join('/') : "---"}
                      </td>
                      <td className="px-6 py-4">
                        {student.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Đang học
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            Nghỉ học
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Sửa lý lịch"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenHistory(student)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Xem lịch sử học"
                          >
                            <History size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                {editingStudent ? "Sửa lý lịch học sinh" : "Thêm học sinh mới"}
              </h3>
              <button
                onClick={() => setIsOpenForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Họ và Tên Học Sinh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Số Điện Thoại Phụ Huynh / HS
                  </label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    placeholder="Ví dụ: hoten@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ngày Sinh
                  </label>
                  <DatePicker
                    selected={parseDateString(birthDate)}
                    onChange={(date) => setBirthDate(formatDateString(date as Date | null))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Chọn ngày sinh"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={120}
                    wrapperClassName="w-full"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ngày Nhập Học
                  </label>
                  <DatePicker
                    selected={parseDateString(joinDate)}
                    onChange={(date) => setJoinDate(formatDateString(date as Date | null))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Chọn ngày nhập học"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={60}
                    wrapperClassName="w-full"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Trạng Thái Học Tập
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <UserCheck size={14} /> Đang theo học
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <UserX size={14} /> Nghỉ học
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ghi Danh Đăng Ký Ca Học * (Có thể học nhiều thứ/ca)
                </label>
                {shifts.length === 0 ? (
                  <p className="text-xs text-rose-500">Vui lòng tạo Ca học trước khi đăng ký ghi danh học sinh!</p>
                ) : (
                  <div className="space-y-2 mt-1 border border-slate-100 bg-slate-50/50 p-2.5 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <select
                        value={formDayFilter}
                        onChange={(e) => setFormDayFilter(e.target.value)}
                        className="tempo-select w-full px-3 py-2 rounded-lg text-xs bg-white"
                      >
                        <option value="all">Tất cả thứ ({shifts.length} ca)</option>
                        {availableDays.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={formShiftSearch}
                        onChange={(e) => setFormShiftSearch(e.target.value)}
                        placeholder="Tìm ca theo thứ/giờ/môn..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 font-semibold">
                        Hiển thị {filteredFormShifts.length} ca, đã chọn {selectedShifts.length} ca
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectFilteredShifts}
                          className="px-2.5 py-1 text-[11px] rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 cursor-pointer"
                        >
                          Chọn tất cả đang lọc
                        </button>
                        <button
                          type="button"
                          onClick={handleClearFilteredShifts}
                          className="px-2.5 py-1 text-[11px] rounded-md border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                        >
                          Bỏ chọn đang lọc
                        </button>
                      </div>
                    </div>

                    {selectedShiftDetails.length > 0 && (
                      <div className="bg-white border border-indigo-100 rounded-lg p-2.5">
                        <div className="text-[11px] text-indigo-700 font-bold mb-2">
                          Ca đã chọn (vẫn giữ nguyên khi bạn đổi tìm kiếm/lọc)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedShiftDetails.map((shift) => (
                            (() => {
                              const theme = getShiftTheme(shift.id);
                              const ShiftIcon = theme.icon;
                              return (
                            <span
                              key={shift.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold ${theme.selectedTag}`}
                            >
                              <ShiftIcon size={12} className={theme.iconText} />
                              {getShiftDay(shift)} {shift.time}
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedShift(shift.id)}
                                className={`${theme.selectedTagClose} cursor-pointer`}
                                title="Bỏ ca này"
                              >
                                <X size={12} />
                              </button>
                            </span>
                              );
                            })()
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto pr-1">
                      {filteredFormShifts.map((sh) => {
                      const isSelected = selectedShifts.includes(sh.id);
                      const theme = getShiftTheme(sh.id);
                      const ShiftIcon = theme.icon;
                      return (
                        <button
                          type="button"
                          key={sh.id}
                          onClick={() => toggleFormShift(sh.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left ${
                            isSelected
                              ? `${theme.selectedRow} border`
                              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div>
                            <div className="font-bold inline-flex items-center gap-1.5">
                              <ShiftIcon size={12} className={theme.iconText} />
                              {sh.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sh.course} - {getShiftDay(sh)} - {sh.time}</div>
                          </div>
                          {isSelected && <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${theme.selectedPill}`}>Đã chọn</span>}
                        </button>
                      );
                      })}

                      {filteredFormShifts.length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-4 bg-white border border-dashed border-slate-200 rounded-lg">
                          Không có ca nào khớp bộ lọc hiện tại.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading || (shifts.length === 0)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {loading ? "Đang lưu..." : "Xác Nhận Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Attendance History Modal */}
      {isHistoryOpen && historyStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-blue-600" />
                  Lịch sử học: {historyStudent.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chỉnh trạng thái có mặt/vắng cho từng buổi và lưu lại ngay.
                </p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-slate-600">
                Tổng số buổi đã ghi nhận: <span className="font-bold text-slate-800">{attendances.filter((att) => att.studentId === historyStudent.id).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lọc trạng thái</label>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value as 'all' | 'present' | 'absent_excused' | 'absent_unexcused')}
                  className="tempo-select px-3 py-2 rounded-lg text-xs bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="present">Có mặt</option>
                  <option value="absent_excused">Vắng có phép</option>
                  <option value="absent_unexcused">Vắng không phép</option>
                </select>
              </div>
            </div>

            <div className="max-h-[62vh] overflow-auto">
              {historyRows.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">
                  Chưa có lịch sử điểm danh cho học sinh này.
                </div>
              ) : (
                <table className="w-full min-w-[980px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3">Ngày học</th>
                      <th className="px-6 py-3">Ca học</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {historyRows.map((row) => {
                      const draft = historyDrafts[row.id] || { status: row.status, note: row.note || '' };
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/40">
                          <td className="px-6 py-3 font-medium text-slate-700">
                            {row.date.split('-').reverse().join('/')}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {row.shiftLabel}
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={draft.status}
                              onChange={(e) => handleHistoryFieldChange(row.id, 'status', e.target.value)}
                              className="tempo-select px-3 py-1.5 rounded-lg text-xs bg-white"
                            >
                              <option value="present">Có mặt</option>
                              <option value="absent_excused">Vắng có phép</option>
                              <option value="absent_unexcused">Vắng không phép</option>
                            </select>
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={draft.note}
                              onChange={(e) => handleHistoryFieldChange(row.id, 'note', e.target.value)}
                              placeholder="Ghi chú (nếu có)"
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveHistoryChanges}
                disabled={historySaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-100 cursor-pointer inline-flex items-center gap-2"
              >
                {historySaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {historySaving ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
