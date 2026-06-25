import React, { useMemo, useState } from 'react';
import { TuitionCycleConfigRecord } from '../types';
import { BookOpen, Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import ToastMessage, { ToastType } from './ui/ToastMessage';

interface TuitionCycleTypesManagerProps {
  cycleConfigs: TuitionCycleConfigRecord[];
  onAddCycleConfig: (payload: Omit<TuitionCycleConfigRecord, 'id' | 'createdAt'>) => Promise<void>;
  onEditCycleConfig: (payload: TuitionCycleConfigRecord) => Promise<void>;
  onDeleteCycleConfig: (id: string) => Promise<void>;
  studentsUsingConfigCount: (configId: string) => number;
}

export default function TuitionCycleTypesManager({
  cycleConfigs,
  onAddCycleConfig,
  onEditCycleConfig,
  onDeleteCycleConfig,
  studentsUsingConfigCount,
}: TuitionCycleTypesManagerProps) {
  const [editingConfig, setEditingConfig] = useState<TuitionCycleConfigRecord | null>(null);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const [name, setName] = useState('');
  const [sessionsTarget, setSessionsTarget] = useState(24);
  const [feeVnd, setFeeVnd] = useState(2_400_000);
  const [excusedAbsenceFree, setExcusedAbsenceFree] = useState(6);
  const [unexcusedAbsenceFree, setUnexcusedAbsenceFree] = useState(2);
  const [warningFromSession, setWarningFromSession] = useState(20);

  const showToast = (type: ToastType, message: string) => setToast({ type, message });

  const sortedConfigs = useMemo(() => {
    return [...cycleConfigs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [cycleConfigs]);

  const resetForm = () => {
    setName('');
    setSessionsTarget(24);
    setFeeVnd(2_400_000);
    setExcusedAbsenceFree(6);
    setUnexcusedAbsenceFree(2);
    setWarningFromSession(20);
    setEditingConfig(null);
  };

  const openAdd = () => {
    resetForm();
    setIsOpenForm(true);
  };

  const openEdit = (config: TuitionCycleConfigRecord) => {
    setEditingConfig(config);
    setName(config.name);
    setSessionsTarget(config.sessionsTarget);
    setFeeVnd(config.feeVnd);
    setExcusedAbsenceFree(config.excusedAbsenceFree);
    setUnexcusedAbsenceFree(config.unexcusedAbsenceFree);
    setWarningFromSession(config.warningFromSession);
    setIsOpenForm(true);
  };

  const closeForm = () => {
    setIsOpenForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeSessionsTarget = Math.max(1, Math.floor(sessionsTarget));
    const safeWarning = Math.max(1, Math.min(Math.floor(warningFromSession), safeSessionsTarget));

    if (!name.trim()) {
      showToast('warning', 'Vui lòng nhập tên loại chu kỳ.');
      return;
    }

    setLoading(true);
    try {
      if (editingConfig) {
        await onEditCycleConfig({
          ...editingConfig,
          name: name.trim(),
          sessionsTarget: safeSessionsTarget,
          feeVnd: Math.max(0, Math.floor(feeVnd)),
          excusedAbsenceFree: Math.max(0, Math.floor(excusedAbsenceFree)),
          unexcusedAbsenceFree: Math.max(0, Math.floor(unexcusedAbsenceFree)),
          warningFromSession: safeWarning,
        });
        showToast('success', 'Đã cập nhật loại chu kỳ.');
      } else {
        await onAddCycleConfig({
          name: name.trim(),
          sessionsTarget: safeSessionsTarget,
          feeVnd: Math.max(0, Math.floor(feeVnd)),
          excusedAbsenceFree: Math.max(0, Math.floor(excusedAbsenceFree)),
          unexcusedAbsenceFree: Math.max(0, Math.floor(unexcusedAbsenceFree)),
          warningFromSession: safeWarning,
        });
        showToast('success', 'Đã thêm loại chu kỳ mới.');
      }
      closeForm();
    } catch (err) {
      console.error(err);
      showToast('error', 'Không thể lưu loại chu kỳ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (config: TuitionCycleConfigRecord) => {
    const usageCount = studentsUsingConfigCount(config.id);
    if (usageCount > 0) {
      showToast('warning', `Không thể xóa. Đang có ${usageCount} học sinh sử dụng loại chu kỳ này.`);
      return;
    }

    if (cycleConfigs.length <= 1) {
      showToast('warning', 'Cần ít nhất 1 loại chu kỳ trong hệ thống.');
      return;
    }

    setLoading(true);
    try {
      await onDeleteCycleConfig(config.id);
      showToast('success', 'Đã xóa loại chu kỳ.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Không thể xóa loại chu kỳ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={24} />
            Loại Chu Kỳ Học Phí
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Cấu hình tên chu kỳ, số buổi, giá tiền và ngưỡng vắng cho phép.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer transition-all duration-200"
        >
          <Plus size={16} />
          Thêm Loại Chu Kỳ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {sortedConfigs.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Chưa có loại chu kỳ nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 border-b border-indigo-300 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Tên chu kỳ</th>
                  <th className="px-6 py-4">Số buổi</th>
                  <th className="px-6 py-4">Giá tiền</th>
                  <th className="px-6 py-4">Vắng có phép</th>
                  <th className="px-6 py-4">Vắng không phép</th>
                  <th className="px-6 py-4">Cảnh báo từ buổi</th>
                  <th className="px-6 py-4">Số học sinh dùng</th>
                  <th className="px-6 py-4 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {sortedConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{config.name}</td>
                    <td className="px-6 py-4">{config.sessionsTarget}</td>
                    <td className="px-6 py-4 font-bold text-indigo-700">{config.feeVnd.toLocaleString()} đ</td>
                    <td className="px-6 py-4">{config.excusedAbsenceFree}</td>
                    <td className="px-6 py-4">{config.unexcusedAbsenceFree}</td>
                    <td className="px-6 py-4">{config.warningFromSession}</td>
                    <td className="px-6 py-4">{studentsUsingConfigCount(config.id)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(config)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Sửa"
                          disabled={loading}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(config)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Xóa"
                          disabled={loading}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isOpenForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                {editingConfig ? 'Chỉnh Sửa Loại Chu Kỳ' : 'Thêm Loại Chu Kỳ'}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tên chu kỳ *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chu kỳ 12 buổi"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Số buổi học *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={sessionsTarget}
                    onChange={(e) => setSessionsTarget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Giá tiền (VND) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={feeVnd}
                    onChange={(e) => setFeeVnd(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vắng có phép cho phép</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={excusedAbsenceFree}
                    onChange={(e) => setExcusedAbsenceFree(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vắng không phép cho phép</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={unexcusedAbsenceFree}
                    onChange={(e) => setUnexcusedAbsenceFree(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cảnh báo từ buổi</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={warningFromSession}
                    onChange={(e) => setWarningFromSession(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Save size={14} />
                  <span>{editingConfig ? 'Lưu Chỉnh Sửa' : 'Thêm Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
