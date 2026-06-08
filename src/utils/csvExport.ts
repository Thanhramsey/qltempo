/**
 * Export generic raw data to a CSV file downloadable in Excel
 * Includes UTF-8 BOM so Vietnamese accent marks render perfectly
 */
export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const csvContent = rows
    .map(row => row.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  
  const fullContent = bom + headers.map(h => `"${h}"`).join(",") + "\n" + csvContent;
  const blob = new Blob([fullContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Export student list helper
 */
export function exportStudentsList(students: any[], shifts: any[]) {
  const headers = ["Mã Học Sinh", "Họ Tên", "Số Điện Thoại", "Email", "Ngày Sinh", "Loại Chu Kỳ", "Ca Học", "Trạng Thái", "Ngày Nhập Học"];
  
  const rows = students.map(student => {
    const studentShifts = (student.shifts || [])
      .map((shId: string) => {
        const found = shifts.find(sh => sh.id === shId);
        return found ? found.name : shId;
      })
      .join("; ");
      
    const cycleLabel = student.tuitionCycleType === 'cycle_8' ? '800.000đ / 8 buổi' : '2.400.000đ / 24 buổi';

    return [
      student.id,
      student.name,
      student.phone || "",
      student.email || "",
      student.birthDate || "",
      cycleLabel,
      studentShifts,
      student.status === "active" ? "Đang học" : "Nghỉ học",
      student.joinDate || ""
    ];
  });
  
  exportToCSV("Danh_Sach_Hoc_Sinh", headers, rows);
}

/**
 * Export attendance report
 */
export function exportAttendanceReport(
  date: string,
  shiftName: string,
  students: any[],
  attendances: any[]
) {
  const headers = ["Ngày", "Ca Học", "Mã Học Sinh", "Tên Học Sinh", "Số Điện Thoại", "Trạng Thái Điểm Danh", "Ghi Chú"];
  
  const rows = students.map(student => {
    const att = attendances.find(a => a.studentId === student.id);
    let statusText = "Chưa điểm danh";
    if (att) {
      if (att.status === "present") statusText = "Có mặt";
      else if (att.status === "absent_excused") statusText = "Vắng (Có phép)";
      else if (att.status === "absent_unexcused") statusText = "Vắng (Không phép)";
    }
    
    return [
      date,
      shiftName,
      student.id,
      student.name,
      student.phone || "",
      statusText,
      att?.note || ""
    ];
  });
  
  exportToCSV(`Bao_Cao_Diem_Danh_${date}_${shiftName.replace(/\s+/g, "_")}`, headers, rows);
}

/**
 * Export tuition/fee payment status
 */
export function exportTuitionReport(
  month: string,
  students: any[],
  shifts: any[],
  payments: any[]
) {
  const headers = ["Học Sinh", "Số Điện Thoại", "Ca Đăng Ký", "Tháng", "Học Phí Ca", "Đã Đóng", "Còn Nợ", "Trạng Thái", "Ngày Đóng", "Ghi Chú"];
  
  const rows: string[][] = [];
  
  students.forEach(student => {
    (student.shifts || []).forEach((shId: string) => {
      const shift = shifts.find(sh => sh.id === shId);
      if (!shift) return;
      
      const payment = payments.find(p => p.studentId === student.id && p.shiftId === shId && p.month === month);
      
      const fee = shift.fee || 0;
      const paid = payment ? payment.amountPaid : 0;
      const debt = fee - paid;
      
      let statusText = "Chưa đóng";
      if (payment) {
        if (payment.status === "paid") statusText = "Đã đóng đủ";
        else if (payment.status === "partial") statusText = "Đóng một phần";
        else statusText = "Chưa đóng";
      }
      
      rows.push([
        student.name,
        student.phone || "",
        shift.name,
        month,
        fee.toLocaleString() + " đ",
        paid.toLocaleString() + " đ",
        debt.toLocaleString() + " đ",
        statusText,
        payment?.paymentDate || "",
        payment?.note || ""
      ]);
    });
  });
  
  exportToCSV(`Bao_Cao_Hoc_Phi_${month}`, headers, rows);
}
