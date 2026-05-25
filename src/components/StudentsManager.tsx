import React, { useState } from 'react';
import { Student, Shift } from '../types';
import { Users, Plus, Edit2, Trash2, Search, Filter, Phone, Mail, Calendar as CalendarIcon, UserCheck, UserX, X, Download } from 'lucide-react';
import { exportStudentsList } from '../utils/csvExport';

interface StudentsManagerProps {
  students: Student[];
  shifts: Shift[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onEditStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
}

export default function StudentsManager({ students, shifts, onAddStudent, onEditStudent, onDeleteStudent }: StudentsManagerProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    setSelectedShifts([]);
    setStatus('active');
    setJoinDate(new Date().toISOString().split('T')[0]);
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
    setIsOpenForm(true);
  };

  const toggleFormShift = (shiftId: string) => {
    if (selectedShifts.includes(shiftId)) {
      setSelectedShifts(selectedShifts.filter(id => id !== shiftId));
    } else {
      setSelectedShifts([...selectedShifts, shiftId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || selectedShifts.length === 0) {
      alert("Vui lòng điền đầy đủ họ tên, số điện thoại và chọn ít nhất 1 ca học!");
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

    const matchesShift =
      selectedShiftFilter === 'all' ||
      (student.shifts && student.shifts.includes(selectedShiftFilter));

    const matchesStatus =
      statusFilter === 'all' ||
      student.status === statusFilter;

    return matchesSearch && matchesShift && matchesStatus;
  });

  const handleExport = () => {
    exportStudentsList(filteredStudents, shifts);
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
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Filter by Shift */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 font-medium appearance-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả ca học ({shifts.length})</option>
            {shifts.map(sh => (
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
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 font-medium appearance-none bg-white cursor-pointer"
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
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Họ và Tên</th>
                  <th className="px-6 py-4">Liên hệ (SĐT / Email)</th>
                  <th className="px-6 py-4">Ngày sinh</th>
                  <th className="px-6 py-4">Lớp chính - Ca đăng ký</th>
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

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-2xs text-slate-400 font-mono mt-0.5">ID: {student.id.substring(0, 8)}</div>
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
                            studentShifts.map((sh: any) => (
                              <span key={sh.id} className="inline-flex px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                                {sh.name} ({sh.course})
                              </span>
                            ))
                          )}
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
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
                    Số Điện Thoại Phụ Huynh / HS *
                  </label>
                  <input
                    type="tel"
                    required
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ngày Sinh
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ngày Nhập Học
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
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
                  <div className="grid grid-cols-1 gap-2 mt-1 border border-slate-100 bg-slate-50/50 p-2.5 rounded-xl max-h-[150px] overflow-y-auto">
                    {shifts.map((sh) => {
                      const isSelected = selectedShifts.includes(sh.id);
                      return (
                        <button
                          type="button"
                          key={sh.id}
                          onClick={() => toggleFormShift(sh.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{sh.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sh.course} - {sh.time}</div>
                          </div>
                          {isSelected && <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100/50 px-1.5 py-0.5 rounded">Đã chọn</span>}
                        </button>
                      );
                    })}
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
    </div>
  );
}
