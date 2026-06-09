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
  customization?: {
    showPhone?: boolean;
    showCycleProgress?: boolean;
    showTuitionAmounts?: boolean;
    showStatus?: boolean;
    showPaymentDate?: boolean;
    showNote?: boolean;
    showFooter?: boolean;
    textColor?: string;
    tableHeaderColor?: string;
    reportHeaderBgColor?: string;
    extraLines?: string[];
  };
  sessions: Array<{ date: string; shiftLabel: string }>;
}): string {
  const sessionsToRender = data.sessions.slice(0, data.sessionsTarget);
  const tableX = 50;
  const tableWidth = 800;
  const tableHeaderHeight = 34;
  const rowHeight = 28;
  const sttColWidth = 60;
  const dateColWidth = 120;
  const rowCount = Math.max(sessionsToRender.length, 1);
  const shouldShowPhone = data.customization?.showPhone ?? true;
  const shouldShowCycleProgress = data.customization?.showCycleProgress ?? true;
  const shouldShowTuitionAmounts = data.customization?.showTuitionAmounts ?? true;
  const shouldShowStatus = data.customization?.showStatus ?? true;
  const shouldShowPaymentDate = data.customization?.showPaymentDate ?? true;
  const shouldShowNote = data.customization?.showNote ?? true;
  const shouldShowFooter = data.customization?.showFooter ?? true;
  const customTextColor = data.customization?.textColor || '#0f172a';
  const customTableHeaderColor = data.customization?.tableHeaderColor || '#1d4ed8';
  const customReportHeaderBgColor = data.customization?.reportHeaderBgColor || '#1d4ed8';
  const extraLines = (data.customization?.extraLines || []).map((line) => line.trim()).filter(Boolean);
  const debt = Math.max(data.totalAmount - data.amountPaid, 0);

  const infoPanelX = 30;
  const infoPanelY = 145;
  const infoPanelWidth = 840;
  const infoLineStartY = infoPanelY + 80;
  const infoLineGap = 28;

  const infoLines: string[] = [];
  infoLines.push(`Họ tên: ${data.studentName}`);
  if (shouldShowPhone) infoLines.push(`SĐT: ${data.phone || '---'}`);
  if (shouldShowCycleProgress) {
    infoLines.push(`Chu kỳ hiện tại: ${data.cycleIndex}`);
    infoLines.push(
      `Tiến độ chu kỳ: ${data.currentCycleSessions}/${data.sessionsTarget} buổi (Tổng đã học: ${data.totalPresentSessions} buổi)`
    );
  }
  if (shouldShowTuitionAmounts) {
    infoLines.push(`Học phí chu kỳ: ${data.totalAmount.toLocaleString()} đ`);
    infoLines.push(`Đã đóng: ${data.amountPaid.toLocaleString()} đ | Còn nợ: ${debt.toLocaleString()} đ`);
  }
  extraLines.forEach((line) => infoLines.push(line));

  const infoPanelHeight = Math.max(230, 115 + Math.max(infoLines.length - 1, 0) * infoLineGap);
  const sessionsPanelY = infoPanelY + infoPanelHeight + 25;
  const tableY = sessionsPanelY + 85;

  const detailLines: string[] = [];
  if (shouldShowStatus) detailLines.push(`Trạng thái học phí: ${data.status}`);
  if (shouldShowPaymentDate) {
    detailLines.push(`Ngày đóng: ${data.paymentDate ? data.paymentDate.split('-').reverse().join('/') : '---'}`);
  }
  if (shouldShowNote) detailLines.push(`Ghi chú: ${data.note || '---'}`);

  const tableHeight = tableHeaderHeight + rowCount * rowHeight;
  const tableBottomY = tableY + tableHeight;

  const badgeY = tableBottomY + 70;
  const detailsStartY = badgeY + 10;
  const detailsEndY = detailLines.length > 0 ? detailsStartY + (detailLines.length - 1) * 24 : detailsStartY;
  const footerY = detailsEndY + 30;

  const panelBottomY = (shouldShowFooter ? footerY : detailsEndY) + 20;
  const sessionsPanelHeight = panelBottomY - sessionsPanelY;
  const dynamicCanvasHeight = Math.max(1200, panelBottomY + 40);

  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = dynamicCanvasHeight;
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
  ctx.arc(120, canvas.height - 100, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = customReportHeaderBgColor;
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
  ctx.fillRect(infoPanelX, infoPanelY, infoPanelWidth, infoPanelHeight);
  ctx.strokeRect(infoPanelX, infoPanelY, infoPanelWidth, infoPanelHeight);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('THÔNG TIN HỌC SINH', 50, infoPanelY + 40);

  ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  infoLines.forEach((line, lineIndex) => {
    const lineY = infoLineStartY + lineIndex * infoLineGap;
    if (line.startsWith('Đã đóng:')) {
      ctx.fillStyle = debt === 0 ? '#059669' : '#b45309';
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    } else {
      ctx.fillStyle = customTextColor;
      ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    }
    ctx.fillText(line, 50, lineY);
  });

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.fillRect(30, sessionsPanelY, 840, sessionsPanelHeight);
  ctx.strokeRect(30, sessionsPanelY, 840, sessionsPanelHeight);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('CÁC BUỔI ĐÃ HỌC (CÓ MẶT)', 50, sessionsPanelY + 40);

  ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Danh sách theo chu kỳ hiện tại, tối đa ${data.sessionsTarget} buổi`, 50, sessionsPanelY + 65);

  // Table frame
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#dbe4f3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tableX, tableY, tableWidth, tableHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Header row
  ctx.fillStyle = customTableHeaderColor;
  ctx.beginPath();
  ctx.roundRect(tableX, tableY, tableWidth, tableHeaderHeight, 10);
  ctx.fill();

  // Header text
  ctx.font = 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('STT', tableX + 18, tableY + 22);
  ctx.fillText('Ngày', tableX + sttColWidth + 18, tableY + 22);
  ctx.fillText('Ca học', tableX + sttColWidth + dateColWidth + 18, tableY + 22);

  // Vertical separators
  const col1X = tableX + sttColWidth;
  const col2X = tableX + sttColWidth + dateColWidth;
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(col1X, tableY);
  ctx.lineTo(col1X, tableBottomY);
  ctx.moveTo(col2X, tableY);
  ctx.lineTo(col2X, tableBottomY);
  ctx.stroke();

  // Body rows
  ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  sessionsToRender.forEach((session, idx) => {
    const rowTop = tableY + tableHeaderHeight + idx * rowHeight;
    const rowCenterY = rowTop + 19;

    if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.fillRect(tableX + 1, rowTop, tableWidth - 2, rowHeight);
    }

    ctx.strokeStyle = '#eef2ff';
    ctx.beginPath();
    ctx.moveTo(tableX, rowTop + rowHeight);
    ctx.lineTo(tableX + tableWidth, rowTop + rowHeight);
    ctx.stroke();

    ctx.fillStyle = customTextColor;
    ctx.fillText(String(idx + 1), tableX + 18, rowCenterY);
    ctx.fillText(session.date.split('-').reverse().join('/'), tableX + sttColWidth + 18, rowCenterY);
    ctx.fillText(session.shiftLabel, tableX + sttColWidth + dateColWidth + 18, rowCenterY);
  });

  if (sessionsToRender.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Chưa có buổi học có mặt nào trong chu kỳ này.', tableX + 18, tableY + tableHeaderHeight + 19);
  }

  const badgeX = 640;
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

  if (detailLines.length > 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    detailLines.forEach((line, lineIndex) => {
      ctx.fillText(line, 50, detailsStartY + lineIndex * 24);
    });
  }

  if (shouldShowFooter) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Trung tâm Piano - Học tập đều đặn, tiến bộ mỗi ngày', canvas.width / 2, footerY);
  }

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
  customization?: {
    showPhone?: boolean;
    showCycleProgress?: boolean;
    showTuitionAmounts?: boolean;
    showStatus?: boolean;
    showPaymentDate?: boolean;
    showNote?: boolean;
    showFooter?: boolean;
    textColor?: string;
    tableHeaderColor?: string;
    reportHeaderBgColor?: string;
    extraLines?: string[];
  };
  sessions: Array<{ date: string; shiftLabel: string }>;
}) {
  const dataUrl = generateStudentTuitionSnapshotImage(data);
  const fileName = `BaoCao_${data.studentName.replace(/\s+/g, '_')}_chu_ky_${data.cycleIndex}.png`;
  downloadStudentTuitionSnapshotImage(dataUrl, fileName);
}

export function generateStudentAttendanceRangeImage(data: {
  studentName: string;
  phone: string;
  fromDate: string;
  toDate: string;
  totalRecords: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  shiftBreakdown: Array<{ shiftLabel: string; presentCount: number; totalCount: number }>;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#f8fafc');
  bg.addColorStop(1, '#eef2ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const head = ctx.createLinearGradient(0, 0, canvas.width, 0);
  head.addColorStop(0, '#0f172a');
  head.addColorStop(1, '#1e293b');
  ctx.fillStyle = head;
  ctx.fillRect(0, 0, canvas.width, 118);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('BÁO CÁO ĐIỂM DANH THEO KHOẢNG NGÀY', 34, 66);
  ctx.font = '15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Ngày xuất: ${new Date().toISOString().slice(0, 10).split('-').reverse().join('/')}`, 34, 95);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#dbe2ee';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(28, 138, 944, 230, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 21px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('THÔNG TIN HỌC SINH', 50, 178);

  ctx.fillStyle = '#0f172a';
  ctx.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Họ tên: ${data.studentName}`, 50, 215);
  ctx.fillText(`SĐT: ${data.phone || '---'}`, 50, 245);
  ctx.fillText(
    `Khoảng ngày: ${data.fromDate.split('-').reverse().join('/')} -> ${data.toDate.split('-').reverse().join('/')}`,
    50,
    275
  );

  ctx.fillStyle = '#334155';
  ctx.fillText(`Tổng lượt điểm danh: ${data.totalRecords}`, 50, 320);
  ctx.fillStyle = '#065f46';
  ctx.fillText(`Có mặt: ${data.presentCount}`, 310, 320);
  ctx.fillStyle = '#92400e';
  ctx.fillText(`Vắng phép: ${data.excusedCount}`, 460, 320);
  ctx.fillStyle = '#991b1b';
  ctx.fillText(`Vắng KP: ${data.unexcusedCount}`, 640, 320);

  const debtColor = data.presentCount > 0 ? '#059669' : '#b45309';
  ctx.fillStyle = debtColor;
  ctx.font = 'bold 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(
    data.presentCount > 0
      ? `Đã học ${data.presentCount} buổi trong khoảng đã chọn`
      : 'Chưa có buổi có mặt trong khoảng đã chọn',
    50,
    348
  );

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#dbe2ee';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(28, 390, 944, 500, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('THỐNG KÊ CA HỌC TRONG KHOẢNG', 50, 430);
  ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Sắp xếp theo số buổi có mặt giảm dần', 50, 452);

  const tableX = 50;
  const tableY = 472;
  const tableWidth = 900;
  const headH = 38;
  const rowH = 34;
  const maxRows = 10;
  const rows = data.shiftBreakdown.slice(0, maxRows);

  const tHead = ctx.createLinearGradient(tableX, tableY, tableX + tableWidth, tableY);
  tHead.addColorStop(0, '#1d4ed8');
  tHead.addColorStop(1, '#4338ca');
  ctx.fillStyle = tHead;
  ctx.beginPath();
  ctx.roundRect(tableX, tableY, tableWidth, headH, 10);
  ctx.fill();

  const c1 = tableX + 70;
  const c2 = tableX + 620;
  const c3 = tableX + 770;
  const tableBottom = tableY + headH + Math.max(rows.length, 1) * rowH;

  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(c1, tableY);
  ctx.lineTo(c1, tableBottom);
  ctx.moveTo(c2, tableY);
  ctx.lineTo(c2, tableBottom);
  ctx.moveTo(c3, tableY);
  ctx.lineTo(c3, tableBottom);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('STT', tableX + 18, tableY + 24);
  ctx.fillText('Ca học', c1 + 18, tableY + 24);
  ctx.fillText('Có mặt', c2 + 18, tableY + 24);
  ctx.fillText('Tổng điểm danh', c3 + 18, tableY + 24);

  ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  rows.forEach((row, idx) => {
    const top = tableY + headH + idx * rowH;
    const centerY = top + 22;

    if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.fillRect(tableX + 1, top, tableWidth - 2, rowH);
    }

    ctx.strokeStyle = '#eef2ff';
    ctx.beginPath();
    ctx.moveTo(tableX, top + rowH);
    ctx.lineTo(tableX + tableWidth, top + rowH);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillText(String(idx + 1), tableX + 25, centerY);
    ctx.fillText(row.shiftLabel, c1 + 18, centerY);
    ctx.fillText(String(row.presentCount), c2 + 18, centerY);
    ctx.fillText(String(row.totalCount), c3 + 18, centerY);
  });

  if (rows.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Không có dữ liệu ca học trong khoảng ngày đã chọn.', c1 + 18, tableY + headH + 22);
  }

  if (data.shiftBreakdown.length > rows.length) {
    const remain = data.shiftBreakdown.length - rows.length;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`... còn ${remain} ca học chưa hiển thị`, tableX + 6, tableBottom + 20);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Tempo - Báo cáo thống kê điểm danh theo khoảng ngày', canvas.width / 2, 906);

  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
}

export function downloadStudentAttendanceRangeImage(dataUrl: string, fileName: string) {
  if (!dataUrl) return;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStudentAttendanceRangeImage(data: {
  studentName: string;
  phone: string;
  fromDate: string;
  toDate: string;
  totalRecords: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  shiftBreakdown: Array<{ shiftLabel: string; presentCount: number; totalCount: number }>;
}) {
  const dataUrl = generateStudentAttendanceRangeImage(data);
  const fileName = `BaoCao_DiemDanh_${data.studentName.replace(/\s+/g, '_')}_${data.fromDate}_${data.toDate}.png`;
  downloadStudentAttendanceRangeImage(dataUrl, fileName);
}
