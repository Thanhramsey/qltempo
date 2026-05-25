import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { GraduationCap, LogIn, Users, Zap, ShieldAlert } from 'lucide-react';

interface AuthScreenProps {
  onBypass: () => void;
}

export default function AuthScreen({ onBypass }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(
        "Không thể đăng nhập bằng Google. Lý do: " +
        (err.message || "Lỗi mạng hoặc popup bị chặn.") +
        " Bạn có thể sử dụng 'Chế độ Demo ngoại tuyến' để trải nghiệm ngay."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      console.log("Signed in anonymously:", result.user.uid);
    } catch (err: any) {
      console.error("Anonymous authentication failed:", err);
      // Fallback directly to bypassing
      onBypass();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <GraduationCap size={40} className="stroke-[1.5]" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 font-sans">
          EduTrack Pro
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w">
          Hệ thống quản lý học sinh, ca học và điểm danh chuyên cần thông minh
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
              <div className="flex">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="ml-3">
                  <p className="text-xs text-amber-800 leading-normal">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.45 7.55l3.86 3C6.22 7.52 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.17-2 3.42-4.94 3.42-8.56z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.31 14.45c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25L1.45 6.95C.52 8.81 0 10.88 0 13s.52 4.19 1.45 6.05l3.86-3.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.22 1.1-3.13 0-5.78-2.48-6.69-5.51L1.45 16.4C3.37 20.3 7.35 23 12 23z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <button
              onClick={handleDemoMode}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
            >
              <LogIn size={18} />
              <span>Sử dụng ngay (Chế độ Trực tuyến)</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs text-slate-400 font-medium">
                <span className="bg-white px-2">HOẶC</span>
              </div>
            </div>

            <button
              onClick={onBypass}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-sm font-semibold text-slate-500 hover:text-indigo-600 bg-transparent transition-all duration-200 cursor-pointer"
            >
              <Zap size={18} />
              <span>Bật chế độ thử nghiệm / Demo ngoại tuyến</span>
            </button>
          </div>

          <div className="mt-6 text-2xs text-slate-400 text-center leading-relaxed">
            Dữ liệu của bạn được lưu trữ an toàn, thời gian thực trên cơ sở dữ liệu Firestore.
            Chế độ Demo ngoại tuyến cho phép bạn trải nghiệm đầy đủ tính năng mà không cần lưu lên đám mây.
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Users size={14} />
            <span>Đóng học phí tiện lợi</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <GraduationCap size={14} />
            <span>Điểm danh dễ dàng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
