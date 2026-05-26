import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { GraduationCap, LogIn, ShieldAlert, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';

interface AuthScreenProps {
  onCustomLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; userAccount?: UserAccount }>;
}

export default function AuthScreen({ onCustomLogin }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(
        "Không thể đăng nhập bằng Google. Lý do: " +
        (err.code === 'auth/unauthorized-domain' 
          ? "Tên miền hiện tại chưa được cấp quyền (unauthorized-domain) trong Firebase Console. Vui lòng đăng nhập bằng Email/Mật khẩu phía trên."
          : (err.message || "Lỗi mạng hoặc popup bị chặn.")) +
        " Bạn có thể sử dụng các tài khoản có sẵn dưới đây để đăng nhập ngay."
      );
    } finally {
      setLoading(false);
    }
  };

  // Custom Email/Password Login
  const handleCustomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng điền đầy đủ cả Email và Mật khẩu!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onCustomLogin(email.trim(), password.trim());
      if (!result.success) {
        setError(result.error || "Email hoặc Mật khẩu không chính xác!");
      }
    } catch (err: any) {
      console.error(err);
      setError("Đã xảy ra lỗi hệ thống khi đăng nhập: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <GraduationCap size={44} className="stroke-[1.5]" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-slate-950 font-sans">
          Tempo
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w">
          Hệ thống quản lý học sinh, ca học, điểm danh & học phí toàn diện
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-3xl sm:px-10 border border-slate-100 space-y-6">
          {error && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="ml-3">
                  <p className="text-3xs text-amber-800 font-bold uppercase tracking-wider">Thông báo từ hệ thống</p>
                  <p className="text-2xs text-amber-800 leading-normal mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form đăng nhập Email & Mật khẩu */}
          <form onSubmit={handleCustomFormSubmit} className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Sparkles size={16} className="text-indigo-600" />
              Đăng nhập bằng tài khoản
            </h3>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Email truy cập</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: admin@edutrack.com"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-10 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all duration-150 shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>{loading ? 'Đang xác minh...' : 'Đăng nhập hệ thống'}</span>
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="bg-white px-3">Hoặc sử dụng</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 h-11 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
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
              <span>Đăng nhập qua Gmail bằng Google</span>
            </button>
          </div>

          {/* Quick guide accounts reference block for easy testing */}
          {/* <div className="bg-slate-50 rounded-2xl p-4 text-[11px] leading-relaxed border border-slate-100 text-slate-500">
            <span className="font-bold text-slate-700 uppercase block text-[9px] tracking-wider mb-1">Tài khoản mẫu để thử nghiệm nhanh:</span>
            <div className="space-y-1">
              <div>• Email: <strong className="text-slate-700 font-mono">admin@edutrack.com</strong> | MK: <strong className="text-slate-700 font-mono">123456</strong></div>
              <div>• Email: <strong className="text-slate-700 font-mono">teacher@edutrack.com</strong> | MK: <strong className="text-slate-700 font-mono">123456</strong></div>
            </div>
            <span className="block mt-2 text-[9px] text-slate-400">
              * Khi đăng nhập bằng tài khoản nội bộ trực tuyến, hệ thống sẽ tự động cấu hình bộ nhớ đảm bảo trải nghiệm thông suốt.
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
