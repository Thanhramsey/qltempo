import { jsPDF } from 'jspdf';

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
  sessions: Array<{ date: string; shiftLabel: string; status?: string; note?: string; isConvertedPresent?: boolean }>;
}): string {
  const sessionsToRender = data.sessions;
  const tableX = 50;
  const tableWidth = 800;
  const tableHeaderHeight = 34;
  const minRowHeight = 28;
  const sttColWidth = 60;
  const dateColWidth = 120;
  const shiftColWidth = 390;
  const statusColWidth = tableWidth - sttColWidth - dateColWidth - shiftColWidth;
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

  const wrapTextLines = (text: string, maxWidth: number, font: string): string[] => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [text];

    tempCtx.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (tempCtx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  };

  const sessionRows = sessionsToRender.map((session) => {
    const isUnexcused = session.status === 'absent_unexcused';
    const isExcused = session.status === 'absent_excused';
    const isPresent = !isUnexcused && !isExcused;
    const statusLabel = isUnexcused
      ? (session.note ? `Vắng KP - ${session.note}` : 'Vắng KP')
      : isExcused
      ? (session.note ? `Vắng phép - ${session.note}` : 'Vắng phép')
      : '';
    const statusLines = statusLabel
      ? wrapTextLines(statusLabel, statusColWidth - 16, '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif')
      : [];
    const rowHeight = Math.max(minRowHeight, statusLines.length * 16 + 10);

    return {
      session,
      isUnexcused,
      isExcused,
      isPresent,
      statusLines,
      rowHeight,
    };
  });

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
      `Tiến độ chu kỳ: ${data.currentCycleSessions}/${data.sessionsTarget} buổi (Tổng buổi được tính: ${data.totalPresentSessions} buổi)`
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

  const tableBodyHeight = sessionRows.length > 0
    ? sessionRows.reduce((sum, row) => sum + row.rowHeight, 0)
    : minRowHeight;
  const tableHeight = tableHeaderHeight + tableBodyHeight;
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
  ctx.fillText('DANH SÁCH BUỔI HỌC TRONG CHU KỲ', 50, sessionsPanelY + 40);

  ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Chu kỳ ${data.cycleIndex} · Có mặt (trắng), vắng phép (vàng), vắng KP (đỏ)`, 50, sessionsPanelY + 65);

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

  // Column positions
  const col1X = tableX + sttColWidth;
  const col2X = col1X + dateColWidth;
  const col3X = col2X + shiftColWidth;

  // Vertical separators
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(col1X, tableY);
  ctx.lineTo(col1X, tableBottomY);
  ctx.moveTo(col2X, tableY);
  ctx.lineTo(col2X, tableBottomY);
  ctx.moveTo(col3X, tableY);
  ctx.lineTo(col3X, tableBottomY);
  ctx.stroke();

  // Header text
  ctx.font = 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('STT', tableX + 18, tableY + 22);
  ctx.fillText('Ngày', col1X + 8, tableY + 22);
  ctx.fillText('Ca học', col2X + 8, tableY + 22);
  ctx.fillText('Trạng thái', col3X + 8, tableY + 22);

  // Body rows
  ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  let rowTop = tableY + tableHeaderHeight;
  sessionRows.forEach((row, idx) => {
    const rowCenterY = rowTop + row.rowHeight / 2 + 5;

    if (row.isUnexcused) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(tableX + 1, rowTop, tableWidth - 2, row.rowHeight);
    } else if (row.isExcused) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.fillRect(tableX + 1, rowTop, tableWidth - 2, row.rowHeight);
    } else if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.fillRect(tableX + 1, rowTop, tableWidth - 2, row.rowHeight);
    }

    ctx.strokeStyle = '#eef2ff';
    ctx.beginPath();
    ctx.moveTo(tableX, rowTop + row.rowHeight);
    ctx.lineTo(tableX + tableWidth, rowTop + row.rowHeight);
    ctx.stroke();

    ctx.fillStyle = customTextColor;
    ctx.fillText(String(idx + 1), tableX + 18, rowCenterY);
    ctx.fillText(row.session.date.split('-').reverse().join('/'), col1X + 8, rowCenterY);
    ctx.fillText(row.session.shiftLabel, col2X + 8, rowCenterY);

    if (row.isPresent) {
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('✓', col3X + 12, rowCenterY);
      ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    } else {
      ctx.fillStyle = row.isUnexcused ? '#dc2626' : '#d97706';
      row.statusLines.forEach((line, lineIndex) => {
        ctx.fillText(line, col3X + 8, rowTop + 18 + lineIndex * 16);
      });
    }

    rowTop += row.rowHeight;
  });

  if (sessionsToRender.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Chưa có buổi điểm danh nào trong chu kỳ này.', tableX + 18, tableY + tableHeaderHeight + 19);
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

function formatDateVn(dateStr: string): string {
  if (!dateStr) return '---';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

function formatMoneyVnd(amount: number): string {
  return `${Math.max(amount || 0, 0).toLocaleString()} VNĐ`;
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const normalized = (text || '').trim();
  if (!normalized) return [''];

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const testLine = current ? `${current} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể tải ảnh QR.'));
    img.src = src;
  });
}

