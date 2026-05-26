import React, { useMemo, useState } from 'react';
import { Shift, Student } from '../types';
import { Calendar, Plus, Edit2, Trash2, Clock, BookOpen, X, Users, LayoutGrid, Table2 } from 'lucide-react';

interface ShiftsManagerProps {
  shifts: Shift[];
  students: Student[];
  onAddShift: (shift: Omit<Shift, 'id' | 'createdAt'>) => Promise<void>;
  onEditShift: (shift: Shift) => Promise<void>;
  onDeleteShift: (id: string) => Promise<void>;
}

const VIETNAMESE_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const DEFAULT_COURSE = 'Piano';
const SLOT_OVERLOAD_THRESHOLD = 1;
const BASE_TIME_SLOTS = [
  '07h30-09h00',
  '08h00-09h00',
  '09h00-10h30',
  '13h30-15h00',
  '15h00-16h30',
  '16h00-17h30',
  '17h00-18h30',
  '18h30-20h00'
];
const CUSTOM_TIME_SLOTS_KEY = 'edutrack_custom_time_slots';

function normalizeTimeFormat(raw: string): string {
  const value = raw.trim();
  if (!value) return '';

  // Convert old style "17:30 - 19:00" to "17h30-19h00" for consistent display.
  return value
    .replace(/\s+/g, '')
    .replace(/:/g, 'h')
    .replace(/H/g, 'h')
    .replace(/–|—/g, '-')
    .replace(/->/g, '-');
}

