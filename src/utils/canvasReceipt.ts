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
  sessions: Array<{ date: string; shiftLabel: string; status?: string; note?: string }>;
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
    const baseStatusLabel = isUnexcused ? 'Vắng KP' : isExcused ? 'Vắng phép' : 'Có mặt';
    const statusLabel = session.note ? `${baseStatusLabel} - ${session.note}` : baseStatusLabel;
    const statusLines = wrapTextLines(statusLabel, statusColWidth - 16, '13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif');
    const rowHeight = Math.max(minRowHeight, statusLines.length * 16 + 10);

    return {
      session,
      isUnexcused,
      isExcused,
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

    ctx.fillStyle = row.isUnexcused ? '#dc2626' : row.isExcused ? '#d97706' : '#16a34a';
    row.statusLines.forEach((line, lineIndex) => {
      ctx.fillText(line, col3X + 8, rowTop + 18 + lineIndex * 16);
    });

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

  const tableBorder = '#d1d5db';
  const tableHeader = '#2f477e';
  const textPrimary = '#111827';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 62px Georgia, serif';
  ctx.fillText(data.centerName, 70, 110);

  ctx.fillStyle = textPrimary;
  ctx.font = '700 60px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('THÔNG BÁO HỌC PHÍ', canvas.width - 70, 110);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#374151';
  ctx.font = 'italic 36px Georgia, serif';
  ctx.fillText(data.centerSlogan, 70, 165);

  ctx.fillStyle = textPrimary;
  ctx.font = '700 34px Arial, sans-serif';
  ctx.fillText(`Địa chỉ: ${data.centerAddress}`, 70, 250);
  ctx.fillText(`Email: ${data.centerEmail}`, 70, 305);
  ctx.fillText(`Hotline: ${data.centerHotline}`, 70, 360);

  ctx.textAlign = 'right';
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 42px Arial, sans-serif';
  ctx.fillText(`Ngày: ${formatDateVn(data.paymentDate)}`, canvas.width - 70, 170);
  ctx.textAlign = 'left';

  const infoX = 60;
  const infoY = 440;
  const infoW = canvas.width - 120;
  const infoH = 250;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = tableBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(infoX, infoY, infoW, infoH);

  ctx.fillStyle = tableHeader;
  ctx.fillRect(infoX, infoY, infoW, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('THÔNG TIN KHÁCH HÀNG', infoX + 12, infoY + 36);

  const labelWidth = 290;
  ctx.strokeStyle = tableBorder;
  ctx.beginPath();
  ctx.moveTo(infoX + labelWidth, infoY + 52);
  ctx.lineTo(infoX + labelWidth, infoY + infoH);
  ctx.stroke();

  for (let i = 1; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(infoX, infoY + 52 + i * 50);
    ctx.lineTo(infoX + infoW, infoY + 52 + i * 50);
    ctx.stroke();
  }

  const courseNote = `Học phí khóa học: ${formatDateVn(data.courseStartDate)} - ${formatDateVn(data.courseEndDate)}`;
  const mergedNote = data.note ? `${courseNote} | ${data.note}` : courseNote;

  const customerRows: Array<{ label: string; value: string }> = [
    { label: 'Tên khách hàng:', value: data.studentName },
    { label: 'Địa chỉ:', value: data.studentEmail || '---' },
    { label: 'Số điện thoại:', value: data.studentPhone || '---' },
    { label: 'Ghi chú:', value: mergedNote },
  ];

  ctx.fillStyle = textPrimary;
  ctx.font = '700 30px Arial, sans-serif';
  customerRows.forEach((row, idx) => {
    const y = infoY + 88 + idx * 50;
    ctx.fillText(row.label, infoX + 14, y);
    ctx.font = '500 30px Arial, sans-serif';
    ctx.fillText(row.value, infoX + labelWidth + 14, y);
    ctx.font = '700 30px Arial, sans-serif';
  });

  const itemX = 60;
  const itemY = 790;
  const itemW = canvas.width - 120;
  const itemH = 510;
  ctx.strokeStyle = tableBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(itemX, itemY, itemW, itemH);

  const sttW = 110;
  const infoWCol = 560;
  const qtyW = 180;
  const priceW = 210;
  const totalW = itemW - sttW - infoWCol - qtyW - priceW;

  ctx.fillStyle = tableHeader;
  ctx.fillRect(itemX, itemY, itemW, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('STT', itemX + 36, itemY + 36);
  ctx.fillText('THÔNG TIN ', itemX + sttW + 12, itemY + 36);
  ctx.fillText('SỐ LƯỢNG', itemX + sttW + infoWCol + 16, itemY + 36);
  ctx.fillText('GIÁ TIỀN', itemX + sttW + infoWCol + qtyW + 14, itemY + 36);
  ctx.fillText('THÀNH TIỀN', itemX + sttW + infoWCol + qtyW + priceW + 14, itemY + 36);

  const x1 = itemX + sttW;
  const x2 = x1 + infoWCol;
  const x3 = x2 + qtyW;
  const x4 = x3 + priceW;

  ctx.strokeStyle = tableBorder;
  [x1, x2, x3, x4].forEach((lineX) => {
    ctx.beginPath();
    ctx.moveTo(lineX, itemY);
    ctx.lineTo(lineX, itemY + itemH);
    ctx.stroke();
  });

  const items = [
    {
      stt: '1',
      description: 'Thanh toán học phí đợt này',
      qty: '1',
      unitPrice: formatMoneyVnd(data.amountPaid),
      totalPrice: formatMoneyVnd(data.amountPaid),
    },
  ];

  const detailFont = '500 21px Arial, sans-serif';
  const lineHeight = 26;
  const rowPadding = 14;
  const blankRowHeight = 76;
  const renderedRowHeights: number[] = [];

  ctx.font = detailFont;
  items.forEach((item) => {
    const lines = wrapTextLines(ctx, item.description, infoWCol - 26);
    const rowHeight = Math.max(blankRowHeight, lines.length * lineHeight + rowPadding * 2 + 6);
    renderedRowHeights.push(rowHeight);
  });

  while (renderedRowHeights.length < 5) renderedRowHeights.push(blankRowHeight);

  let currentY = itemY + 52;
  renderedRowHeights.forEach((height) => {
    currentY += height;
    ctx.beginPath();
    ctx.moveTo(itemX, currentY);
    ctx.lineTo(itemX + itemW, currentY);
    ctx.stroke();
  });

  ctx.fillStyle = textPrimary;
  ctx.font = detailFont;

  let rowTop = itemY + 52;
  items.forEach((item, idx) => {
    const rowHeight = renderedRowHeights[idx];
    const lines = wrapTextLines(ctx, item.description, infoWCol - 26);
    const baseY = rowTop + rowPadding + 16;

    ctx.textAlign = 'center';
    ctx.fillText(item.stt, itemX + sttW / 2, rowTop + rowHeight / 2 + 7);

    ctx.textAlign = 'left';
    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, x1 + 12, baseY + lineIdx * lineHeight);
    });

    ctx.textAlign = 'center';
    ctx.fillText(item.qty, x2 + qtyW / 2, rowTop + rowHeight / 2 + 7);

    ctx.textAlign = 'right';
    ctx.fillText(item.unitPrice, x4 - 14, rowTop + rowHeight / 2 + 7);
    ctx.fillText(item.totalPrice, itemX + itemW - 14, rowTop + rowHeight / 2 + 7);

    rowTop += rowHeight;
  });

  const tableBottom = rowTop + renderedRowHeights.slice(items.length).reduce((sum, h) => sum + h, 0);
  const totalRowY = tableBottom;
  const totalRowH = blankRowHeight;
  const totalLabelText = 'TỔNG TIỀN THANH TOÁN';
  const totalAmountText = formatMoneyVnd(data.amountPaid);

  // Render as plain bold text in the existing table cells (no extra shape to avoid visual offset).
  ctx.fillStyle = textPrimary;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(totalLabelText, x3 + 10, totalRowY + totalRowH / 2);

  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(totalAmountText, itemX + itemW - 8, totalRowY + totalRowH / 2);
  ctx.textBaseline = 'alphabetic';

  ctx.textAlign = 'left';
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 34px Arial, sans-serif';
  const bankInfoTop = totalRowY + totalRowH + 90;
  ctx.fillText(`Chủ TK: ${data.bankAccountName}`, 80, bankInfoTop);
  ctx.fillText(`SỐ TK: ${data.bankAccountNumber}`, 80, bankInfoTop + 52);
  ctx.fillText(data.bankName, 80, bankInfoTop + 104);

  const qrCandidates = buildQrCandidates(data.qrImagePath);
  const qrImage = await loadFirstAvailableImage(qrCandidates);

  const qrX = canvas.width - 350;
  const qrY = bankInfoTop - 50;
  if (qrImage) {
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImage, qrX, qrY, 240, 240);
    ctx.imageSmoothingEnabled = prevSmoothing;
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(qrX, qrY, 240, 240);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHƯA CÓ QR', qrX + 120, qrY + 128);
    ctx.textAlign = 'left';
  }
  // ctx.strokeStyle = '#10b981';
  // ctx.lineWidth = 2;
  // ctx.strokeRect(qrX - 8, qrY - 8, 256, 256);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.font = '600 30px Arial, sans-serif';
  ctx.fillText('Nếu có thắc mắc xin vui lòng liên hệ 034 930 3368.', canvas.width / 2, 1810);
  ctx.font = 'italic bold 46px Georgia, serif';
  ctx.fillText('Chân thành cảm ơn!', canvas.width / 2, 1860);

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
  sessions: Array<{ date: string; shiftLabel: string; status?: string; note?: string }>;
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
