/**
 * Seed script for Tempo demo data.
 *
 * Run `seedTempoDemoData()` once to create/update sample rows.
 * Run `seedTempoDemoDataForceReplace()` to clear all rows and re-seed.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Tempo')
    .addItem('Seed demo data', 'seedTempoDemoData')
    .addItem('Force reseed demo data', 'seedTempoDemoDataForceReplace')
    .addToUi();
}

function seedTempoDemoData() {
  seedTempoDemoDataInternal_(false);
}

function seedTempoDemoDataForceReplace() {
  seedTempoDemoDataInternal_(true);
}

function seedTempoDemoDataInternal_(forceReplace) {
  const now = new Date().toISOString();

  const shifts = [
    {
      id: 'sh_001',
      name: 'Ca 1',
      time: '17:30 - 19:00',
      weekday: 'Thứ 2',
      days: ['Thứ 2'],
      course: 'Piano Cơ Bản',
      createdAt: now,
    },
    {
      id: 'sh_002',
      name: 'Ca 2',
      time: '19:00 - 20:30',
      weekday: 'Thứ 4',
      days: ['Thứ 4'],
      course: 'Piano Trung Cấp',
      createdAt: now,
    },
    {
      id: 'sh_003',
      name: 'Ca 3',
      time: '08:00 - 09:30',
      weekday: 'Thứ 6',
      days: ['Thứ 6'],
      course: 'Nhạc Lý',
      createdAt: now,
    },
  ];

  const students = [
    {
      id: 'st_001',
      name: 'Nguyễn Minh An',
      phone: '0901001001',
      email: 'an.nguyen@gmail.com',
      birthDate: '2010-05-15',
      shifts: ['sh_001', 'sh_002'],
      status: 'active',
      joinDate: '2026-01-10',
      createdAt: now,
    },
    {
      id: 'st_002',
      name: 'Trần Gia Hân',
      phone: '0901001002',
      email: 'han.tran@gmail.com',
      birthDate: '2011-02-14',
      shifts: ['sh_001'],
      status: 'active',
      joinDate: '2026-02-15',
      createdAt: now,
    },
    {
      id: 'st_003',
      name: 'Phạm Đức Long',
      phone: '0901001003',
      email: 'long.pham@gmail.com',
      birthDate: '2009-08-05',
      shifts: ['sh_002', 'sh_003'],
      status: 'active',
      joinDate: '2026-01-20',
      createdAt: now,
    },
  ];

  const attendances = [
    {
      id: '2026-05-26_sh_001_st_001',
      date: '2026-05-26',
      shiftId: 'sh_001',
      studentId: 'st_001',
      status: 'present',
      note: '',
      updatedAt: now,
    },
    {
      id: '2026-05-26_sh_001_st_002',
      date: '2026-05-26',
      shiftId: 'sh_001',
      studentId: 'st_002',
      status: 'absent_excused',
      note: 'Xin phép',
      updatedAt: now,
    },
  ];

  const payments = [
    {
      id: 'pay_001',
      studentId: 'st_001',
      cycleIndex: 1,
      sessionsTarget: 24,
      shiftId: 'sh_001',
      month: '05/2026',
      amountPaid: 1200000,
      totalAmount: 2400000,
      status: 'partial',
      paymentDate: '2026-05-26',
      note: 'Đóng đợt 1',
      receiptUrl: '',
      updatedAt: now,
    },
    {
      id: 'pay_002',
      studentId: 'st_002',
      cycleIndex: 1,
      sessionsTarget: 24,
      shiftId: 'sh_002',
      month: '05/2026',
      amountPaid: 2400000,
      totalAmount: 2400000,
      status: 'paid',
      paymentDate: '2026-05-26',
      note: 'Đã thu đủ',
      receiptUrl: '',
      updatedAt: now,
    },
  ];

  const users = [
    {
      id: 'u_admin',
      name: 'Quản trị viên Tempo',
      email: 'admin@tempo.com',
      password: '',
      role: 'admin',
      createdAt: now,
    },
    {
      id: 'u_teacher',
      name: 'Cô giáo Minh Hằng',
      email: 'teacher@tempo.com',
      password: '',
      role: 'teacher',
      createdAt: now,
    },
  ];

  if (forceReplace) {
    clearCollectionData_('shifts');
    clearCollectionData_('students');
    clearCollectionData_('attendances');
    clearCollectionData_('payments');
    clearCollectionData_('users');
  }

  upsertMany_('shifts', shifts);
  upsertMany_('students', students);
  upsertMany_('attendances', attendances);
  upsertMany_('payments', payments);
  upsertMany_('users', users);

  SpreadsheetApp.getUi().alert(
    'Tempo seed',
    forceReplace
      ? 'Đã xóa dữ liệu cũ và đổ lại sample data cho 5 sheet.'
      : 'Đã đổ/update sample data cho 5 sheet.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function clearCollectionData_(collection) {
  validateCollection_(collection);
  const sheet = ensureSheet_(collection);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}