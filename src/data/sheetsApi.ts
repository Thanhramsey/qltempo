import { Attendance, Payment, Shift, Student, UserAccount } from '../types';

export type SheetsCollection = 'shifts' | 'students' | 'attendances' | 'payments' | 'users';

export interface SheetsAppData {
  shifts: Shift[];
  students: Student[];
  attendances: Attendance[];
  payments: Payment[];
  users: UserAccount[];
}

interface SheetsResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const sheetsApiUrl = (import.meta.env.VITE_SHEETS_API_URL || '').trim();
const sheetsApiToken = (import.meta.env.VITE_SHEETS_API_TOKEN || '').trim();

export function isSheetsConfigured() {
  return sheetsApiUrl.length > 0;
}

async function callSheetsApi<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  if (!isSheetsConfigured()) {
    throw new Error('VITE_SHEETS_API_URL chưa được cấu hình.');
  }

  const response = await fetch(sheetsApiUrl, {
    method: 'POST',
    headers: {
      // Apps Script Web App often rejects OPTIONS preflight (405), so keep this a simple request.
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action,
      token: sheetsApiToken || undefined,
      payload: payload || {}
    })
  });

  if (!response.ok) {
    throw new Error(`Sheets API trả về HTTP ${response.status}`);
  }

  const result = (await response.json()) as SheetsResponse<T>;
  if (!result.ok) {
    throw new Error(result.error || 'Sheets API trả về lỗi không xác định.');
  }

  if (typeof result.data === 'undefined') {
    throw new Error('Sheets API không trả dữ liệu hợp lệ.');
  }

  return result.data;
}

export async function loadSheetsData(): Promise<SheetsAppData> {
  const data = await callSheetsApi<Partial<SheetsAppData>>('getAll');
  return {
    shifts: data.shifts || [],
    students: data.students || [],
    attendances: data.attendances || [],
    payments: data.payments || [],
    users: data.users || []
  };
}

export async function upsertSheetsItem<T>(collection: SheetsCollection, item: T): Promise<void> {
  await callSheetsApi('upsert', { collection, item: item as unknown as Record<string, unknown> });
}

export async function upsertSheetsMany<T>(collection: SheetsCollection, items: T[]): Promise<void> {
  await callSheetsApi('upsertMany', { collection, items: items as unknown as Record<string, unknown>[] });
}

export async function deleteSheetsItem(collection: SheetsCollection, id: string): Promise<void> {
  await callSheetsApi('delete', { collection, id });
}