async function loadFirstAvailableImage(paths: string[]): Promise<HTMLImageElement | null> {
  for (const path of paths) {
    try {
      const img = await loadImageElement(path);
      return img;
    } catch {
      // try next path
    }
  }
  return null;
}

function normalizeAssetPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const noLeadingSlash = trimmed.replace(/^\/+/, '');
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${noLeadingSlash}`;
}

function buildQrCandidates(qrImagePath?: string): string[] {
  const defaults = ['tuition-qr.png', 'tuition-qr.jpg', 'tuition-qr.jpeg', 'qr.png', 'qr.jpg', 'qr.jpeg'];
  const rawCandidates = [qrImagePath, ...defaults];
  const normalized = rawCandidates
    .filter((value): value is string => Boolean(value && value.trim()))
    .flatMap((value) => {
      const normalizedPath = normalizeAssetPath(value);
      return [value, normalizedPath].filter((candidate): candidate is string => Boolean(candidate));
    });

  return Array.from(new Set(normalized));
}

export async function generateTuitionInvoiceImage(data: {
  centerName: string;
  centerSlogan: string;
  centerAddress: string;
  centerEmail: string;
  centerHotline: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  paymentDate: string;
  courseStartDate: string;
  courseEndDate: string;
  cycleIndex: number;
  sessionsTarget: number;
  tuitionAmount: number;
  amountPaid: number;
  qrImagePath?: string;
  note?: string;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 1900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const theme = {
    blue: '#1d4ed8',
    blueDark: '#1e3a8a',
    slate: '#334155',
    ink: '#0f172a',
    border: '#dbe3f0',
    panel: '#f8fbff',
  };

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#f6fbff');
  bg.addColorStop(1, '#eef3ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(37, 99, 235, 0.10)';
  ctx.beginPath();
  ctx.arc(1270, 120, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.beginPath();
  ctx.arc(108, 1740, 160, 0, Math.PI * 2);
  ctx.fill();

  const cardX = 40;
  const cardY = 34;
  const cardW = canvas.width - 80;
  const cardH = canvas.height - 68;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d9e3f3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 26);
  ctx.fill();
  ctx.stroke();

  const headerGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  headerGradient.addColorStop(0, theme.blueDark);
  headerGradient.addColorStop(0.55, theme.blue);
  headerGradient.addColorStop(1, '#2563eb');
  ctx.fillStyle = headerGradient;
  ctx.beginPath();
  ctx.roundRect(cardX + 10, cardY + 10, cardW - 20, 246, 20);
  ctx.fill();

  // Lift header content a bit so both left and right blocks look centered in the blue box.
  const headerContentOffsetY = -20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  // ctx.roundRect(cardX + 26, cardY + 34, 276, 42, 21);
  // ctx.fill();
  ctx.font = '700 23px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffffff';
  // ctx.textAlign = 'center';
  // ctx.fillText('HÓA ĐƠN HỌC PHÍ', cardX + 164, cardY + 63);

  ctx.textAlign = 'left';
  ctx.font = '700 60px "Georgia", serif';
  ctx.fillText(data.centerName, cardX + 40, cardY + 118 + headerContentOffsetY);
  ctx.font = 'italic 30px "Georgia", serif';
  ctx.fillStyle = '#e0e7ff';
  ctx.fillText(data.centerSlogan, cardX + 42, cardY + 164 + headerContentOffsetY);

  ctx.fillStyle = '#dbeafe';
  ctx.font = '500 27px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillText(`Địa chỉ: ${data.centerAddress}`, cardX + 40, cardY + 212 + headerContentOffsetY);
  ctx.fillText(`Email: ${data.centerEmail}  |  Hotline: ${data.centerHotline}`, cardX + 40, cardY + 248 + headerContentOffsetY);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 58px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillText('Thông báo học phí', cardX + cardW - 44, cardY + 118 + headerContentOffsetY);
  ctx.font = '600 29px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillText(`Ngày: ${formatDateVn(data.paymentDate)}`, cardX + cardW - 44, cardY + 170 + headerContentOffsetY);

  const infoX = 90;
  const infoY = 326;
  const infoW = canvas.width - 180;
  const infoH = 276;
  const labelColW = 300;
  const infoHeaderH = 56;
  ctx.fillStyle = theme.panel;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(infoX, infoY, infoW, infoH, 16);
  ctx.fill();
  ctx.stroke();

  const infoHeaderGrad = ctx.createLinearGradient(infoX, infoY, infoX + infoW, infoY);
  infoHeaderGrad.addColorStop(0, '#1e40af');
  infoHeaderGrad.addColorStop(1, '#2563eb');
  ctx.fillStyle = infoHeaderGrad;
  ctx.beginPath();
  ctx.roundRect(infoX + 1, infoY + 1, infoW - 2, infoHeaderH, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 29px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THÔNG TIN KHÁCH HÀNG', infoX + 18, infoY + 37);

  const courseNote = `Học phí khóa học: ${formatDateVn(data.courseStartDate)} - ${formatDateVn(data.courseEndDate)}`;
  const mergedNote = data.note ? `${courseNote} | ${data.note}` : courseNote;
  const customerRows: Array<{ label: string; value: string }> = [
    { label: 'Tên khách hàng', value: data.studentName },
    { label: 'Địa chỉ', value: data.studentEmail || '---' },
    { label: 'Số điện thoại', value: data.studentPhone || '---' },
    { label: 'Ghi chú', value: mergedNote },
  ];
  const rowHeights = [55, 55, 55, 55];

  ctx.strokeStyle = theme.border;
  ctx.beginPath();
  ctx.moveTo(infoX + labelColW, infoY + infoHeaderH);
  ctx.lineTo(infoX + labelColW, infoY + infoH);
  ctx.stroke();

  let infoRowTop = infoY + infoHeaderH;
  customerRows.forEach((row, idx) => {
    const rowHeight = rowHeights[idx];
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f1f5ff';
      ctx.fillRect(infoX + 1, infoRowTop, infoW - 2, rowHeight);
    }

    ctx.beginPath();
    ctx.moveTo(infoX, infoRowTop + rowHeight);
    ctx.lineTo(infoX + infoW, infoRowTop + rowHeight);
    ctx.strokeStyle = theme.border;
    ctx.stroke();

    ctx.fillStyle = theme.slate;
    ctx.font = '700 24px "Segoe UI", "Trebuchet MS", sans-serif';
    ctx.fillText(`${row.label}:`, infoX + 16, infoRowTop + 36);

    ctx.fillStyle = theme.ink;
    ctx.font = '500 24px "Segoe UI", "Trebuchet MS", sans-serif';
    const valueMaxWidth = infoW - labelColW - 26;
    const lines = wrapTextLines(ctx, row.value, valueMaxWidth);
    const maxLines = idx === customerRows.length - 1 ? 2 : 1;
    lines.slice(0, maxLines).forEach((line, lineIdx) => {
      ctx.fillText(line, infoX + labelColW + 16, infoRowTop + 36 + lineIdx * 24);
    });

    infoRowTop += rowHeight;
  });

  const itemX = 90;
  const itemY = 640;
  const itemW = canvas.width - 180;
  const itemH = 500;
  const colWidths = [100, 510, 170, 200, 240];
  const tableHeaderH = 58;
  const rowH = 76;
  const rowCount = 5;
  const totalRowH = itemH - tableHeaderH - rowCount * rowH;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cfd8e3';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(itemX, itemY, itemW, itemH, 16);
  ctx.fill();
  ctx.stroke();

  const tableHeaderGrad = ctx.createLinearGradient(itemX, itemY, itemX + itemW, itemY);
  tableHeaderGrad.addColorStop(0, '#1e40af');
  tableHeaderGrad.addColorStop(1, '#2563eb');
  ctx.fillStyle = tableHeaderGrad;
  ctx.beginPath();
  ctx.roundRect(itemX + 1, itemY + 1, itemW - 2, tableHeaderH, 14);
  ctx.fill();

  const colTitles = ['STT', 'THÔNG TIN', 'SỐ LƯỢNG', 'GIÁ TIỀN', 'THÀNH TIỀN'];
  const colX: number[] = [itemX];
  colWidths.forEach((width, idx) => {
    colX[idx + 1] = colX[idx] + width;
  });
  const tableGridColor = '#98a9c2';

  ctx.strokeStyle = tableGridColor;
  colX.slice(1, -1).forEach((lineX) => {
    ctx.beginPath();
    ctx.moveTo(lineX, itemY);
    ctx.lineTo(lineX, itemY + itemH);
    ctx.stroke();
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 23px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.textBaseline = 'middle';
  colTitles.forEach((title, idx) => {
    const start = colX[idx];
    const width = colWidths[idx];
    ctx.textAlign = idx === 1 ? 'left' : idx >= 3 ? 'right' : 'center';
    if (idx === 1) {
      ctx.fillText(title, start + 14, itemY + tableHeaderH / 2 + 1);
    } else if (idx >= 3) {
      ctx.fillText(title, start + width - 14, itemY + tableHeaderH / 2 + 1);
    } else {
      ctx.fillText(title, start + width / 2, itemY + tableHeaderH / 2 + 1);
    }
  });
  ctx.textBaseline = 'alphabetic';

  type InvoiceItem = {
    stt: string;
    description: string;
    qty: string;
    unitPrice: string;
    totalPrice: string;
  };
  const invoiceItems: InvoiceItem[] = [
    {
      stt: '1',
      description: 'Thanh toán học phí đợt này',
      qty: '1',
      unitPrice: formatMoneyVnd(data.amountPaid),
      totalPrice: formatMoneyVnd(data.amountPaid),
    },
  ];

  for (let row = 0; row < rowCount; row += 1) {
    const y = itemY + tableHeaderH + row * rowH;
    if (row % 2 === 1) {
      ctx.fillStyle = '#f7f9fc';
      ctx.fillRect(itemX + 1, y, itemW - 2, rowH);
    }
    ctx.strokeStyle = tableGridColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(itemX, y + rowH);
    ctx.lineTo(itemX + itemW, y + rowH);
    ctx.stroke();

    const item = invoiceItems[row];
    if (!item) continue;

    ctx.textBaseline = 'middle';
    ctx.font = '500 21px "Segoe UI", "Trebuchet MS", sans-serif';
    ctx.fillStyle = theme.ink;
    ctx.textAlign = 'center';
    ctx.fillText(item.stt, colX[0] + colWidths[0] / 2, y + rowH / 2 + 1);

    ctx.textAlign = 'left';
    ctx.font = '500 21px "Segoe UI", "Trebuchet MS", sans-serif';
    const contentLines = wrapTextLines(ctx, item.description, colWidths[1] - 26);
    const lineHeight = 24;
    const startY = y + rowH / 2 - ((contentLines.length - 1) * lineHeight) / 2;
    contentLines.slice(0, 2).forEach((line, lineIdx) => {
      ctx.fillText(line, colX[1] + 12, startY + lineIdx * lineHeight);
    });

    ctx.textAlign = 'center';
    ctx.fillText(item.qty, colX[2] + colWidths[2] / 2, y + rowH / 2 + 1);
    ctx.textAlign = 'right';
    ctx.fillText(item.unitPrice, colX[3] + colWidths[3] - 14, y + rowH / 2 + 1);
    ctx.fillText(item.totalPrice, colX[4] + colWidths[4] - 14, y + rowH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  const totalY = itemY + tableHeaderH + rowCount * rowH;
  // Redraw body vertical grid after row fills so cell borders stay visible.
  ctx.strokeStyle = tableGridColor;
  ctx.lineWidth = 1.2;
  colX.slice(1, -1).forEach((lineX) => {
    ctx.beginPath();
    ctx.moveTo(lineX, itemY + tableHeaderH);
    ctx.lineTo(lineX, totalY);
    ctx.stroke();
  });

  const totalLabelW = colX[4] - itemX;
  const totalValueW = itemW - totalLabelW;
  const totalRowGrad = ctx.createLinearGradient(itemX, totalY, itemX + itemW, totalY);
  totalRowGrad.addColorStop(0, '#f59e0b');
  totalRowGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = totalRowGrad;
  ctx.fillRect(itemX + 1, totalY, itemW - 2, totalRowH - 1);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = '700 24px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG TIỀN THANH TOÁN', itemX + totalLabelW / 2, totalY + totalRowH / 2 + 1);
  ctx.textAlign = 'right';
  ctx.font = '800 34px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillText(formatMoneyVnd(data.amountPaid), itemX + itemW - 16, totalY + totalRowH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  const bankInfoTop = itemY + itemH + 48;
  const bankCardX = 90;
  const bankCardW = 850;
  const bankCardH = 245;
  ctx.fillStyle = '#f8fbff';
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bankCardX, bankInfoTop, bankCardW, bankCardH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.blue;
  ctx.font = '700 26px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THÔNG TIN CHUYỂN KHOẢN', bankCardX + 18, bankInfoTop + 38);
  ctx.fillStyle = theme.ink;
  ctx.font = '600 30px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillText(`Chủ TK: ${data.bankAccountName}`, bankCardX + 18, bankInfoTop + 96);
  ctx.fillText(`SỐ TK: ${data.bankAccountNumber}`, bankCardX + 18, bankInfoTop + 146);
  ctx.fillText(data.bankName, bankCardX + 18, bankInfoTop + 196);

  const qrCandidates = buildQrCandidates(data.qrImagePath);
  const qrImage = await loadFirstAvailableImage(qrCandidates);

  const qrBoxX = canvas.width - 380;
  const qrBoxY = bankInfoTop;
  const qrBoxSize = 290;
  ctx.fillStyle = '#f8fbff';
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
  ctx.fill();
  ctx.stroke();

  const qrX = qrBoxX + 25;
  const qrY = qrBoxY + 25;
  if (qrImage) {
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImage, qrX, qrY, 240, 240);
    ctx.imageSmoothingEnabled = prevSmoothing;
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(qrX, qrY, 240, 240);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 20px "Segoe UI", "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHƯA CÓ QR', qrX + 120, qrY + 128);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '600 18px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Quét QR để thanh toán nhanh', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 28);

  ctx.textAlign = 'center';
  const footerY = 1778;
  const footerGrad = ctx.createLinearGradient(cardX + 10, footerY, cardX + cardW - 10, footerY);
  footerGrad.addColorStop(0, '#1e40af');
  footerGrad.addColorStop(1, '#2563eb');
  ctx.fillStyle = footerGrad;
  ctx.beginPath();
  ctx.roundRect(cardX + 10, footerY, cardW - 20, 86, 14);
  ctx.fill();

  ctx.fillStyle = '#dbeafe';
  ctx.font = '600 26px "Segoe UI", "Trebuchet MS", sans-serif';
  ctx.fillText('Nếu có thắc mắc xin vui lòng liên hệ 034 930 3368.', canvas.width / 2, footerY + 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 700 36px Georgia, serif';
  ctx.fillText('Chân thành cảm ơn!', canvas.width / 2, footerY + 74);

  return canvas.toDataURL('image/png');
}

export function downloadTuitionInvoiceImage(dataUrl: string, fileName: string) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadTuitionInvoicePdf(dataUrl: string, fileName: string) {
  if (!dataUrl) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const imageProps = pdf.getImageProperties(dataUrl);
  const ratio = Math.min(maxWidth / imageProps.width, maxHeight / imageProps.height);
  const renderWidth = imageProps.width * ratio;
  const renderHeight = imageProps.height * ratio;
  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');
  const safeName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(safeName);
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
  sessions: Array<{ date: string; shiftLabel: string; status?: string; note?: string; isConvertedPresent?: boolean }>;
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
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

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
