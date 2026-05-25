import React, { useState } from 'react';
import { Shift } from '../types';
import { Calendar, Plus, Edit2, Trash2, Clock, BookOpen, DollarSign, X } from 'lucide-react';

interface ShiftsManagerProps {
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id' | 'createdAt'>) => Promise<void>;
  onEditShift: (shift: Shift) => Promise<void>;
  onDeleteShift: (id: string) => Promise<void>;
}

const VIETNAMESE_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

export default function ShiftsManager({ shifts, onAddShift, onEditShift, onDeleteShift }: ShiftsManagerProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [time, setTime] = useState('17:30 - 19:00');
  const [course, setCourse] = useState('');
  const [fee, setFee] = useState<number>(500000);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setEditingShift(null);
    setName('');
    setTime('17:30 - 19:00');
    setCourse('');
    setFee(500000);
    setSelectedDays([]);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setName(shift.name);
    setTime(shift.time);
    setCourse(shift.course);
    setFee(shift.fee);
    setSelectedDays(shift.days || []);
    setIsOpenForm(true);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !course.trim() || selectedDays.length === 0) {
      alert("Vui lòng nhập đầy đủ Tên ca học, Môn học và chọn ít nhất 1 thứ học!");
      return;
    }

    setLoading(true);
    try {
      if (editingShift) {
        await onEditShift({
          ...editingShift,
          name,
          time,
          course,
          fee,
          days: selectedDays
        });
      } else {
        await onAddShift({
          name,
          time,
          course,
          fee,
          days: selectedDays
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
            Quản lý kế hoạch ca học, lịch diễn ra hàng tuần và mức phí áp dụng cho từng học phần.
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

      {/* Grid of Shifts */}
      {shifts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-100 shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="font-semibold text-slate-700 text-lg">Chưa có ca học nào</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Hệ thống hiện chưa ghi nhận dữ liệu ca học. Vui lòng bấm "Tạo Ca Học Mới" phía trên để thiết lập.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift) => (
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
                    <span className="flex flex-wrap gap-1 items-center">
                      Ngày học:
                      {shift.days?.map(day => (
                        <span key={day} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600 font-medium">
                          {day}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-slate-400 shrink-0" />
                    <span>Học phí: <strong className="text-slate-700 font-bold">{(shift.fee || 0).toLocaleString()} VNĐ</strong> / tháng</span>
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
                  Tên Ca Học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ca Sáng Thứ 2-4-6"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Thời Gian Học
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 17:30 - 19:00"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Môn học / Học phần *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Toán 10"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Học Phí Tính Theo Tháng (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Ví dụ: 800000"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Lịch Học Trong Tuần *
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {VIETNAMESE_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
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
                  disabled={loading}
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
