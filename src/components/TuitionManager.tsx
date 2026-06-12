import React, { useEffect, useMemo, useState } from 'react';
import { Shift, Student, Payment, PaymentStatus, Attendance } from '../types';
import { CircleDollarSign, Edit3, Image, Download, Search, CheckCircle, AlertTriangle, Coins, X, Loader2 } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { downloadStudentTuitionSnapshotImage, generateStudentTuitionSnapshotImage } from '../utils/canvasReceipt';
import ToastMessage, { ToastType } from './ui/ToastMessage';
import {
  EXCUSED_ABSENCE_FREE_SESSIONS,
  UNEXCUSED_ABSENCE_FREE_SESSIONS,
  TUITION_CYCLE_OPTIONS,
  getMaxCycleIndexFromSessions,
  getStudentCycleSessions,
  getStudentCycleProgress,
  getTuitionCycleConfig,
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
  sessionsTarget: number;
  cycleFee: number;
  cycleLabel: string;
  totalPresentSessions: number;
  isLocked: boolean;
  currentCycleIndex: number;
  payment?: Payment;
}

interface SnapshotDisplayFields {
  showPhone: boolean;
  showCycleProgress: boolean;
  showTuitionAmounts: boolean;
  showStatus: boolean;
  showPaymentDate: boolean;
  showNote: boolean;
  showFooter: boolean;
}

interface SnapshotColorOptions {
  textColor: string;
  tableHeaderColor: string;
  reportHeaderBgColor: string;
}

const DEFAULT_SNAPSHOT_DISPLAY_FIELDS: SnapshotDisplayFields = {
  showPhone: true,
  showCycleProgress: true,
  showTuitionAmounts: true,
  showStatus: true,
  showPaymentDate: true,
  showNote: true,
  showFooter: true,
};

const SNAPSHOT_FIELD_OPTIONS: Array<{ key: keyof SnapshotDisplayFields; label: string }> = [
  { key: 'showPhone', label: 'Hiện số điện thoại' },
  { key: 'showCycleProgress', label: 'Hiện chu kỳ và tiến độ buổi' },
  { key: 'showTuitionAmounts', label: 'Hiện số tiền học phí/đã đóng/còn nợ' },
  { key: 'showStatus', label: 'Hiện trạng thái học phí' },
  { key: 'showPaymentDate', label: 'Hiện ngày đóng' },
  { key: 'showNote', label: 'Hiện ghi chú' },
  { key: 'showFooter', label: 'Hiện dòng chân trang' },
];

