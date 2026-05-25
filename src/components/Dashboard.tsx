import React from 'react';
import { Shift, Student, Attendance } from '../types';
import { LayoutDashboard, Users, Calendar, HelpCircle, CheckCircle, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';

interface DashboardProps {
  shifts: Shift[];
  students: Student[];
  attendances: Attendance[];
  onSetTab: (tab: string) => void;
}

export default function Dashboard({ shifts, students, attendances, onSetTab }: DashboardProps) {
  // 1. Calculations
  const activeStudents = students.filter(st => st.status === 'active');
  const inactiveStudents = students.filter(st => st.status === 'inactive');

  // Let's check attendance rates for the last 7 days or by shift
  // Group attendance records by date
  const recordsByDate: Record<string, { present: number; total: number }> = {};
  attendances.forEach(att => {
    if (!recordsByDate[att.date]) {
      recordsByDate[att.date] = { present: 0, total: 0 };
    }
    recordsByDate[att.date].total += 1;
    if (att.status === 'present') {
      recordsByDate[att.date].present += 1;
    }
  });

  const uniqueDates = Object.keys(recordsByDate).sort().slice(-5); // take last 5 dates
  const chartDataDates = uniqueDates.map(date => {
    const records = recordsByDate[date];
    const rate = records.total > 0 ? Math.round((records.present / records.total) * 100) : 0;
    return {
      date: date.split('-').reverse().slice(0, 2).join('/'), // DD/MM representation
      rate,
      present: records.present,
      total: records.total
    };
  });

  // Group attendance by Shift
  const recordsByShift: Record<string, { present: number; total: number }> = {};
  attendances.forEach(att => {
    if (!recordsByShift[att.shiftId]) {
      recordsByShift[att.shiftId] = { present: 0, total: 0 };
    }
    recordsByShift[att.shiftId].total += 1;
    if (att.status === 'present') {
      recordsByShift[att.shiftId].present += 1;
    }
  });

  const shiftChartData = shifts.map(sh => {
    const record = recordsByShift[sh.id] || { present: 0, total: 0 };
    const rate = record.total > 0 ? Math.round((record.present / record.total) * 100) : 0;
    return {
      id: sh.id,
      name: sh.name,
      course: sh.course,
      rate,
      totalCount: record.total
    };
  });

  // Calculate overall attendance rate
  const totalAttendances = attendances.length;
  const totalPresent = attendances.filter(a => a.status === 'present').length;
  const overallAttendanceRate = totalAttendances > 0 ? Math.round((totalPresent / totalAttendances) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview stats cards container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Students Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Học sinh đang học</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{activeStudents.length}</span>
            <span className="text-3xs text-slate-400 block mt-1">Đã nghỉ học: {inactiveStudents.length} học sinh</span>
          </div>
        </div>

        {/* Classes Shifts Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Số lượng ca học</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{shifts.length}</span>
            <span className="text-3xs text-slate-400 block mt-1">Lớp tuyển chọn hoạt động</span>
          </div>
        </div>

        {/* Global Attendances Recorded Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Lượt điểm danh</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{totalAttendances}</span>
            <span className="text-3xs text-emerald-600 font-semibold block mt-1">Hoàn thành lưu trữ</span>
          </div>
        </div>

        {/* Cumulative Attendance Rate Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Chuyên cần chung</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{overallAttendanceRate}%</span>
            <span className="text-3xs text-slate-400 block mt-1">Tỉ lệ đi học tích lũy</span>
          </div>
        </div>
      </div>

      {/* Dual Column Layout: Charts & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Attendance Charts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Biểu đồ chuyên cần lớp học</h3>
            <p className="text-xs text-slate-500 mt-0.5">Biểu đồ biểu thị tỉ lệ có mặt học sinh theo từng ngày (Dữ liệu 5 ngày gần nhất).</p>
          </div>

          {chartDataDates.length === 0 ? (
            <div className="h-[250px] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <AlertCircle size={28} className="mb-2" />
              <span className="text-xs font-semibold">Chưa có dữ liệu điểm danh</span>
              <span className="text-3xs mt-1">Bấm nút qua tab Điểm danh để ghi nhận ngay.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {chartDataDates.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Ngày {item.date}</span>
                    <span>{item.rate}% có mặt ({item.present}/{item.total} học sinh)</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                    <div
                      style={{ width: `${item.rate}%` }}
                      className="bg-indigo-600 h-full rounded-r-sm transition-all duration-500"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Shift Performance rates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Tỉ lệ sỹ số đi học theo Ca học</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chỉ số thực tế về chuyên cần phân tích trên mỗi ca học.</p>
          </div>

          {shifts.length === 0 ? (
            <div className="h-[250px] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Calendar size={28} className="mb-2" />
              <span className="text-xs font-semibold">Chưa có ca học nào hoạt động</span>
            </div>
          ) : (
            <div className="space-y-4.5 max-h-[280px] overflow-y-auto pr-1">
              {shiftChartData.map((sh, idx) => {
                const studentsInShift = students.filter(st => st.shifts?.includes(sh.id) && st.status === 'active');
                return (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-700 text-sm block">{sh.name}</span>
                      <span className="text-3xs text-slate-400 font-medium block mt-0.5">
                        Môn học: <strong className="text-slate-600">{sh.course}</strong> | Sỹ số: <strong className="text-indigo-600">{studentsInShift.length} HS</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-md ${
                        sh.totalCount === 0
                          ? 'bg-slate-100 text-slate-500'
                          : sh.rate >= 80
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sh.totalCount === 0 ? "Chưa điểm danh" : `Chuyên cần: ${sh.rate}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access panel widgets */}
      <div className="bg-indigo-900 text-indigo-100 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <h3 className="font-bold text-xl text-white">Bạn muốn bắt đầu việc gì tiếp theo?</h3>
          <p className="text-xs text-indigo-200 max-w-lg">
            Hệ thống hỗ trợ điểm danh học sinh dễ dàng, thu chi học phí tiện lợi, xuất biên lai thanh toán trực quan cùng báo cáo xuất xứ ngay lập tức.
          </p>
        </div>

        <div className="flex gap-3 relative z-10 shrink-0">
          <button
            onClick={() => onSetTab('attendance')}
            className="px-4 py-2 bg-white text-indigo-900 font-bold rounded-xl text-xs shadow-md shadow-indigo-950/20 active:scale-95 transition-all cursor-pointer"
          >
            Vào Điểm Danh Ca Học
          </button>
          <button
            onClick={() => onSetTab('tuition')}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
          >
            Kiểm tra Học Phí
          </button>
        </div>

        {/* Decorative ambient background circle */}
        <div className="absolute right-0 bottom-0 h-44 w-44 rounded-full bg-indigo-800 opacity-20 translate-x-12 translate-y-12"></div>
      </div>
    </div>
  );
}
