import React, { useState, useEffect } from 'react';
import { Shift, Student, Attendance, AttendanceStatus } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle, Save, Download, Loader2, RefreshCw, Printer, FileText } from 'lucide-react';
import { exportAttendanceReport } from '../utils/csvExport';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface AttendanceTrackerProps {
  shifts: Shift[];
  students: Student[];
  attendances: Attendance[];
  onSaveAttendance: (attendanceData: Omit<Attendance, 'updatedAt'>[]) => Promise<void>;
  loadingAttendances: boolean;
  onRefreshAttendances: () => Promise<void>;
}

export default function AttendanceTracker({
  shifts,
  students,
  attendances,
  onSaveAttendance,
  loadingAttendances,
  onRefreshAttendances
}: AttendanceTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [localStatuses, setLocalStatuses] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [saving, setSaving] = useState(false);

  const parseDateString = (value: string): Date | null => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const formatDateString = (date: Date | null): string => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const DATE_TO_WEEKDAY: Record<number, string> = {
    0: 'Chủ Nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
  };

  const getWeekdayFromDate = (dateText: string): string => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return 'Không xác định';
    return DATE_TO_WEEKDAY[date.getDay()] || 'Không xác định';
  };

  const selectedWeekday = getWeekdayFromDate(selectedDate);
  const dayShifts = shifts.filter((shift) => {
    const shiftDay = shift.weekday || shift.days?.[0] || '';
    return shiftDay === selectedWeekday;
  });

  // Default select first shift when shifts load
  useEffect(() => {
    if (dayShifts.length > 0 && !selectedShiftId) {
      setSelectedShiftId(dayShifts[0].id);
    }
  }, [dayShifts, selectedShiftId]);

  // Ensure selected shift always belongs to selected weekday.
  useEffect(() => {
    if (dayShifts.length === 0) {
      setSelectedShiftId('');
      return;
    }

    const stillValid = dayShifts.some((shift) => shift.id === selectedShiftId);
    if (!stillValid) {
      setSelectedShiftId(dayShifts[0].id);
    }
  }, [selectedDate, dayShifts, selectedShiftId]);

  // Load existing records from Firebase whenever Date or ShiftId changes
  const activeShift = shifts.find(sh => sh.id === selectedShiftId);
  const registeredStudents = students.filter(student => 
    student.shifts && student.shifts.includes(selectedShiftId) && student.status === 'active'
  );

  useEffect(() => {
    if (!selectedShiftId || !selectedDate) return;

    const initialStatuses: Record<string, { status: AttendanceStatus; note: string }> = {};
    
    registeredStudents.forEach(st => {
      // Find matching attendance record
      const match = attendances.find(att => 
        att.date === selectedDate && 
        att.shiftId === selectedShiftId && 
        att.studentId === st.id
      );

      if (match) {
        initialStatuses[st.id] = {
          status: match.status,
          note: match.note || ''
        };
      } else {
        // Default to 'present' for easy attendance checking
        initialStatuses[st.id] = {
          status: 'present',
          note: ''
        };
      }
    });

    setLocalStatuses(initialStatuses);
  }, [selectedDate, selectedShiftId, attendances, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setLocalStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const handleCheckAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    registeredStudents.forEach((st) => {
      updated[st.id] = {
        status: 'present',
        note: localStatuses[st.id]?.note || ''
      };
    });
    setLocalStatuses(updated);
  };

  const handleCheckAllAbsentExcused = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    registeredStudents.forEach((st) => {
      updated[st.id] = {
        status: 'absent_excused',
        note: localStatuses[st.id]?.note || ''
      };
    });
    setLocalStatuses(updated);
  };

  const handleSave = async () => {
    if (!selectedShiftId) return;
    setSaving(true);
    try {
      const recordsToSave = registeredStudents.map(st => {
        const local = localStatuses[st.id] || { status: 'present', note: '' };
        return {
          id: `${selectedDate}_${selectedShiftId}_${st.id}`,
          date: selectedDate,
          shiftId: selectedShiftId,
          studentId: st.id,
          status: local.status,
          note: local.note
        };
      });

      await onSaveAttendance(recordsToSave);
      alert("Đã lưu bảng điểm danh thành công lên hệ thống!");
    } catch (err) {
      console.error(err);
      alert("Không thể lưu điểm danh. Thẻ kiểm tra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (!activeShift) return;
    const currentRecords = registeredStudents.map(st => {
      const local = localStatuses[st.id] || { status: 'present', note: '' };
      return {
        studentId: st.id,
        status: local.status,
        note: local.note
      };
    });
    exportAttendanceReport(selectedDate, activeShift.name, registeredStudents, currentRecords);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Stats helper
  const totalStudents = registeredStudents.length;
  const presentCount = registeredStudents.filter(st => {
    return (localStatuses[st.id]?.status === 'present');
  }).length;
  const excusedCount = registeredStudents.filter(st => {
    return (localStatuses[st.id]?.status === 'absent_excused');
  }).length;
  const unexcusedCount = registeredStudents.filter(st => {
    return (localStatuses[st.id]?.status === 'absent_unexcused');
  }).length;

  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Attendance Picker Block */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="text-indigo-600" size={24} />
            Điểm danh & Chuyên cần hàng ngày
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Chọn một ca học trong ngày để thực hiện điểm danh, theo dõi nhanh chỉ số đến lớp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={onRefreshAttendances}
            disabled={loadingAttendances}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Đồng bộ lại"
          >
            <RefreshCw size={16} className={loadingAttendances ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            <Printer size={16} />
            In Báo Cáo (PDF)
          </button>
          <button
            onClick={handleExportExcel}
            disabled={totalStudents === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Date & Shift Picker Selection Row */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Bước 1: Chọn ngày học
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <DatePicker
              selected={parseDateString(selectedDate)}
              onChange={(date) => setSelectedDate(formatDateString(date as Date | null))}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày học"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              yearDropdownItemNumber={20}
              wrapperClassName="w-full"
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            Thứ của ngày đã chọn: {selectedWeekday}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Bước 2: Chọn Ca học theo {selectedWeekday} ({dayShifts.length})
          </label>
          <select
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            disabled={dayShifts.length === 0}
            className="tempo-select w-full px-4 py-2.5 rounded-xl text-slate-800 font-bold bg-white cursor-pointer disabled:opacity-60"
          >
            <option value="" disabled>
              {dayShifts.length === 0 ? '--- Không có ca học cho ngày này ---' : '--- Vui lòng chọn ca học ---'}
            </option>
            {dayShifts.map(sh => (
              <option key={sh.id} value={sh.id}>
                {sh.name} - Môn: {sh.course} ({sh.time})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Print-only layout header */}
      <div className="hidden print:block bg-white p-6 border-b border-slate-300 mb-6 font-sans">
        <h1 className="text-2xl font-bold text-center text-slate-900 uppercase">BÁO CÁO ĐIỂM DANH LỚP HỌC</h1>
        <div className="grid grid-cols-2 mt-4 text-sm text-slate-700 font-medium max-w-xl mx-auto space-y-1">
          <div>Ngày điểm danh: <span className="font-bold">{selectedDate.split('-').reverse().join('/')}</span></div>
          <div>Môn học: <span className="font-bold">{activeShift?.course}</span></div>
          <div>Tên ca học: <span className="font-bold">{activeShift?.name}</span></div>
          <div>Giờ học: <span className="font-bold">{activeShift?.time}</span></div>
        </div>
      </div>

      {/* Stats micro widget */}
      {selectedShiftId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Tổng số học sinh ca</span>
            <span className="text-2xl font-bold text-slate-800 mt-1">{totalStudents}</span>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center">
            <span className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">Đi học (Có mặt)</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1">{presentCount}</span>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-center">
            <span className="text-2xs font-bold text-amber-600 uppercase tracking-wider">Vắng (Có phép)</span>
            <span className="text-2xl font-bold text-amber-700 mt-1">{excusedCount}</span>
          </div>

          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-center">
            <span className="text-2xs font-bold text-rose-600 uppercase tracking-wider">Vắng (Không phép)</span>
            <span className="text-2xl font-bold text-rose-700 mt-1">{unexcusedCount}</span>
          </div>
        </div>
      )}

      {/* Attendance Matrix Check Students */}
      {selectedShiftId && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 print:hidden bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-base">
                Danh sách học sinh trong ca: <span className="text-indigo-600 font-extrabold">{totalStudents}</span> học sinh
              </span>
              {totalStudents > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  attendanceRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Chuyên cần: {attendanceRate}%
                </span>
              )}
            </div>
          </div>

          {totalStudents === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="mx-auto text-slate-200 mb-3" size={48} />
              <h3 className="font-semibold text-slate-700 text-lg">Không có học sinh nào trong ca này</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Hiện tại không có học sinh nào hoạt động được tuyển chọn ghi danh vào ca <span className="text-indigo-600 font-bold">"{activeShift?.name}"</span>. 
                Vui lòng vào tab "Học sinh" để ghi danh học sinh học ca này.
              </p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 border-b border-indigo-300 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                      <th className="px-6 py-4">Tên học sinh</th>
                      <th className="px-6 py-4">Số điện thoại</th>
                      <th className="px-6 py-4 text-center print:hidden">Có mặt</th>
                      <th className="px-6 py-4 text-center print:hidden">Vắng phép</th>
                      <th className="px-6 py-4 text-center print:hidden">Vắng KP</th>
                      <th className="px-6 py-4 hidden print:table-cell text-center">Trạng thái điểm danh</th>
                      <th className="px-6 py-4">Ghi chú nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {registeredStudents.map((st) => {
                      const local = localStatuses[st.id] || { status: 'present', note: '' };
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold text-sm shadow-xs">
                              {st.name}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-600 font-medium">
                            {st.phone}
                          </td>

                          {/* Present Column - Checkbox Circle */}
                          <td className="px-6 py-3.5 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'present')}
                              className={`h-9 w-9 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                                local.status === 'present'
                                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20 scale-105'
                                  : 'bg-slate-50 text-slate-300 hover:text-slate-400'
                              }`}
                              title="Có mặt"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          </td>

                          {/* Absent excused Column */}
                          <td className="px-6 py-3.5 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'absent_excused')}
                              className={`h-9 w-9 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                                local.status === 'absent_excused'
                                  ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20 scale-105'
                                  : 'bg-slate-50 text-slate-300 hover:text-slate-400'
                              }`}
                              title="Vắng có phép"
                            >
                              <AlertCircle size={20} />
                            </button>
                          </td>

                          {/* Absent unexcused Column */}
                          <td className="px-6 py-3.5 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'absent_unexcused')}
                              className={`h-9 w-9 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                                local.status === 'absent_unexcused'
                                  ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500/20 scale-105'
                                  : 'bg-slate-50 text-slate-300 hover:text-slate-400'
                              }`}
                              title="Vắng không phép"
                            >
                              <XCircle size={20} />
                            </button>
                          </td>

                          {/* Print column render status */}
                          <td className="px-6 py-3.5 hidden print:table-cell text-center font-semibold">
                            {local.status === 'present' && "Có mặt (P)"}
                            {local.status === 'absent_excused' && "Vắng có phép (CP)"}
                            {local.status === 'absent_unexcused' && "Vắng không phép (KP)"}
                          </td>

                          {/* Notes column */}
                          <td className="px-6 py-3.5">
                            <input
                              type="text"
                              value={local.note}
                              onChange={(e) => handleNoteChange(st.id, e.target.value)}
                              placeholder="Thêm lý do, ghi chú phép..."
                              className="w-full px-3 py-1.5 border border-slate-200 focus:border-indigo-400 focus:outline-none rounded-lg text-xs font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Attendance quick save bottom strip bar */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center print:hidden">
                <span className="text-xs text-slate-400 font-medium">
                  Hãy nhấn lưu để cập nhật thông tin điểm danh của ngày và ca học này.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheckAllPresent}
                    disabled={totalStudents === 0 || saving}
                    className="flex items-center gap-2 px-4 py-2.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm cursor-pointer transition-all duration-200 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    Check All Có Mặt
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckAllAbsentExcused}
                    disabled={totalStudents === 0 || saving}
                    className="flex items-center gap-2 px-4 py-2.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-sm cursor-pointer transition-all duration-200 disabled:opacity-50"
                  >
                    <AlertCircle size={16} />
                    Check All Vắng (Có phép)
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 cursor-pointer transition-all duration-200"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang thực hiện lưu...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Lưu Bảng Điểm Danh
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
