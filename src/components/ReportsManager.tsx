import React, { useMemo, useState } from 'react';
import { Attendance, Payment, Shift, Student } from '../types';
import { exportToCSV } from '../utils/csvExport';
import { BarChart3, Download, Users, Calendar, CircleDollarSign, CheckCircle2, TrendingUp, AlertTriangle, Image, X } from 'lucide-react';
import { COURSE_FEE_VND, getStudentCycleProgress } from '../utils/tuitionCycle';
import { downloadStudentAttendanceRangeImage, generateStudentAttendanceRangeImage } from '../utils/canvasReceipt';

interface ReportsManagerProps {
  students: Student[];
  shifts: Shift[];
  attendances: Attendance[];
  payments: Payment[];
}

interface StudentRangeAttendanceRow {
  student: Student;
  totalRecords: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  shiftBreakdown: Array<{ shiftId: string; shiftLabel: string; presentCount: number; totalCount: number }>;
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateVN(isoDate: string) {
  if (!isoDate) return '---';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function ReportsManager({ students, shifts, attendances, payments }: ReportsManagerProps) {
  const [fromDate, setFromDate] = useState<string>(getTodayISO());
  const [toDate, setToDate] = useState<string>(getTodayISO());
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewStudentName, setPreviewStudentName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const stats = useMemo(() => {
    const activeStudents = students.filter((st) => st.status === 'active').length;
    const inactiveStudents = students.length - activeStudents;

    // Align report math with Tuition screen: active students, current cycle only.
    const latestPaymentByStudentCycle = new Map<string, Payment>();
    payments.forEach((payment) => {
      const key = `${payment.studentId}_${payment.cycleIndex || 1}`;
      const prev = latestPaymentByStudentCycle.get(key);

      if (!prev || payment.updatedAt > prev.updatedAt) {
        latestPaymentByStudentCycle.set(key, payment);
      }
    });

    let totalTuitionTarget = 0;
    let totalTuitionCollected = 0;
    let tuitionOutstanding = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    students
      .filter((st) => st.status === 'active')
      .forEach((student) => {
        const progress = getStudentCycleProgress(attendances, student.id);
        const key = `${student.id}_${progress.currentCycleIndex}`;
        const payment = latestPaymentByStudentCycle.get(key);
        const paidRaw = payment?.amountPaid || 0;
        const paid = Math.max(paidRaw, 0);
        const billed = COURSE_FEE_VND;
        const collected = Math.min(paid, billed);
        const debt = Math.max(billed - paid, 0);

        totalTuitionTarget += billed;
        totalTuitionCollected += collected;
        tuitionOutstanding += debt;

        if (paid >= billed) paidCount++;
        else if (paid > 0) partialCount++;
        else unpaidCount++;
      });

    const totalAttendances = attendances.length;
    const totalPresent = attendances.filter((a) => a.status === 'present').length;
    const attendanceRate = totalAttendances > 0 ? Math.round((totalPresent / totalAttendances) * 100) : 0;

    const studentsPerShift = shifts.map((shift) => {
      const count = students.filter((st) => st.shifts?.includes(shift.id) && st.status === 'active').length;
      return {
        shift,
        activeStudents: count,
      };
    });

    const busiestShift = studentsPerShift.sort((a, b) => b.activeStudents - a.activeStudents)[0];

    return {
      activeStudents,
      inactiveStudents,
      totalStudents: students.length,
      totalShifts: shifts.length,
      totalTuitionTarget,
      totalTuitionCollected,
      tuitionOutstanding,
      paidCount,
      partialCount,
      unpaidCount,
      totalAttendances,
      attendanceRate,
      studentsPerShift,
      busiestShift,
    };
  }, [students, shifts, attendances, payments]);

  const rangeAttendances = useMemo(() => {
    const start = fromDate <= toDate ? fromDate : toDate;
    const end = fromDate <= toDate ? toDate : fromDate;

    return attendances.filter((att) => att.date >= start && att.date <= end);
  }, [attendances, fromDate, toDate]);

  const rangeRows = useMemo<StudentRangeAttendanceRow[]>(() => {
    const studentMap = new Map<string, Student>();
    students.forEach((student) => {
      studentMap.set(student.id, student);
    });

    const byStudent = new Map<string, Attendance[]>();
    rangeAttendances.forEach((att) => {
      const list = byStudent.get(att.studentId) || [];
      list.push(att);
      byStudent.set(att.studentId, list);
    });

    const rows: StudentRangeAttendanceRow[] = [];

    byStudent.forEach((records, studentId) => {
      const student = studentMap.get(studentId);
      if (!student) return;

      const presentRecords = records.filter((r) => r.status === 'present');
      const excusedCount = records.filter((r) => r.status === 'absent_excused').length;
      const unexcusedCount = records.filter((r) => r.status === 'absent_unexcused').length;

      const shiftCounts = new Map<string, { totalCount: number; presentCount: number }>();
      records.forEach((record) => {
        const current = shiftCounts.get(record.shiftId) || { totalCount: 0, presentCount: 0 };
        current.totalCount += 1;
        if (record.status === 'present') current.presentCount += 1;
        shiftCounts.set(record.shiftId, current);
      });

      const shiftBreakdown = Array.from(shiftCounts.entries())
        .map(([shiftId, value]) => {
          const shift = shifts.find((s) => s.id === shiftId);
          const schedule = shift ? `${shift.weekday || shift.days?.[0] || 'N/A'} ${shift.time}` : '';
          return {
            shiftId,
            shiftLabel: shift ? `${shift.name}${schedule ? ` - ${schedule}` : ''}` : shiftId,
            presentCount: value.presentCount,
            totalCount: value.totalCount,
          };
        })
        .sort((a, b) => {
          if (b.presentCount !== a.presentCount) return b.presentCount - a.presentCount;
          return b.totalCount - a.totalCount;
        });

      rows.push({
        student,
        totalRecords: records.length,
        presentCount: presentRecords.length,
        excusedCount,
        unexcusedCount,
        shiftBreakdown,
      });
    });

    return rows.sort((a, b) => {
      if (b.presentCount !== a.presentCount) return b.presentCount - a.presentCount;
      return a.student.name.localeCompare(b.student.name);
    });
  }, [rangeAttendances, students, shifts]);

  const rangeSummary = useMemo(() => {
    let totalPresent = 0;
    let totalExcused = 0;
    let totalUnexcused = 0;

    rangeRows.forEach((row) => {
      totalPresent += row.presentCount;
      totalExcused += row.excusedCount;
      totalUnexcused += row.unexcusedCount;
    });

    return {
      studentsWithRecords: rangeRows.length,
      totalRecords: rangeAttendances.length,
      totalPresent,
      totalExcused,
      totalUnexcused,
    };
  }, [rangeRows, rangeAttendances]);

  const handleExportReport = () => {
    const headers = ['Hạng mục', 'Giá trị'];
    const rows: string[][] = [
      ['Tổng số học sinh', String(stats.totalStudents)],
      ['Học sinh đang học', String(stats.activeStudents)],
      ['Học sinh đã nghỉ', String(stats.inactiveStudents)],
      ['Tổng số ca học', String(stats.totalShifts)],
      ['Tổng lượt điểm danh', String(stats.totalAttendances)],
      ['Tỷ lệ chuyên cần chung', `${stats.attendanceRate}%`],
      ['Tổng học phí cần thu', `${stats.totalTuitionTarget.toLocaleString()} đ`],
      ['Tổng học phí đã thu', `${stats.totalTuitionCollected.toLocaleString()} đ`],
      ['Tổng học phí còn nợ', `${stats.tuitionOutstanding.toLocaleString()} đ`],
      ['Số phiếu học phí đã đủ', String(stats.paidCount)],
      ['Số phiếu học phí đóng một phần', String(stats.partialCount)],
      ['Số phiếu học phí chưa đủ', String(stats.unpaidCount)],
      ['Ca đông nhất', stats.busiestShift ? `${stats.busiestShift.shift.name} (${stats.busiestShift.activeStudents} HS)` : 'N/A'],
      ['', ''],
      ['Chi tiết sĩ số theo ca', ''],
      ...stats.studentsPerShift.map((row) => [
        `${row.shift.name} - ${row.shift.weekday || row.shift.days?.[0] || 'N/A'} ${row.shift.time}`,
        `${row.activeStudents} học sinh`,
      ]),
    ];

    exportToCSV('Bao_Cao_Thong_Ke_Tempo', headers, rows);
  };

  const handleExportRangeCSV = () => {
    const headers = ['Học sinh', 'SĐT', 'Tổng điểm danh', 'Số buổi có mặt', 'Vắng phép', 'Vắng KP', 'Ca học trong khoảng'];

    const rows = rangeRows.map((row) => [
      row.student.name,
      row.student.phone || '',
      String(row.totalRecords),
      String(row.presentCount),
      String(row.excusedCount),
      String(row.unexcusedCount),
      row.shiftBreakdown.map((s) => `${s.shiftLabel} (${s.presentCount}/${s.totalCount})`).join('; '),
    ]);

    exportToCSV(`BaoCao_DiemDanh_${fromDate}_${toDate}`, headers, rows);
  };

  const handlePreviewStudentImage = (row: StudentRangeAttendanceRow) => {
    const dataUrl = generateStudentAttendanceRangeImage({
      studentName: row.student.name,
      phone: row.student.phone || '',
      fromDate,
      toDate,
      totalRecords: row.totalRecords,
      presentCount: row.presentCount,
      excusedCount: row.excusedCount,
      unexcusedCount: row.unexcusedCount,
      shiftBreakdown: row.shiftBreakdown.map((shift) => ({
        shiftLabel: shift.shiftLabel,
        presentCount: shift.presentCount,
        totalCount: shift.totalCount,
      })),
    });

    setPreviewImageUrl(dataUrl);
    setPreviewStudentName(row.student.name);
    setPreviewFileName(`BaoCao_DiemDanh_${row.student.name.replace(/\s+/g, '_')}_${fromDate}_${toDate}.png`);
    setIsPreviewOpen(true);
  };

  const handleDownloadPreview = () => {
    downloadStudentAttendanceRangeImage(previewImageUrl, previewFileName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={24} />
            Báo cáo thống kê tổng hợp
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp học phí, số lượng học sinh, số ca học và các chỉ số vận hành quan trọng.
          </p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
        >
          <Download size={16} />
          Xuất dữ liệu báo cáo (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Tổng học sinh</span>
            <Users className="text-indigo-600" size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalStudents}</div>
          <div className="text-xs text-slate-600 mt-1">Đang học: {stats.activeStudents} | Nghỉ: {stats.inactiveStudents}</div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Tổng ca học</span>
            <Calendar className="text-cyan-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalShifts}</div>
          <div className="text-xs text-slate-600 mt-1">
            {stats.busiestShift
              ? `Ca đông nhất: ${stats.busiestShift.shift.name} (${stats.busiestShift.activeStudents} HS)`
              : 'Chưa có dữ liệu ca học'}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Học phí đã thu</span>
            <CircleDollarSign className="text-emerald-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalTuitionCollected.toLocaleString()} đ</div>
          <div className="text-xs text-slate-600 mt-1">Mục tiêu: {stats.totalTuitionTarget.toLocaleString()} đ</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Học phí còn nợ</span>
            <AlertTriangle className="text-amber-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.tuitionOutstanding.toLocaleString()} đ</div>
          <div className="text-xs text-slate-600 mt-1">Đã đủ: {stats.paidCount} | Một phần: {stats.partialCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <CheckCircle2 className="text-indigo-600" size={18} />
            Thống kê chuyên cần
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Tổng lượt điểm danh</span>
              <strong>{stats.totalAttendances}</strong>
            </div>
            <div className="flex justify-between">
              <span>Tỷ lệ có mặt chung</span>
              <strong>{stats.attendanceRate}%</strong>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={18} />
            Tình trạng học phí
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Phiếu đã đóng đủ</span>
              <strong>{stats.paidCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Phiếu đóng một phần</span>
              <strong>{stats.partialCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Phiếu chưa đủ/chưa đóng</span>
              <strong>{stats.unpaidCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">Thống kê điểm danh theo khoảng ngày</h3>
            <p className="text-xs text-slate-500 mt-1">
              Chọn từ ngày đến ngày để xem mỗi học sinh đã học bao nhiêu buổi, ca nào, và xuất ảnh báo cáo.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={handleExportRangeCSV}
              className="h-9 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              Xuất CSV khoảng ngày
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 text-xs text-slate-600 flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">Khoảng: {formatDateVN(fromDate)} {'->'} {formatDateVN(toDate)}</span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">Học sinh có dữ liệu: {rangeSummary.studentsWithRecords}</span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">Tổng điểm danh: {rangeSummary.totalRecords}</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Có mặt: {rangeSummary.totalPresent}</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">Vắng phép: {rangeSummary.totalExcused}</span>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">Vắng KP: {rangeSummary.totalUnexcused}</span>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[1020px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Học sinh</th>
                <th className="px-6 py-3 text-right">Tổng điểm danh</th>
                <th className="px-6 py-3 text-right">Đã học</th>
                <th className="px-6 py-3 text-right">Vắng phép</th>
                <th className="px-6 py-3 text-right">Vắng KP</th>
                <th className="px-6 py-3">Ca học trong khoảng</th>
                <th className="px-6 py-3 text-center">Ảnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {rangeRows.map((row, index) => (
                <tr key={row.student.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-indigo-50/40 align-top`}>
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-800">{row.student.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.student.phone || '---'}</div>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-slate-800">{row.totalRecords}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-700">{row.presentCount}</td>
                  <td className="px-6 py-3 text-right font-semibold text-amber-700">{row.excusedCount}</td>
                  <td className="px-6 py-3 text-right font-semibold text-rose-700">{row.unexcusedCount}</td>
                  <td className="px-6 py-3 text-xs text-slate-600">
                    {row.shiftBreakdown.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.shiftBreakdown.slice(0, 3).map((shift) => (
                          <span key={`${row.student.id}_${shift.shiftId}`} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                            {shift.shiftLabel} ({shift.presentCount}/{shift.totalCount})
                          </span>
                        ))}
                        {row.shiftBreakdown.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                            +{row.shiftBreakdown.length - 3} ca
                          </span>
                        )}
                      </div>
                    ) : (
                      '---'
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handlePreviewStudentImage(row)}
                      className="h-8 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title="Xem trước ảnh báo cáo cho học sinh"
                    >
                      <Image size={13} />
                      Xem ảnh
                    </button>
                  </td>
                </tr>
              ))}

              {rangeRows.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={7}>
                    Không có dữ liệu điểm danh trong khoảng ngày đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Sĩ số theo ca học</h3>
          <span className="text-xs text-slate-500">{stats.studentsPerShift.length} ca</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Ca học</th>
                <th className="px-6 py-3">Thứ</th>
                <th className="px-6 py-3">Giờ</th>
                <th className="px-6 py-3">Môn</th>
                <th className="px-6 py-3 text-right">HS đang học</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {stats.studentsPerShift.map((row) => (
                <tr key={row.shift.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-semibold text-slate-800">{row.shift.name}</td>
                  <td className="px-6 py-3">{row.shift.weekday || row.shift.days?.[0] || 'N/A'}</td>
                  <td className="px-6 py-3 font-mono text-xs">{row.shift.time}</td>
                  <td className="px-6 py-3">{row.shift.course}</td>
                  <td className="px-6 py-3 text-right font-bold text-indigo-700">{row.activeStudents}</td>
                </tr>
              ))}
              {stats.studentsPerShift.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500" colSpan={5}>
                    Chưa có dữ liệu ca học để thống kê.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Xem trước ảnh báo cáo</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {previewStudentName} | Khoảng: {formatDateVN(fromDate)} {'->'} {formatDateVN(toDate)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center cursor-pointer"
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt="Xem trước ảnh báo cáo điểm danh"
                  className="w-full h-auto rounded-xl border border-slate-200 shadow-sm bg-white"
                />
              ) : (
                <div className="text-center text-slate-500 text-sm py-10">Không thể tạo ảnh xem trước.</div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleDownloadPreview}
                className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Tải ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
