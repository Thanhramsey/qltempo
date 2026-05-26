import React, { useMemo, useState } from 'react';
import { Shift } from '../types';
import { Calendar, Plus, Edit2, Trash2, Clock, BookOpen, X } from 'lucide-react';

interface ShiftsManagerProps {
  shifts: Shift[];
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

export default function ShiftsManager({ shifts, onAddShift, onEditShift, onDeleteShift }: ShiftsManagerProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [daySearchFilter, setDaySearchFilter] = useState<string>('all');

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

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Tìm ca học theo thứ
        </label>
        <select
          value={daySearchFilter}
          onChange={(e) => setDaySearchFilter(e.target.value)}
          className="w-full md:w-72 px-3.5 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 font-medium bg-white"
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
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
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span>Lịch học: <strong className="text-slate-700 font-semibold">{shift.time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <span className="flex items-center gap-1">
                      Thứ học:
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600 font-medium">
                        {shift.weekday || shift.days?.[0] || 'Chưa chọn'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 mt-4 text-slate-400 text-2xs">
                Mã ca học: {shift.id.substring(0, 8)}
              </div>
            </div>
          ))}
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
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium bg-white"
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
