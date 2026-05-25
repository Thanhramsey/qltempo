import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Users, UserPlus, Shield, Trash2, Lock, Mail, User, Sparkles, X, Key, ShieldCheck } from 'lucide-react';

interface UsersManagerProps {
  users: UserAccount[];
  currentUserAccount: UserAccount | null;
  onAddUser: (userInput: Omit<UserAccount, 'id' | 'createdAt'>) => Promise<void>;
  onEditUser: (userToEdit: UserAccount) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export default function UsersManager({ 
  users, 
  currentUserAccount,
  onAddUser, 
  onEditUser, 
  onDeleteUser 
}: UsersManagerProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'teacher'>('staff');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('staff');
    setError(null);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setError(null);
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || (!password.trim() && !editingUser)) {
      setError("Vui lòng điền đầy đủ thông tin: Họ tên, Email và Mật khẩu!");
      return;
    }

    if (email.indexOf('@') === -1) {
      setError("Vui lòng nhập định dạng email hợp lệ (ví dụ: b@g.com)!");
      return;
    }

    if (!editingUser && password.length < 6) {
      setError("Mật khẩu phải tối thiểu có 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        await onEditUser({
          ...editingUser,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password ? password.trim() : editingUser.password,
          role
        });
      } else {
        await onAddUser({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password.trim(),
          role
        });
      }
      setIsOpenForm(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Có lỗi xảy ra khi lưu thay đổi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: UserAccount) => {
    if (currentUserAccount && currentUserAccount.id === user.id) {
      alert("Bạn không thể tự xóa tài khoản của chính mình!");
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.name}" (${user.email}) khỏi hệ thống?`)) {
      try {
        await onDeleteUser(user.id);
      } catch (err: any) {
        console.error(err);
        alert("Gặp lỗi khi xóa tài khoản: " + (err?.message || ""));
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="text-indigo-600 shrink-0" size={24} />
            Quản lý tài khoản truy cập
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh sách và cấp quyền tài khoản cho giáo viên, nhân viên truy cập hệ thống.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-indigo-100 cursor-pointer w-fit"
        >
          <UserPlus size={15} />
          Thêm tài khoản truy cập
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((item) => {
          const isCurrentUser = currentUserAccount?.id === item.id;
          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border ${isCurrentUser ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100'} p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}
              id={`user-card-${item.id}`}
            >
              {isCurrentUser && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Bạn đang ở đây
                </div>
              )}

              <div className="space-y-4">
                {/* User Info Header */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 leading-normal">
                      {item.name}
                    </h3>
                    <span className="text-3xs text-slate-400 font-medium block mt-0.5">
                      Đăng ký: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Email and Auth */}
                <div className="space-y-1.5 pt-2 border-t border-slate-50 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={13} className="shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Shield size={13} className="shrink-0" />
                    <div>
                      Phân quyền:{' '}
                      <strong className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wide text-[9px] font-bold ${
                        item.role === 'admin' 
                          ? 'bg-rose-50 text-rose-700' 
                          : item.role === 'staff' 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {item.role === 'admin' ? 'Quản trị viên' : item.role === 'staff' ? 'Nhân viên' : 'Giáo viên'}
                      </strong>
                    </div>
                  </div>
                  {item.password && (
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                      <Lock size={13} className="shrink-0" />
                      <span className="font-mono">Mật khẩu: {item.password.replace(/./g, '•')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4 mt-6">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1 px-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1 px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT USER MODAL FORM */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden self-center animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-indigo-900 px-6 py-4 flex items-center justify-between text-white">
              <span className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles size={16} />
                {editingUser ? 'Cập nhật tài khoản' : 'Thêm tài khoản truy cập'}
              </span>
              <button 
                onClick={() => setIsOpenForm(false)}
                className="hover:bg-indigo-800 text-indigo-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 text-rose-700 text-xs font-semibold p-3.5 rounded-xl border-l-4 border-rose-500">
                  {error}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Họ và tên người dùng *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Thầy Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Email đăng nhập *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ví dụ: luan@edutrack.com"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                  {editingUser ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu đăng nhập *'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Giữ mật khẩu cũ' : 'Nhập mật khẩu ít nhất 6 ký tự'}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Vai trò chức vụ *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'staff', 'teacher'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 border rounded-xl text-3xs font-bold uppercase transition-all cursor-pointer text-center ${
                        role === r
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                          : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'admin' ? 'Chủ trường' : r === 'staff' ? 'Nhân viên' : 'Giáo viên'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-150"
                >
                  <ShieldCheck size={14} />
                  {loading ? 'Đang xử lý...' : 'Xác nhận lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
