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