export default function ShiftsManager({ shifts, students, onAddShift, onEditShift, onDeleteShift }: ShiftsManagerProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [daySearchFilter, setDaySearchFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Form states
  const [time, setTime] = useState(BASE_TIME_SLOTS[2]);
  const [course, setCourse] = useState(DEFAULT_COURSE);
  const [selectedDay, setSelectedDay] = useState<string>('Thứ 2');
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TIME_SLOTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const presetTimeSlots = useMemo(
    () => [...new Set([...BASE_TIME_SLOTS, ...customTimeSlots])],
    [customTimeSlots]
  );
  const suggestedName = `${selectedDay} ${time}`.trim();

  const getShiftCountForSlot = (day: string, slot: string, excludeShiftId?: string): number => {
    const normalizedSlot = normalizeTimeFormat(slot);
    return shifts.filter((shift) => {
      if (excludeShiftId && shift.id === excludeShiftId) return false;
      const shiftDay = shift.weekday || shift.days?.[0] || '';
      return shiftDay === day && normalizeTimeFormat(shift.time) === normalizedSlot;
    }).length;
  };

  const duplicateCount = getShiftCountForSlot(selectedDay, time, editingShift?.id);
  const isDuplicateExactSlot = duplicateCount > 0;
  const filteredShifts = shifts.filter((shift) => {
    if (daySearchFilter === 'all') return true;
    const shiftDay = shift.weekday || shift.days?.[0] || '';
    return shiftDay === daySearchFilter;
  });

  const sortedFilteredShifts = useMemo(() => {
    const getStudentCount = (shiftId: string) => students.filter((st) => st.shifts?.includes(shiftId)).length;

    return [...filteredShifts].sort((a, b) => {
      const countA = getStudentCount(a.id);
      const countB = getStudentCount(b.id);
      if (countA !== countB) return countB - countA;

      // Stable tie-breakers for consistent order when counts are equal.
      const dayA = a.weekday || a.days?.[0] || '';
      const dayB = b.weekday || b.days?.[0] || '';
      if (dayA !== dayB) return dayA.localeCompare(dayB);

      return a.time.localeCompare(b.time);
    });
  }, [filteredShifts, students]);

  const dayThemeClasses: Record<string, { card: string; chip: string; icon: string; count: string }> = {
    'Thứ 2': {
      card: 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white shadow-indigo-100/70',
      chip: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      icon: 'text-indigo-600',
      count: 'text-indigo-700 bg-indigo-100/80 border-indigo-200',
    },
    'Thứ 3': {
      card: 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-white shadow-cyan-100/70',
      chip: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      icon: 'text-cyan-600',
      count: 'text-cyan-700 bg-cyan-100/80 border-cyan-200',
    },
    'Thứ 4': {
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-emerald-100/70',
      chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: 'text-emerald-600',
      count: 'text-emerald-700 bg-emerald-100/80 border-emerald-200',
    },
    'Thứ 5': {
      card: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white shadow-amber-100/70',
      chip: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: 'text-amber-600',
      count: 'text-amber-800 bg-amber-100/80 border-amber-200',
    },
    'Thứ 6': {
      card: 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-white shadow-fuchsia-100/70',
      chip: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
      icon: 'text-fuchsia-600',
      count: 'text-fuchsia-700 bg-fuchsia-100/80 border-fuchsia-200',
    },
    'Thứ 7': {
      card: 'border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white shadow-orange-100/70',
      chip: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: 'text-orange-600',
      count: 'text-orange-700 bg-orange-100/80 border-orange-200',
    },
    'Chủ Nhật': {
      card: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white shadow-rose-100/70',
      chip: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: 'text-rose-600',
      count: 'text-rose-700 bg-rose-100/80 border-rose-200',
    },
  };

  const getThemeByDay = (day: string) => {
    return dayThemeClasses[day] || {
      card: 'border-slate-200 bg-white shadow-slate-100/60',
      chip: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: 'text-slate-500',
      count: 'text-slate-700 bg-slate-100 border-slate-200',
    };
  };

  const handleOpenAdd = () => {
    setEditingShift(null);
    setTime(BASE_TIME_SLOTS[2]);
    setCourse(DEFAULT_COURSE);
    setSelectedDay('Thứ 2');
    setIsOpenForm(true);
  };

  const handleAddCustomTimeSlot = () => {
    const normalizedTime = normalizeTimeFormat(time);
    const timePattern = /^([01]?\d|2[0-3])h[0-5]\d-([01]?\d|2[0-3])h[0-5]\d$/;

    if (!timePattern.test(normalizedTime)) {
      alert('Định dạng giờ chưa đúng. Ví dụ hợp lệ: 10h30-12h00');
      return;
    }

    if (presetTimeSlots.includes(normalizedTime)) {
      alert('Khung giờ này đã có trong danh sách chọn nhanh.');
      setTime(normalizedTime);
      return;
    }

    const updated = [...customTimeSlots, normalizedTime];
    setCustomTimeSlots(updated);
    localStorage.setItem(CUSTOM_TIME_SLOTS_KEY, JSON.stringify(updated));
    setTime(normalizedTime);
    alert('Đã thêm khung giờ mới vào danh sách chọn nhanh.');
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setTime(normalizeTimeFormat(shift.time));
    setCourse(shift.course || DEFAULT_COURSE);
    setSelectedDay(shift.weekday || shift.days?.[0] || 'Thứ 2');
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course.trim() || !selectedDay.trim() || !time.trim()) {
      alert("Vui lòng nhập đầy đủ Thứ học, thời gian ca và Môn học!");
      return;
    }

    const normalizedTime = normalizeTimeFormat(time);
    const generatedName = `${selectedDay} ${normalizedTime}`;

    const conflictCount = getShiftCountForSlot(selectedDay, normalizedTime, editingShift?.id);
    if (conflictCount > 0) {
      alert('Không thể lưu: đã tồn tại ca học trùng chính xác Thứ + Khung giờ.');
      return;
    }

    setLoading(true);
    try {
      if (editingShift) {
        await onEditShift({
          ...editingShift,
          name: generatedName,
          time: normalizedTime,
          course,
          weekday: selectedDay,
          days: [selectedDay]
        });
      } else {
        await onAddShift({
          name: generatedName,
          time: normalizedTime,
          course,
          weekday: selectedDay,
          days: [selectedDay]
        });
      }
      setIsOpenForm(false);
    } catch (err) {
      console.error(err);
      alert("Gặp lỗi khi lưu ca học!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ca học này? Học sinh thuộc ca này vẫn giữ nguyên thông tin nhưng sẽ không xuất hiện trong danh sách ca điểm danh.")) {
      try {
        await onDeleteShift(id);
      } catch (err) {
        console.error(err);
        alert("Gặp lỗi khi xóa ca học!");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-none">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24} />
            Học phần & Ca học ({shifts.length})
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Mỗi ca học tương ứng đúng 1 thứ trong tuần và 1 khung giờ cố định.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer transition-all duration-200"
        >
          <Plus size={16} />
          Tạo Ca Học Mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tìm ca học theo thứ
          </label>
          <select
            value={daySearchFilter}
            onChange={(e) => setDaySearchFilter(e.target.value)}
            className="tempo-select w-full md:w-72 px-3.5 py-2 rounded-xl text-slate-700 text-sm font-medium bg-white"
          >
            <option value="all">Tất cả thứ ({shifts.length} ca)</option>
            {VIETNAMESE_DAYS.map((day) => {
              const count = shifts.filter((shift) => (shift.weekday || shift.days?.[0] || '') === day).length;
              return (
                <option key={day} value={day}>{day} ({count} ca)</option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kiểu hiển thị</span>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <LayoutGrid size={13} />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Table2 size={13} />
              Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Shifts */}
      {shifts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-100 shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="font-semibold text-slate-700 text-lg">Chưa có ca học nào</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Hệ thống hiện chưa ghi nhận dữ liệu ca học. Vui lòng bấm "Tạo Ca Học Mới" phía trên để thiết lập.
          </p>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-100 shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="font-semibold text-slate-700 text-lg">Không có ca học ở {daySearchFilter}</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Thử đổi bộ lọc sang thứ khác hoặc chọn "Tất cả thứ" để xem toàn bộ.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {sortedFilteredShifts.map((shift) => {
            const shiftDay = shift.weekday || shift.days?.[0] || 'Khác';
            const theme = getThemeByDay(shiftDay);
            const studentsInShift = students.filter((st) => st.shifts?.includes(shift.id));
            const activeStudentsInShift = studentsInShift.filter((st) => st.status === 'active');

            return (
            <div
              key={shift.id}
              className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[240px] ${theme.card}`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.chip}`}>
                    {shift.course}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(shift)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-lg mb-2">{shift.name}</h3>

                <div className="space-y-2 text-sm text-slate-600 my-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className={`${theme.icon} shrink-0`} />
                    <span>Lịch học: <strong className="text-slate-700 font-semibold">{shift.time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={`${theme.icon} shrink-0`} />
                    <span className="flex items-center gap-1">
                      Thứ học:
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${theme.chip}`}>
                        {shiftDay}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className={`${theme.icon} shrink-0`} />
                    <span className="text-slate-700">
                      Sĩ số ca: <strong>{studentsInShift.length}</strong> học sinh
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/60 pt-3 mt-4 flex items-center justify-end gap-2 text-2xs">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${theme.count}`}>
                  Đang học: {activeStudentsInShift.length}
                </span>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 border-b border-indigo-300 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Ca học</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Thứ</th>
                  <th className="px-6 py-4">Khung giờ</th>
                  <th className="px-6 py-4 text-right">Sĩ số</th>
                  <th className="px-6 py-4 text-right">Đang học</th>
                  <th className="px-6 py-4 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {sortedFilteredShifts.map((shift) => {
                  const shiftDay = shift.weekday || shift.days?.[0] || 'Khác';
                  const theme = getThemeByDay(shiftDay);
                  const studentsInShift = students.filter((st) => st.shifts?.includes(shift.id));
                  const activeStudentsInShift = studentsInShift.filter((st) => st.status === 'active');

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{shift.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${theme.chip}`}>
                          {shift.course}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{shiftDay}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">{shift.time}</td>
                      <td className="px-6 py-4 text-right font-semibold">{studentsInShift.length}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${theme.count}`}>
                          {activeStudentsInShift.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(shift)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Xóa"
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
        </div>
      )}

      {/* Modal form */}
      {isOpenForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                {editingShift ? "Sửa thông tin ca học" : "Tạo ca học mới"}
              </h3>
              <button
                onClick={() => setIsOpenForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tên ca tự gợi ý
                </label>
                <div className="w-full px-3.5 py-2 border border-indigo-200 bg-indigo-50/60 rounded-xl text-indigo-800 text-sm font-bold">
                  {suggestedName || 'Vui lòng chọn thứ và thời gian'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống sẽ tự đặt tên theo mẫu: "Thứ + Khung giờ" để không cần nhập tay.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Thứ Học Trong Tuần *
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="tempo-select w-full px-3.5 py-2 rounded-xl text-slate-800 text-sm font-medium bg-white"
                  >
                    {VIETNAMESE_DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Môn học / Học phần *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Piano"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Chọn nhanh khung giờ ca
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {presetTimeSlots.map((slot) => {
                    const active = normalizeTimeFormat(time) === normalizeTimeFormat(slot);
                    const count = getShiftCountForSlot(selectedDay, slot, editingShift?.id);
                    const isOverloaded = count >= SLOT_OVERLOAD_THRESHOLD;

                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={`px-2.5 py-2 rounded-lg text-xs text-left border transition-colors cursor-pointer ${
                          active
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : isOverloaded
                            ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Ca {slot}</div>
                        <div className={`text-[10px] mt-0.5 ${isOverloaded ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                          {selectedDay}: {count} ca
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isDuplicateExactSlot && (
                  <p className="text-xs text-rose-600 mt-2 font-semibold">
                    Cảnh báo: Khung giờ này đã có ca học cùng thứ. Hệ thống sẽ chặn lưu để tránh trùng hoàn toàn.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Hoặc nhập thời gian khác (nếu cần)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 10h30-12h00"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomTimeSlot}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                  >
                    + Thêm vào danh sách chọn nhanh
                  </button>
                </div>
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
                  disabled={loading || isDuplicateExactSlot}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {loading ? "Đang lưu..." : "Xác Nhận Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
