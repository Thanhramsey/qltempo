import React from 'react';
import {
  BookOpen,
  Monitor,
  Calendar,
  Users,
  CheckSquare,
  CircleDollarSign,
  BarChart3,
  Shield,
  Lightbulb,
} from 'lucide-react';

const quickSteps = [
  'Tạo lớp/ca học trước, sau đó mới thêm học sinh vào ca.',
  'Dùng màn Điểm danh mỗi ngày để hệ thống tự tính số buổi học theo chu kỳ.',
  'Vào Ghi học phí để cập nhật số tiền đã thu và xem trạng thái còn thiếu/đã đủ.',
  'Dùng Báo cáo để xuất file thống kê nhanh theo tình hình vận hành.',
];

const sections = [
  {
    id: 'dashboard',
    title: 'Bảng điều khiển',
    icon: Monitor,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    items: [
      'Xem số liệu tổng quan về học sinh, ca học, chuyên cần và học phí.',
      'Bấm vào các khu vực chính để chuyển nhanh sang màn thao tác liên quan.',
    ],
  },
  {
    id: 'shifts',
    title: 'Lớp & ca học',
    icon: Calendar,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
    items: [
      'Mỗi ca học được định nghĩa theo thứ + khung giờ + môn học.',
      'Hệ thống sẽ chặn tạo ca trùng hoàn toàn cùng thứ và cùng giờ.',
      'Danh sách được ưu tiên hiển thị các ca có nhiều học sinh hơn.',
    ],
  },
  {
    id: 'students',
    title: 'Quản lý học sinh',
    icon: Users,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    items: [
      'Thêm/sửa học sinh, gán nhiều ca học, quản lý trạng thái đang học hoặc đã nghỉ.',
      'Lọc theo thứ và ca học để tìm nhanh danh sách cần thao tác.',
      'Những học sinh có sinh nhật hôm nay sẽ được làm nổi bật trong danh sách.',
    ],
  },
  {
    id: 'attendance',
    title: 'Điểm danh',
    icon: CheckSquare,
    color: 'text-amber-700 bg-amber-50 border-amber-100',
    items: [
      'Chọn ngày học, hệ thống chỉ hiện các ca đúng thứ của ngày đó.',
      'Sử dụng nút Chọn tất cả có mặt hoặc Chọn tất cả vắng để thao tác nhanh.',
      'Lưu điểm danh để cập nhật số buổi học cho từng học sinh.',
    ],
  },
  {
    id: 'tuition',
    title: 'Ghi học phí',
    icon: CircleDollarSign,
    color: 'text-rose-700 bg-rose-50 border-rose-100',
    items: [
      'Học phí được theo dõi theo chu kỳ buổi học, không tính trực tiếp trên số ca.',
      'Cập nhật số tiền đã thu để hệ thống tự tính trạng thái đã đủ/thiếu.',
      'Có thể xem trước biên nhận trước khi tải ảnh hoặc xuất dữ liệu CSV.',
    ],
  },
  {
    id: 'reports',
    title: 'Báo cáo',
    icon: BarChart3,
    color: 'text-violet-700 bg-violet-50 border-violet-100',
    items: [
      'Xem các chỉ số tổng hợp: sĩ số, chuyên cần, học phí, ca học đông nhất.',
      'Xuất file CSV để lưu trữ hoặc gửi phụ huynh/quản lý.',
    ],
  },
  {
    id: 'users',
    title: 'Tài khoản (Admin)',
    icon: Shield,
    color: 'text-slate-700 bg-slate-100 border-slate-200',
    items: [
      'Chỉ tài khoản admin mới thấy menu này.',
      'Quản lý tài khoản nội bộ: thêm, sửa, xóa và phân vai trò.',
    ],
  },
];

export default function UsageGuide() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-7">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={23} />
          Hướng dẫn sử dụng Tempo
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
          Màn hình này tóm tắt quy trình thao tác chuẩn để giáo viên/quản lý sử dụng hệ thống nhanh hơn,
          hạn chế sai sót khi điểm danh và ghi học phí.
        </p>

        <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
          <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
            <Lightbulb size={16} />
            Quy trình gợi ý trong ngày
          </h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-700 list-decimal pl-5">
            {quickSteps.map((step) => (
              <li key={step} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${section.color}`}>
                  <Icon size={19} />
                </div>
                <h3 className="font-bold text-slate-800">{section.title}</h3>
              </div>

              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="leading-relaxed flex gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}