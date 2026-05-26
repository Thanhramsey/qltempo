import React, { useMemo } from 'react';
import { Attendance, Payment, Shift, Student } from '../types';
import { exportToCSV } from '../utils/csvExport';
import { BarChart3, Download, Users, Calendar, CircleDollarSign, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface ReportsManagerProps {
  students: Student[];
  shifts: Shift[];
  attendances: Attendance[];
  payments: Payment[];
}

export default function ReportsManager({ students, shifts, attendances, payments }: ReportsManagerProps) {
  const stats = useMemo(() => {
    const activeStudents = students.filter((st) => st.status === 'active').length;
    const inactiveStudents = students.length - activeStudents;

    const totalTuitionTarget = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalTuitionCollected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const tuitionOutstanding = Math.max(totalTuitionTarget - totalTuitionCollected, 0);

    const paidCount = payments.filter((p) => p.status === 'paid' || p.amountPaid >= p.totalAmount).length;
    const partialCount = payments.filter((p) => p.status === 'partial').length;
    const unpaidCount = Math.max(payments.length - paidCount - partialCount, 0);

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
    </div>
  );
}
