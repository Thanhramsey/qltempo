import React, { useState, useEffect } from 'react';
import { Shift, Student, Payment, PaymentStatus } from '../types';
import { CircleDollarSign, Plus, Edit3, Image, Download, Search, CheckCircle, AlertTriangle, FileText, Calendar, Coins, X, Loader2, Save } from 'lucide-react';
import { exportTuitionReport } from '../utils/csvExport';
import { exportReceiptImage } from '../utils/canvasReceipt';

interface TuitionManagerProps {
  shifts: Shift[];
  students: Student[];
  payments: Payment[];
  onUpdatePayment: (payment: Omit<Payment, 'updatedAt'>) => Promise<void>;
  loadingPayments: boolean;
}

export default function TuitionManager({
  shifts,
  students,
  payments,
  onUpdatePayment,
  loadingPayments
}: TuitionManagerProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Set default filter to first shift if shifts are loaded
  useEffect(() => {
    if (shifts.length > 0 && selectedShiftFilter === 'all') {
      setSelectedShiftFilter(shifts[0].id);
    }
  }, [shifts]);

  // Handle open record payment modal
  const handleOpenPayment = (student: Student, shift: Shift, existingPayment?: Payment) => {
    setSelectedStudent(student);
    setSelectedShift(shift);
    setTotalAmount(shift.fee || 0);
    
    if (existingPayment) {
      setCurrentPaymentId(existingPayment.id);
      setAmountPaid(existingPayment.amountPaid);
      setPaymentDate(existingPayment.paymentDate || new Date().toISOString().split('T')[0]);
      setNote(existingPayment.note || '');
    } else {
      setCurrentPaymentId(null);
      setAmountPaid(shift.fee || 0); // Default to full fee
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setIsModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedShift) return;

    setSaving(true);
    try {
      const payId = currentPaymentId || `${selectedStudent.id}_${selectedShift.id}_${selectedMonth}`;
      let status: PaymentStatus = 'unpaid';
      if (amountPaid >= totalAmount) {
        status = 'paid';
      } else if (amountPaid > 0) {
        status = 'partial';
      }

      await onUpdatePayment({
        id: payId,
        studentId: selectedStudent.id,
        shiftId: selectedShift.id,
        month: selectedMonth,
        amountPaid,
        totalAmount,
        status,
        paymentDate,
        note
      });

      setIsModalOpen(false);
      alert("Đã cập nhật học phí học sinh thành công!");
    } catch (err) {
      console.error(err);
      alert("Không thể lưu học phí. Thẻ kiểm tra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  // Receipt image export trigger
  const handleExportReceipt = (student: Student, shift: Shift, payment: Payment) => {
    exportReceiptImage({
      studentName: student.name,
      phone: student.phone || "---",
      shiftName: shift.name,
      courseName: shift.course,
      month: selectedMonth,
      totalAmount: payment.totalAmount || shift.fee || 0,
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
      status: payment.status,
      id: payment.id,
      note: payment.note || ""
    });
  };

  // Filter students & classes
  // Each row will represent a (Student - Shift) pairing for the active filters
  const tuitionRows: { student: Student; shift: Shift; payment?: Payment }[] = [];

  students.forEach(student => {
    if (student.status !== 'active') return; // Only track tuition for active students

    (student.shifts || []).forEach(shId => {
      // Apply Shift filter
      if (selectedShiftFilter !== 'all' && shId !== selectedShiftFilter) return;

      const shift = shifts.find(sh => sh.id === shId);
      if (!shift) return;

      // Apply Search Query
      if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase()) && !student.phone.includes(searchQuery)) {
        return;
      }

      // Find payment
      const payment = payments.find(p => p.studentId === student.id && p.shiftId === shId && p.month === selectedMonth);
      
      tuitionRows.push({
        student,
        shift,
        payment
      });
    });
  });

  const handleExportExcel = () => {
    exportTuitionReport(selectedMonth, students, shifts, payments);
  };

  // Stats
  let totalBilled = 0;
  let totalReceived = 0;
  let totalDue = 0;
  let studentsPaidCount = 0;

  tuitionRows.forEach(row => {
    const origFee = row.shift.fee || 0;
    const paid = row.payment ? row.payment.amountPaid : 0;
    totalBilled += origFee;
    totalReceived += paid;
    totalDue += (origFee - paid);
    if (row.payment?.status === 'paid') {
      studentsPaidCount++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CircleDollarSign className="text-indigo-600" size={24} />
            Theo dõi Học Phí & Biên Lai
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra công nợ học phí hàng tháng của từng học sinh, lập và xuất hình ảnh biên lai thu tiền.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            <Download size={16} />
            Bảng Học Phí (Excel)
          </button>
        </div>
      </div>

      {/* Date & Filter selectors */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Chọn Tháng học phí
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Chọn Ca học theo dõi
          </label>
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-indigo-500 bg-white cursor-pointer h-9.5"
          >
            <option value="all">Tất cả ca học ({shifts.length})</option>
            {shifts.map(sh => (
              <option key={sh.id} value={sh.id}>{sh.name} - {sh.course}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tìm học sinh đóng tiền
          </label>
          <input
            type="text"
            placeholder="Nhập tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 font-medium h-9.5"
          />
        </div>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Tổng công nợ học phí</span>
          <div className="text-lg font-bold text-slate-800 mt-1">{totalBilled.toLocaleString()} đ</div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">Đã huy động thực tế</span>
          <div className="text-lg font-bold text-emerald-700 mt-1">{totalReceived.toLocaleString()} đ</div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-2xs font-bold text-amber-600 uppercase tracking-wider">Số tiền chưa thu được (Nợ)</span>
          <div className="text-lg font-bold text-amber-700 mt-1">{totalDue.toLocaleString()} đ</div>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
          <span className="text-2xs font-bold text-indigo-600 uppercase tracking-wider">Đã đóng đủ</span>
          <div className="text-lg font-bold text-indigo-700 mt-1">
            {studentsPaidCount} / {tuitionRows.length} lượt
          </div>
        </div>
      </div>

      {/* Main calculation log table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {tuitionRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Coins className="mx-auto text-slate-200 mb-3" size={48} />
            <h3 className="font-semibold text-slate-700 text-lg">Chưa có bản ghi học phí nào khớp</h3>
            <p className="text-sm text-slate-400 mt-1">
              Chọn ca học khác hoặc ghi danh học sinh vào ca học để theo dõi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Học Sinh</th>
                  <th className="px-6 py-4">Ca ghi danh</th>
                  <th className="px-6 py-4 text-right">Khoản phải đóng</th>
                  <th className="px-6 py-4 text-right">Thực đóng</th>
                  <th className="px-6 py-4 text-right">Còn nợ</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4">Ngày giao dịch</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 text-left">
                {tuitionRows.map((row, idx) => {
                  const fee = row.shift.fee || 0;
                  const paid = row.payment ? row.payment.amountPaid : 0;
                  const debt = fee - paid;
                  
                  return (
                    <tr key={`${row.student.id}_${row.shift.id}`} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{row.student.name}</div>
                        <div className="text-3xs text-slate-400 font-mono mt-0.5">SĐT: {row.student.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-600 block text-xs">{row.shift.name}</span>
                        <span className="text-3xs font-semibold text-slate-400 block mt-0.5">{row.shift.course}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                        {fee.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 bg-emerald-50/10">
                        {paid.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {debt > 0 ? `${debt.toLocaleString()} đ` : "0 đ"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {paid >= fee ? (
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
                        {row.payment?.paymentDate ? row.payment.paymentDate.split('-').reverse().join('/') : "---"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPayment(row.student, row.shift, row.payment)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            title="Sửa phiếu thu / Ghi đóng phí"
                          >
                            <Edit3 size={13} />
                            <span>Ghi thu</span>
                          </button>
                          
                          <button
                            onClick={() => row.payment && handleExportReceipt(row.student, row.shift, row.payment)}
                            disabled={!row.payment}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 disabled:opacity-40 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-all cursor-pointer"
                            title="Xuất hình ảnh thanh toán"
                          >
                            <Image size={13} />
                            <span>Biên lai</span>
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

      {/* Record payment details Modal */}
      {isModalOpen && selectedStudent && selectedShift && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Coins size={20} className="text-indigo-600" />
                Phiếu Ghi Nhận Đóng Học Phí
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {/* Receipt Summary Card */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Đối Tượng Áp Dụng</div>
                <div className="font-extrabold text-slate-800 text-base mt-1">{selectedStudent.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Đăng ký: <span className="font-semibold text-slate-700">{selectedShift.name}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Phải thu tháng {(selectedMonth.split('-')[1])}/{selectedMonth.split('-')[0]}: <span className="font-bold text-indigo-600">{totalAmount?.toLocaleString()}đ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Số tiền thực đóng (đ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={totalAmount * 5}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
                <div className="flex justify-between mt-1 text-2xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(totalAmount)}
                    className="text-indigo-600 hover:underline cursor-pointer"
                  >
                    Thu đủ ({totalAmount.toLocaleString()}đ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="text-rose-500 hover:underline cursor-pointer"
                  >
                    Xóa thực đóng (0đ)
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
                  Ghi chú giao dịch
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đóng tiền qua chuyển khoản..."
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
                  <span>Xác nhận đóng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
