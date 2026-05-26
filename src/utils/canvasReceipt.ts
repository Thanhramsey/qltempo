/**
 * Draw and export a beautiful, professional tuition fee receipt image using HTML5 Canvas
 */
export function exportReceiptImage(data: {
  studentName: string;
  phone: string;
  shiftName: string;
  courseName: string;
  month: string;
  totalAmount: number;
  amountPaid: number;
  paymentDate: string;
  status: string;
  id: string;
  note: string;
}) {
  // Create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = 650;
  canvas.height = 850;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background gradient (Luxurious Slate & Violet Accent feel)
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, "#ffffff");
  bgGrad.addColorStop(1, "#f8fafc");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border with subtle shadows
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 10;
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

  // Inner gold/emerald elegant border line
  ctx.strokeStyle = data.status === "paid" ? "#10b981" : "#f59e0b";
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

  // Header Design
  // Decorative modern shapes
  ctx.fillStyle = data.status === "paid" ? "#ecfdf5" : "#fef3c7";
  ctx.beginPath();
  ctx.roundRect(40, 40, canvas.width - 80, 110, 12);
  ctx.fill();

  // Branding Title
  ctx.font = "bold 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = data.status === "paid" ? "#047857" : "#b45309";
  ctx.textAlign = "center";
  ctx.fillText("HỆ THỐNG QUẢN LÝ HỌC SINH & CHUYÊN CẦN", canvas.width / 2, 70);

  ctx.font = "bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.fillText("BIÊN LAI THU HỌC PHÍ", canvas.width / 2, 108);

  ctx.font = "italic 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(`Mã biên lai: RCPT-${data.id.substring(0, 8).toUpperCase()}`, canvas.width / 2, 133);

  // Divider Line
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 180);
  ctx.lineTo(canvas.width - 50, 180);
  ctx.stroke();

  // Metadata Block 1: Student Information
  ctx.textAlign = "left";
  
  ctx.font = "bold 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("THÔNG TIN HỌC SINH", 50, 215);

  ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#1e293b";
  
  // Student Name
  ctx.fillText("Họ và tên:", 50, 245);
  ctx.font = "bold 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(data.studentName, 170, 245);
  
  // Phone
  ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Số điện thoại:", 50, 275);
  ctx.font = "500 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(data.phone || "---", 170, 275);

  // Metadata Block 2: Class Details
  ctx.font = "bold 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("CHI TIẾT CA HỌC", 50, 325);

  ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#1e293b";
  
  ctx.fillText("Lớp / Môn học:", 50, 355);
  ctx.font = "bold 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(data.courseName, 170, 355);

  ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Tên ca học:", 50, 385);
  ctx.fillText(data.shiftName, 170, 385);

  ctx.fillText("Kỳ học phí:", 50, 415);
  ctx.font = "bold 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const formattedMonth = data.month.split("-")[1] + "/" + data.month.split("-")[0];
  ctx.fillText(`Tháng ${formattedMonth}`, 170, 415);

  // Divider Line
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(50, 445);
  ctx.lineTo(canvas.width - 50, 445);
  ctx.stroke();

  // Payment Calculation Table
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(50, 470, canvas.width - 100, 150);
  ctx.strokeStyle = "#e2e8f0";
  ctx.strokeRect(50, 470, canvas.width - 100, 150);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Khoản mục", 70, 498);
  ctx.textAlign = "right";
  ctx.fillText("Số tiền (VND)", canvas.width - 70, 498);

  ctx.strokeStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(50, 515);
  ctx.lineTo(canvas.width - 50, 515);
  ctx.stroke();

  // Rows
  ctx.textAlign = "left";
  ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.fillText("Học phí trọn gói theo ca học", 70, 545);
  ctx.textAlign = "right";
  ctx.fillText(data.totalAmount.toLocaleString() + " đ", canvas.width - 70, 545);

  ctx.textAlign = "left";
  ctx.fillText("Số tiền thực đóng", 70, 580);
  ctx.textAlign = "right";
  ctx.font = "bold 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = data.status === "paid" ? "#10b981" : "#f59e0b";
  ctx.fillText(data.amountPaid.toLocaleString() + " đ", canvas.width - 70, 580);

  // Status Badge Seal at the bottom right corner
  ctx.save();
  ctx.translate(canvas.width - 180, 680);
  ctx.rotate(-0.06); // Subtle rotate of stamp
  
  ctx.fillStyle = data.status === "paid" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)";
  ctx.strokeStyle = data.status === "paid" ? "#10b981" : "#f59e0b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-75, -25, 150, 50, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = data.status === "paid" ? "#047857" : "#b45309";
  ctx.textAlign = "center";
  ctx.fillText(data.status === "paid" ? "ĐÃ THU ĐỦ" : "MỘT PHẦN", 0, 8);
  ctx.restore();

  // Signature Block Left
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Ngày thanh toán: " + (data.paymentDate || "---"), 50, 660);

  if (data.note) {
    ctx.fillText("Ghi chú: " + data.note, 50, 690);
  }

  // Bottom Center Footer
  ctx.textAlign = "center";
  ctx.font = "11px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Cảm ơn Quý phụ huynh và Học sinh đã tin tưởng đồng hành cùng chúng tôi!", canvas.width / 2, 800);

  // Process to Image Download
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `Receipt_${data.studentName.replace(/\s+/g, "_")}_${data.month}.png`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateStudentTuitionSnapshotImage(data: {
  studentName: string;
  phone: string;
  cycleIndex: number;
  sessionsTarget: number;
  currentCycleSessions: number;
  totalPresentSessions: number;
  totalAmount: number;
  amountPaid: number;
  paymentDate: string;
  status: string;
  note: string;
  sessions: Array<{ date: string; shiftLabel: string }>;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#f8fafc');
  bg.addColorStop(1, '#eef2ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.beginPath();
  ctx.arc(770, 120, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.beginPath();
  ctx.arc(120, 1100, 260, 0, Math.PI * 2);
  ctx.fill();

  const head = ctx.createLinearGradient(0, 0, canvas.width, 0);
  head.addColorStop(0, '#1d4ed8');
  head.addColorStop(1, '#4338ca');
  ctx.fillStyle = head;
  ctx.fillRect(0, 0, canvas.width, 130);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('BÁO CÁO BUỔI HỌC + HỌC PHÍ', 40, 72);
  ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#dbeafe';
  ctx.fillText(`Ngày xuất: ${new Date().toISOString().slice(0, 10).split('-').reverse().join('/')}`, 40, 100);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillRect(30, 145, 840, 230);
  ctx.strokeRect(30, 145, 840, 230);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('THÔNG TIN HỌC SINH', 50, 185);

  ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`Họ tên: ${data.studentName}`, 50, 225);
  ctx.fillText(`SĐT: ${data.phone || '---'}`, 50, 255);
  ctx.fillText(`Chu kỳ hiện tại: ${data.cycleIndex}`, 50, 285);
  ctx.fillText(
    `Tiến độ chu kỳ: ${data.currentCycleSessions}/${data.sessionsTarget} buổi (Tổng đã học: ${data.totalPresentSessions} buổi)`,
    50,
    315
  );

  const debt = Math.max(data.totalAmount - data.amountPaid, 0);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`Học phí chu kỳ: ${data.totalAmount.toLocaleString()} đ`, 50, 345);
  ctx.fillStyle = debt === 0 ? '#059669' : '#b45309';
  ctx.fillText(`Đã đóng: ${data.amountPaid.toLocaleString()} đ | Còn nợ: ${debt.toLocaleString()} đ`, 430, 345);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.fillRect(30, 400, 840, 760);
  ctx.strokeRect(30, 400, 840, 760);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('CÁC BUỔI ĐÃ HỌC (CÓ MẶT)', 50, 440);

  ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Danh sách theo chu kỳ hiện tại, tối đa 24 buổi', 50, 465);

  const sessionsToRender = data.sessions.slice(0, 24);
  const rowHeight = 26;
  let y = 500;

  ctx.font = 'bold 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('STT', 50, y);
  ctx.fillText('Ngày', 110, y);
  ctx.fillText('Ca học', 230, y);

  y += 14;
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(850, y);
  ctx.stroke();

  ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  sessionsToRender.forEach((session, idx) => {
    y += rowHeight;
    if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.fillRect(45, y - 16, 810, 22);
    }
    ctx.fillStyle = '#1e293b';
    ctx.fillText(String(idx + 1), 50, y);
    ctx.fillText(session.date.split('-').reverse().join('/'), 110, y);
    ctx.fillText(session.shiftLabel, 230, y);
  });

  if (sessionsToRender.length === 0) {
    y += rowHeight;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Chưa có buổi học có mặt nào trong chu kỳ này.', 50, y);
  }

  const badgeX = 640;
  const badgeY = 1110;
  const paidEnough = debt === 0;
  ctx.fillStyle = paidEnough ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.18)';
  ctx.strokeStyle = paidEnough ? '#10b981' : '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY - 25, 200, 36, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = paidEnough ? '#065f46' : '#92400e';
  ctx.font = 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(paidEnough ? 'TRẠNG THÁI: ĐÃ ĐỦ' : 'TRẠNG THÁI: CHƯA ĐỦ', badgeX + 12, badgeY - 2);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Trạng thái học phí: ${data.status}`, 50, 1120);
  ctx.fillText(`Ngày đóng: ${data.paymentDate ? data.paymentDate.split('-').reverse().join('/') : '---'}`, 290, 1120);
  ctx.fillText(`Ghi chú: ${data.note || '---'}`, 50, 1145);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Trung tâm Piano - Học tập đều đặn, tiến bộ mỗi ngày', canvas.width / 2, 1175);

  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
}

export function downloadStudentTuitionSnapshotImage(dataUrl: string, fileName: string) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Backward-compat export for stale HMR modules still importing the old function name.
export function exportStudentTuitionSnapshot(data: {
  studentName: string;
  phone: string;
  cycleIndex: number;
  sessionsTarget: number;
  currentCycleSessions: number;
  totalPresentSessions: number;
  totalAmount: number;
  amountPaid: number;
  paymentDate: string;
  status: string;
  note: string;
  sessions: Array<{ date: string; shiftLabel: string }>;
}) {
  const dataUrl = generateStudentTuitionSnapshotImage(data);
  const fileName = `BaoCao_${data.studentName.replace(/\s+/g, '_')}_chu_ky_${data.cycleIndex}.png`;
  downloadStudentTuitionSnapshotImage(dataUrl, fileName);
}
