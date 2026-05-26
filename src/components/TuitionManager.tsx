import React, { useMemo, useState } from 'react';
import { Shift, Student, Payment, PaymentStatus, Attendance } from '../types';
import { CircleDollarSign, Edit3, Image, Download, Search, CheckCircle, AlertTriangle, Coins, X, Loader2 } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { downloadStudentTuitionSnapshotImage, generateStudentTuitionSnapshotImage } from '../utils/canvasReceipt';
import {
  COURSE_FEE_VND,
  COURSE_SESSION_TARGET,
  getMaxCycleIndexFromSessions,
  getStudentCycleSessions,
  getStudentCycleProgress,
  getStudentPresentAttendances,
} from '../utils/tuitionCycle';

interface TuitionManagerProps {
  shifts: Shift[];
  students: Student[];
  attendances: Attendance[];
  payments: Payment[];
  onUpdatePayment: (payment: Omit<Payment, 'updatedAt'>) => Promise<void>;
  loadingPayments: boolean;
}

interface TuitionRow {
  student: Student;
  cycleIndex: number;
  cycleSessions: number;
  totalPresentSessions: number;
  isLocked: boolean;
  currentCycleIndex: number;
  payment?: Payment;
}

export default function TuitionManager({
  shifts,
  students,
  attendances,
  payments,
  onUpdatePayment,
  loadingPayments,
}: TuitionManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('current');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number>(1);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const maxCycleIndex = useMemo(() => {
    let maxFromProgress = 1;
    students.forEach((student) => {
      const progress = getStudentCycleProgress(attendances, student.id);
      maxFromProgress = Math.max(
        maxFromProgress,
        getMaxCycleIndexFromSessions(progress.totalPresentSessions)
      );
    });

    const maxFromPayments = payments.reduce((acc, payment) => {
      return Math.max(acc, payment.cycleIndex || 1);
    }, 1);

    return Math.max(maxFromProgress, maxFromPayments);
  }, [students, attendances, payments]);

  const tuitionRows: TuitionRow[] = useMemo(() => {
    return students
      .filter((student) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return student.name.toLowerCase().includes(q) || student.phone.includes(searchQuery);
      })
      .map((student) => {
        const progress = getStudentCycleProgress(attendances, student.id);
        const targetCycleIndex =
          selectedCycleFilter === 'current' ? progress.currentCycleIndex : Number(selectedCycleFilter);
        const payment = payments.find(
          (p) => p.studentId === student.id && p.cycleIndex === targetCycleIndex
        );
        const { sessionsCount } = getStudentCycleSessions(attendances, student.id, targetCycleIndex);

        return {
          student,
          cycleIndex: targetCycleIndex,
          cycleSessions: sessionsCount,
          totalPresentSessions: progress.totalPresentSessions,
          isLocked: targetCycleIndex < progress.currentCycleIndex,
          currentCycleIndex: progress.currentCycleIndex,
          payment,
        };
      })
      .filter((row) => {
        if (selectedCycleFilter === 'current') {
          return row.student.status === 'active';
        }

        return row.cycleSessions > 0 || !!row.payment;
      });
  }, [students, attendances, payments, searchQuery, selectedCycleFilter]);

  const handleOpenPayment = (row: TuitionRow) => {
    if (row.isLocked) {
      alert('Chu kỳ này đã khóa tự động sau khi đủ 24/24 buổi. Không thể ghi thu thêm.');
      return;
    }

    setSelectedStudent(row.student);
    setSelectedCycleIndex(row.cycleIndex);

    if (row.payment) {
      setCurrentPaymentId(row.payment.id);
      setAmountPaid(row.payment.amountPaid);
      setPaymentDate(row.payment.paymentDate || new Date().toISOString().split('T')[0]);
      setNote(row.payment.note || '');
    } else {
      setCurrentPaymentId(null);
      setAmountPaid(COURSE_FEE_VND);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }

    setIsModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const payId = currentPaymentId || `${selectedStudent.id}_cycle_${selectedCycleIndex}`;
      let status: PaymentStatus = 'unpaid';
      if (amountPaid >= COURSE_FEE_VND) status = 'paid';
      else if (amountPaid > 0) status = 'partial';

      await onUpdatePayment({
        id: payId,
        studentId: selectedStudent.id,
        cycleIndex: selectedCycleIndex,
        sessionsTarget: COURSE_SESSION_TARGET,
        amountPaid,
        totalAmount: COURSE_FEE_VND,
        status,
        paymentDate,
        note,
      });

      setIsModalOpen(false);
      alert('Đã cập nhật học phí theo chu kỳ buổi học thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể lưu học phí. Vui lòng kiểm tra lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSnapshot = (row: TuitionRow) => {
    const history = getStudentPresentAttendances(attendances, row.student.id);
    const cycleStart = (row.cycleIndex - 1) * COURSE_SESSION_TARGET;
    const cycleSessions = history.slice(cycleStart, cycleStart + COURSE_SESSION_TARGET);

    const buildShiftLabel = (shift?: Shift) => {
      if (!shift) return '';

      const shiftName = (shift.name || '').trim();
      const weekday = shift.weekday || shift.days?.[0] || '';
      const scheduleLabel = `${weekday} ${shift.time}`.trim();

      if (!shiftName) return scheduleLabel || shift.id;
      if (!scheduleLabel) return shiftName;

      const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedName = normalize(shiftName);
      const normalizedSchedule = normalize(scheduleLabel);

      // Avoid duplicated labels like "Thứ 2 17:00-18:30 - Thứ 2 17:00-18:30".
      if (normalizedName.includes(normalizedSchedule) || normalizedSchedule.includes(normalizedName)) {
        return shiftName;
      }

      return `${shiftName} - ${scheduleLabel}`;
    };

    const imageUrl = generateStudentTuitionSnapshotImage({
      studentName: row.student.name,
      phone: row.student.phone || '---',
      cycleIndex: row.cycleIndex,
      sessionsTarget: COURSE_SESSION_TARGET,
      currentCycleSessions: row.cycleSessions,
      totalPresentSessions: row.totalPresentSessions,
      totalAmount: COURSE_FEE_VND,
      amountPaid: row.payment?.amountPaid || 0,
      paymentDate: row.payment?.paymentDate || '',
      status: row.payment?.status || 'unpaid',
      note: row.payment?.note || '',
      sessions: cycleSessions.map((session) => {
        const shift = shifts.find((sh) => sh.id === session.shiftId);
        const shiftLabel = shift ? buildShiftLabel(shift) : session.shiftId;

        return {
          date: session.date,
          shiftLabel,
        };
      }),
    });

    setPreviewImageUrl(imageUrl);
    setPreviewFileName(`BaoCao_${row.student.name.replace(/\s+/g, '_')}_chu_ky_${row.cycleIndex}.png`);
    setIsPreviewOpen(true);
  };

  const handleDownloadPreview = () => {
    downloadStudentTuitionSnapshotImage(previewImageUrl, previewFileName);
  };

  const handleExportCSV = () => {
    const headers = [
      'Học Sinh',
      'SĐT',
      'Chu Kỳ',
      'Tiến Độ Buổi',
      'Tổng Buổi Đã Học',
      'Học Phí Chu Kỳ',
      'Đã Đóng',
      'Còn Nợ',
      'Trạng Thái',
      'Khóa/Mở Chu Kỳ',
      'Ngày Đóng',
      'Ghi Chú',
    ];

    const rows = tuitionRows.map((row) => {
      const paid = row.payment?.amountPaid || 0;
      const debt = Math.max(COURSE_FEE_VND - paid, 0);
      const status = paid >= COURSE_FEE_VND ? 'Đã đóng đủ' : paid > 0 ? 'Đóng một phần' : 'Chưa đóng';

      return [
        row.student.name,
        row.student.phone || '',
        String(row.cycleIndex),
        `${row.cycleSessions}/${COURSE_SESSION_TARGET}`,
        String(row.totalPresentSessions),
        `${COURSE_FEE_VND.toLocaleString()} đ`,
        `${paid.toLocaleString()} đ`,
        `${debt.toLocaleString()} đ`,
        status,
        row.isLocked ? 'Đã khóa' : 'Đang mở',
        row.payment?.paymentDate || '',
        row.payment?.note || '',
      ];
    });

    exportToCSV('Bao_Cao_Hoc_Phi_Theo_Chu_Ky_24_Buoi', headers, rows);
  };

  let totalBilled = 0;
  let totalReceived = 0;
  let totalDue = 0;
  let studentsPaidCount = 0;

  tuitionRows.forEach((row) => {
    const paid = row.payment ? row.payment.amountPaid : 0;
    totalBilled += COURSE_FEE_VND;
    totalReceived += paid;
    totalDue += Math.max(COURSE_FEE_VND - paid, 0);
    if (row.payment?.status === 'paid' || paid >= COURSE_FEE_VND) studentsPaidCount++;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CircleDollarSign className="text-indigo-600" size={24} />
            Học Phí Theo Buổi Học (24 buổi = 1 khóa)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Học phí tính theo chu kỳ 24 buổi cho mỗi học sinh, không tính theo ca học.
          </p>
          <p className="text-xs text-amber-600 mt-1 font-semibold">
            Rule tự động: chu kỳ cũ sẽ khóa khi học sinh đạt đủ 24/24 buổi, hệ thống mở chu kỳ mới ngay lập tức.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            <Download size={16} />
            Xuất Báo Cáo CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tìm học sinh
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Nhập tên hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 font-medium h-9.5"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Lọc theo chu kỳ
          </label>
          <select
            value={selectedCycleFilter}
            onChange={(e) => setSelectedCycleFilter(e.target.value)}
            className="tempo-select w-full px-3.5 py-2 rounded-xl text-slate-700 text-sm font-medium h-9.5 bg-white"
          >
            <option value="current">Chu kỳ hiện tại (tự động)</option>
            {Array.from({ length: maxCycleIndex }, (_, i) => i + 1).map((cycle) => (
              <option key={cycle} value={String(cycle)}>
                Chu kỳ {cycle}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Mức học phí cố định mỗi khóa</div>
            <div className="text-lg font-bold text-indigo-800">{COURSE_FEE_VND.toLocaleString()} đ / {COURSE_SESSION_TARGET} buổi</div>
          </div>
          {loadingPayments && <Loader2 size={18} className="animate-spin text-indigo-500" />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Tổng phải thu</span>
          <div className="text-lg font-bold text-slate-800 mt-1">{totalBilled.toLocaleString()} đ</div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">Tổng đã thu</span>
          <div className="text-lg font-bold text-emerald-700 mt-1">{totalReceived.toLocaleString()} đ</div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-2xs font-bold text-amber-600 uppercase tracking-wider">Tổng còn nợ</span>
          <div className="text-lg font-bold text-amber-700 mt-1">{totalDue.toLocaleString()} đ</div>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
          <span className="text-2xs font-bold text-indigo-600 uppercase tracking-wider">Đã đóng đủ</span>
          <div className="text-lg font-bold text-indigo-700 mt-1">
            {studentsPaidCount} / {tuitionRows.length} học sinh
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {tuitionRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Coins className="mx-auto text-slate-200 mb-3" size={48} />
            <h3 className="font-semibold text-slate-700 text-lg">Chưa có học sinh phù hợp</h3>
            <p className="text-sm text-slate-400 mt-1">Thử tìm lại với từ khóa khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 border-b border-indigo-300 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                  <th className="px-6 py-4">Học Sinh</th>
                  <th className="px-6 py-4">Chu kỳ hiện tại</th>
                  <th className="px-6 py-4">Tiến độ buổi</th>
                  <th className="px-6 py-4 text-center">Khóa/Mở</th>
                  <th className="px-6 py-4 text-right">Phải đóng</th>
                  <th className="px-6 py-4 text-right">Đã đóng</th>
                  <th className="px-6 py-4 text-right">Còn nợ</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4">Ngày giao dịch</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 text-left">
                {tuitionRows.map((row) => {
                  const paid = row.payment ? row.payment.amountPaid : 0;
                  const debt = Math.max(COURSE_FEE_VND - paid, 0);
                  const isPaidEnough = paid >= COURSE_FEE_VND;
                  const isPartial = paid > 0 && paid < COURSE_FEE_VND;

                  let paymentButtonClass =
                    'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-200 border border-indigo-300';
                  let paymentButtonLabel = 'Ghi thu';

                  if (isPaidEnough) {
                    paymentButtonClass =
                      'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200 border border-emerald-300';
                    paymentButtonLabel = 'Đã đủ';
                  } else if (isPartial) {
                    paymentButtonClass =
                      'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-amber-200 border border-amber-300';
                    paymentButtonLabel = 'Ghi thu tiếp';
                  }

                  return (
                    <tr key={`${row.student.id}_${row.cycleIndex}`} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold text-sm shadow-xs">
                          {row.student.name}
                        </div>
                        <div className="text-3xs text-slate-400 font-mono mt-0.5">SĐT: {row.student.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 block">Chu kỳ {row.cycleIndex}</span>
                        <span className="text-3xs text-slate-400 block mt-0.5">Chu kỳ đang mở: {row.currentCycleIndex}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-700">
                        {row.cycleSessions}/{COURSE_SESSION_TARGET}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.isLocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-2xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                            Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-2xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            Đang mở
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                        {COURSE_FEE_VND.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 bg-emerald-50/10">
                        {paid.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {debt.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isPaidEnough ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            <CheckCircle size={11} /> Đóng đủ
                          </span>
                        ) : paid > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                            <AlertTriangle size={11} /> Một phần
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                            Chưa đóng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {row.payment?.paymentDate ? row.payment.paymentDate.split('-').reverse().join('/') : '---'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPayment(row)}
                            disabled={row.isLocked}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm ${paymentButtonClass} disabled:opacity-45 disabled:grayscale disabled:cursor-not-allowed`}
                            title="Cập nhật học phí"
                          >
                            <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/20">
                              <Edit3 size={12} />
                            </span>
                            <span>{paymentButtonLabel}</span>
                          </button>

                          <button
                            onClick={() => handleExportSnapshot(row)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-all cursor-pointer"
                            title="Xem trước ảnh buổi học + học phí"
                          >
                            <Image size={13} />
                            <span>Xem ảnh</span>
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

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Coins size={20} className="text-indigo-600" />
                Cập Nhật Học Phí Chu Kỳ
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Thông Tin Đóng Học Phí</div>
                <div className="font-extrabold text-slate-800 text-base mt-1">{selectedStudent.name}</div>
                <div className="text-xs text-slate-500 mt-1">Chu kỳ: <span className="font-semibold text-slate-700">{selectedCycleIndex}</span></div>
                <div className="text-xs text-slate-500">Mức thu: <span className="font-bold text-indigo-600">{COURSE_FEE_VND.toLocaleString()}đ</span> / {COURSE_SESSION_TARGET} buổi</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Số tiền thực đóng (đ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={COURSE_FEE_VND * 5}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
                <div className="flex justify-between mt-1 text-2xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(COURSE_FEE_VND)}
                    className="text-indigo-600 hover:underline cursor-pointer"
                  >
                    Thu đủ ({COURSE_FEE_VND.toLocaleString()}đ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="text-rose-500 hover:underline cursor-pointer"
                  >
                    Xóa (0đ)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ngày Giao Dịch
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chuyển khoản đợt 1"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer flex items-center gap-1"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>Xác nhận</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Image size={20} className="text-indigo-600" />
                Xem Trước Ảnh Báo Cáo
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 max-h-[75vh] overflow-auto">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt="Xem trước ảnh báo cáo học phí"
                  className="w-full rounded-xl border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500">Không thể tạo ảnh xem trước.</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleDownloadPreview}
                disabled={!previewImageUrl}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2"
              >
                <Download size={15} />
                Tải ảnh về máy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