const DEFAULT_SNAPSHOT_COLORS: SnapshotColorOptions = {
  textColor: '#0f172a',
  tableHeaderColor: '#1d4ed8',
  reportHeaderBgColor: '#1d4ed8',
};

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
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number>(1);
  const [selectedCycleSessionsTarget, setSelectedCycleSessionsTarget] = useState<number>(24);
  const [selectedCycleFee, setSelectedCycleFee] = useState<number>(2_400_000);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState<TuitionRow | null>(null);
  const [snapshotDisplayFields, setSnapshotDisplayFields] = useState<SnapshotDisplayFields>(DEFAULT_SNAPSHOT_DISPLAY_FIELDS);
  const [snapshotColors, setSnapshotColors] = useState<SnapshotColorOptions>(DEFAULT_SNAPSHOT_COLORS);
  const [snapshotExtraLineInput, setSnapshotExtraLineInput] = useState('');
  const [snapshotExtraLines, setSnapshotExtraLines] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const showToast = (type: ToastType, message: string) => setToast({ type, message });

  const getRowBilledAmount = (row: TuitionRow) => row.payment?.totalAmount || row.cycleFee;
  const getRowSessionsTarget = (row: TuitionRow) => row.payment?.sessionsTarget || row.sessionsTarget;

  const maxCycleIndex = useMemo(() => {
    let maxFromProgress = 1;
    students.forEach((student) => {
      const config = getTuitionCycleConfig(student.tuitionCycleType);
      const progress = getStudentCycleProgress(
        attendances,
        student.id,
        student.tuitionCycleType,
        config.sessionsTarget,
        config.warningFromSession
      );
      maxFromProgress = Math.max(
        maxFromProgress,
        getMaxCycleIndexFromSessions(progress.totalPresentSessions, config.sessionsTarget)
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
        const config = getTuitionCycleConfig(student.tuitionCycleType);
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !searchQuery ||
          student.name.toLowerCase().includes(q) ||
          student.phone.includes(searchQuery);
        const matchesPackage = selectedPackageFilter === 'all' || config.type === selectedPackageFilter;
        return matchesSearch && matchesPackage;
      })
      .map((student) => {
        const config = getTuitionCycleConfig(student.tuitionCycleType);
        const progress = getStudentCycleProgress(
          attendances,
          student.id,
          student.tuitionCycleType,
          config.sessionsTarget,
          config.warningFromSession
        );
        const targetCycleIndex =
          selectedCycleFilter === 'current' ? progress.currentCycleIndex : Number(selectedCycleFilter);
        const payment = payments.find(
          (p) => p.studentId === student.id && p.cycleIndex === targetCycleIndex
        );
        const { sessionsCount } = getStudentCycleSessions(
          attendances,
          student.id,
          targetCycleIndex,
          student.tuitionCycleType,
          config.sessionsTarget
        );

        return {
          student,
          cycleIndex: targetCycleIndex,
          cycleSessions: sessionsCount,
          sessionsTarget: config.sessionsTarget,
          cycleFee: config.feeVnd,
          cycleLabel: config.label,
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
  }, [students, attendances, payments, searchQuery, selectedCycleFilter, selectedPackageFilter]);

  const handleOpenPayment = (row: TuitionRow) => {
    if (row.isLocked) {
      showToast('warning', `Chu kỳ này đã khóa tự động sau khi đủ ${row.sessionsTarget}/${row.sessionsTarget} buổi. Không thể ghi thu thêm.`);
      return;
    }

    setSelectedStudent(row.student);
    setSelectedCycleIndex(row.cycleIndex);
    setSelectedCycleSessionsTarget(row.sessionsTarget);
    setSelectedCycleFee(row.cycleFee);

    if (row.payment) {
      setCurrentPaymentId(row.payment.id);
      setAmountPaid(row.payment.amountPaid);
      setPaymentDate(row.payment.paymentDate || new Date().toISOString().split('T')[0]);
      setNote(row.payment.note || '');
    } else {
      setCurrentPaymentId(null);
      setAmountPaid(row.cycleFee);
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
      if (amountPaid >= selectedCycleFee) status = 'paid';
      else if (amountPaid > 0) status = 'partial';

      await onUpdatePayment({
        id: payId,
        studentId: selectedStudent.id,
        cycleIndex: selectedCycleIndex,
        sessionsTarget: selectedCycleSessionsTarget,
        amountPaid,
        totalAmount: selectedCycleFee,
        status,
        paymentDate,
        note,
      });

      setIsModalOpen(false);
      showToast('success', 'Đã cập nhật học phí theo chu kỳ buổi học thành công!');
    } catch (err) {
      console.error(err);
      showToast('error', 'Không thể lưu học phí. Vui lòng kiểm tra lại.');
    } finally {
      setSaving(false);
    }
  };

  const refreshSnapshotPreview = (row: TuitionRow) => {
    const sessionsTarget = getRowSessionsTarget(row);
    const studentHistory = attendances
      .filter((att) => att.studentId === row.student.id)
      .sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return (a.updatedAt || '').localeCompare(b.updatedAt || '');
      });

    let countedSessionsSoFar = 0;
    let excusedAbsenceCount = 0;
    let unexcusedAbsenceCount = 0;
    let isPenaltyModeActive = false;

    const allCycleAttendances = studentHistory.reduce<Array<Attendance & { allowanceNote?: string }>>((acc, att) => {
      const cycleIndexForThisAttendance = Math.floor(countedSessionsSoFar / sessionsTarget) + 1;
      let isCountedSession = false;
      let allowanceNote = '';

      if (att.status === 'present') {
        isCountedSession = true;
      } else if (att.status === 'absent_excused') {
        excusedAbsenceCount += 1;

        if (isPenaltyModeActive) {
          isCountedSession = true;
        } else if (excusedAbsenceCount > EXCUSED_ABSENCE_FREE_SESSIONS) {
          isPenaltyModeActive = true;
          isCountedSession = true;
        } else {
          allowanceNote = `Vắng có phép trong phạm vi cho phép (${excusedAbsenceCount}/${EXCUSED_ABSENCE_FREE_SESSIONS})`;
        }
      } else if (att.status === 'absent_unexcused') {
        unexcusedAbsenceCount += 1;

        if (isPenaltyModeActive) {
          isCountedSession = true;
        } else if (unexcusedAbsenceCount > UNEXCUSED_ABSENCE_FREE_SESSIONS) {
          isPenaltyModeActive = true;
          isCountedSession = true;
        } else {
          allowanceNote = `Vắng không phép trong phạm vi cho phép (${unexcusedAbsenceCount}/${UNEXCUSED_ABSENCE_FREE_SESSIONS})`;
        }
      }

      if (cycleIndexForThisAttendance === row.cycleIndex) {
        acc.push({
          ...att,
          allowanceNote: allowanceNote || undefined,
        });
      }

      if (isCountedSession) {
        countedSessionsSoFar += 1;
      }

      return acc;
    }, []);

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
      sessionsTarget,
      currentCycleSessions: row.cycleSessions,
      totalPresentSessions: row.totalPresentSessions,
      totalAmount: getRowBilledAmount(row),
      amountPaid: row.payment?.amountPaid || 0,
      paymentDate: row.payment?.paymentDate || '',
      status: row.payment?.status || 'unpaid',
      note: row.payment?.note || '',
      customization: {
        ...snapshotDisplayFields,
        ...snapshotColors,
        extraLines: snapshotExtraLines,
      },
      sessions: allCycleAttendances.map((session) => {
        const shift = shifts.find((sh) => sh.id === session.shiftId);
        const shiftLabel = shift ? buildShiftLabel(shift) : session.shiftId;

        return {
          date: session.date,
          shiftLabel,
          status: session.status,
          note: session.allowanceNote,
        };
      }),
    });

    setPreviewImageUrl(imageUrl);
    setPreviewFileName(`BaoCao_${row.student.name.replace(/\s+/g, '_')}_chu_ky_${row.cycleIndex}.png`);
  };

  useEffect(() => {
    if (!isPreviewOpen || !previewRow) return;
    const timer = window.setTimeout(() => {
      refreshSnapshotPreview(previewRow);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [isPreviewOpen, previewRow, snapshotDisplayFields, snapshotExtraLines, snapshotColors, attendances]);

  const handleExportSnapshot = (row: TuitionRow) => {
    setPreviewRow(row);
    refreshSnapshotPreview(row);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewRow(null);
  };

  const handleToggleSnapshotField = (field: keyof SnapshotDisplayFields) => {
    setSnapshotDisplayFields((prev: SnapshotDisplayFields) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAddSnapshotExtraLine = () => {
    const line = snapshotExtraLineInput.trim();
    if (!line) return;
    setSnapshotExtraLines((prev: string[]) => [...prev, line]);
    setSnapshotExtraLineInput('');
  };

  const handleRemoveSnapshotExtraLine = (lineIndex: number) => {
    setSnapshotExtraLines((prev: string[]) => prev.filter((_: string, index: number) => index !== lineIndex));
  };

  const handleResetSnapshotCustomization = () => {
    setSnapshotDisplayFields(DEFAULT_SNAPSHOT_DISPLAY_FIELDS);
    setSnapshotColors(DEFAULT_SNAPSHOT_COLORS);
    setSnapshotExtraLineInput('');
    setSnapshotExtraLines([]);
  };

  const handleColorChange = (field: keyof SnapshotColorOptions, value: string) => {
    setSnapshotColors((prev: SnapshotColorOptions) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDownloadPreview = () => {
    downloadStudentTuitionSnapshotImage(previewImageUrl, previewFileName);
  };

  const handleExportCSV = () => {
    const headers = [
      'Học Sinh',
      'SĐT',
      'Loại Chu Kỳ',
      'Chu Kỳ',
      'Tiến Độ Buổi',
      'Tổng Buổi Được Tính',
      'Học Phí Chu Kỳ',
      'Đã Đóng',
      'Còn Nợ',
      'Trạng Thái',
      'Khóa/Mở Chu Kỳ',
      'Ngày Đóng',
      'Ghi Chú',
    ];

    const rows = tuitionRows.map((row) => {
      const billed = getRowBilledAmount(row);
      const sessionsTarget = getRowSessionsTarget(row);
      const paid = row.payment?.amountPaid || 0;
      const debt = Math.max(billed - paid, 0);
      const status = paid >= billed ? 'Đã đóng đủ' : paid > 0 ? 'Đóng một phần' : 'Chưa đóng';

      return [
        row.student.name,
        row.student.phone || '',
        row.cycleLabel,
        String(row.cycleIndex),
        `${row.cycleSessions}/${sessionsTarget}`,
        String(row.totalPresentSessions),
        `${billed.toLocaleString()} đ`,
        `${paid.toLocaleString()} đ`,
        `${debt.toLocaleString()} đ`,
        status,
        row.isLocked ? 'Đã khóa' : 'Đang mở',
        row.payment?.paymentDate || '',
        row.payment?.note || '',
      ];
    });

    exportToCSV('Bao_Cao_Hoc_Phi_Theo_Chu_Ky', headers, rows);
  };

  let totalBilled = 0;
  let totalReceived = 0;
  let totalDue = 0;
  let studentsPaidCount = 0;

  tuitionRows.forEach((row) => {
    const billed = getRowBilledAmount(row);
    const paid = row.payment ? row.payment.amountPaid : 0;
    totalBilled += billed;
    totalReceived += paid;
    totalDue += Math.max(billed - paid, 0);
    if (row.payment?.status === 'paid' || paid >= billed) studentsPaidCount++;
  });

  return (
    <div className="space-y-6">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CircleDollarSign className="text-indigo-600" size={24} />
            Học Phí Theo Chu Kỳ Buổi Học
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Học phí tính theo chu kỳ đã gán trên hồ sơ học sinh: 24 buổi/2.400.000đ hoặc 8 buổi/800.000đ.
          </p>
          <p className="text-xs text-amber-600 mt-1 font-semibold">
            Rule tự động: chu kỳ cũ sẽ khóa khi học sinh đạt đủ số buổi của gói, hệ thống mở chu kỳ mới ngay lập tức.
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

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Lọc theo gói
          </label>
          <select
            value={selectedPackageFilter}
            onChange={(e) => setSelectedPackageFilter(e.target.value)}
            className="tempo-select w-full px-3.5 py-2 rounded-xl text-slate-700 text-sm font-medium h-9.5 bg-white"
          >
            <option value="all">Tất cả gói</option>
            {TUITION_CYCLE_OPTIONS.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Các gói chu kỳ đang hỗ trợ</div>
            <div className="text-sm font-bold text-indigo-800">{TUITION_CYCLE_OPTIONS.map((option) => option.label).join(' | ')}</div>
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
            <table className="w-full min-w-[1120px] text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 border-b border-indigo-300 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                  <th className="px-4 py-4 w-[70px] text-center">STT</th>
                  <th className="px-6 py-4">Học Sinh</th>
                  <th className="px-6 py-4 text-center">Trạng thái HS</th>
                  <th className="px-6 py-4">Loại chu kỳ</th>
                  <th className="px-6 py-4">Chu kỳ hiện tại</th>
                  <th className="px-6 py-4">Tiến độ buổi</th>
                  <th className="px-6 py-4 text-center">Khóa/Mở</th>
                  <th className="px-6 py-4 text-right">Phải đóng</th>
                  <th className="px-6 py-4 text-right">Đã đóng</th>
                  <th className="px-6 py-4 text-right">Còn nợ</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4">Ngày giao dịch</th>
                  <th className="px-6 py-4 text-right sticky right-0 z-30 bg-cyan-500 min-w-[170px] shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.5)]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 text-left">
                {tuitionRows.map((row, index) => {
                  const billed = getRowBilledAmount(row);
                  const sessionsTarget = getRowSessionsTarget(row);
                  const paid = row.payment ? row.payment.amountPaid : 0;
                  const debt = Math.max(billed - paid, 0);
                  const isPaidEnough = paid >= billed;
                  const isPartial = paid > 0 && paid < billed;

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
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold px-1.5">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold text-sm shadow-xs">
                          {row.student.name}
                        </div>
                        <div className="text-3xs text-slate-400 font-mono mt-0.5">SĐT: {row.student.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.student.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Đang học
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            Đã nghỉ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{row.cycleLabel}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 block">Chu kỳ {row.cycleIndex}</span>
                        <span className="text-3xs text-slate-400 block mt-0.5">Chu kỳ đang mở: {row.currentCycleIndex}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-700">
                        {row.cycleSessions}/{sessionsTarget}
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
                        {billed.toLocaleString()} đ
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
                      <td className="px-6 py-4 text-right sticky right-0 z-20 bg-white min-w-[170px] shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.2)]">
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
                <div className="text-xs text-slate-500">Mức thu: <span className="font-bold text-indigo-600">{selectedCycleFee.toLocaleString()}đ</span> / {selectedCycleSessionsTarget} buổi</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Số tiền thực đóng (đ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={selectedCycleFee * 5}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
                <div className="flex justify-between mt-1 text-2xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(selectedCycleFee)}
                    className="text-indigo-600 hover:underline cursor-pointer"
                  >
                    Thu đủ ({selectedCycleFee.toLocaleString()}đ)
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
                onClick={handleClosePreview}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 max-h-[75vh] overflow-auto">
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Tùy biến nội dung hiển thị</div>
                    <div className="text-xs text-slate-500">Bật/tắt mục muốn hiện trên ảnh và thêm nội dung tùy chọn.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSnapshotCustomization}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Đặt lại mặc định
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {SNAPSHOT_FIELD_OPTIONS.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 text-sm text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={snapshotDisplayFields[field.key]}
                        onChange={() => handleToggleSnapshotField(field.key)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Thêm nội dung tự nhập (hiện ở mục Thông tin học sinh)
                  </label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="text"
                      value={snapshotExtraLineInput}
                      onChange={(e) => setSnapshotExtraLineInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSnapshotExtraLine();
                        }
                      }}
                      placeholder="Ví dụ: Đã giảm 100.000đ vì đóng trước hạn"
                      className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSnapshotExtraLine}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                    >
                      Thêm dòng
                    </button>
                  </div>

                  {snapshotExtraLines.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {snapshotExtraLines.map((line, lineIndex) => (
                        <div key={`${line}-${lineIndex}`} className="flex items-center justify-between gap-2 text-sm bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2">
                          <span className="text-slate-700">{line}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSnapshotExtraLine(lineIndex)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Chỉnh màu ảnh</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
                      <span>Màu chữ</span>
                      <input
                        type="color"
                        value={snapshotColors.textColor}
                        onChange={(e) => handleColorChange('textColor', e.target.value)}
                        className="h-7 w-10 p-0 border-0 bg-transparent cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
                      <span>Màu TH bảng</span>
                      <input
                        type="color"
                        value={snapshotColors.tableHeaderColor}
                        onChange={(e) => handleColorChange('tableHeaderColor', e.target.value)}
                        className="h-7 w-10 p-0 border-0 bg-transparent cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
                      <span>Nền header báo cáo</span>
                      <input
                        type="color"
                        value={snapshotColors.reportHeaderBgColor}
                        onChange={(e) => handleColorChange('reportHeaderBgColor', e.target.value)}
                        className="h-7 w-10 p-0 border-0 bg-transparent cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

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
                onClick={handleClosePreview}
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
