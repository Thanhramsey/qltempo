import { Attendance, Student, TuitionCycleConfigRecord, TuitionCycleType } from '../types';

export const DEFAULT_TUITION_CYCLE_CONFIGS: TuitionCycleConfigRecord[] = [
  {
    id: 'cycle_24',
    name: 'Chu ky 24 buoi',
    sessionsTarget: 24,
    feeVnd: 2_400_000,
    excusedAbsenceFree: 6,
    unexcusedAbsenceFree: 2,
    warningFromSession: 20,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'cycle_8',
    name: 'Chu ky 8 buoi',
    sessionsTarget: 8,
    feeVnd: 800_000,
    excusedAbsenceFree: 2,
    unexcusedAbsenceFree: 1,
    warningFromSession: 6,
    createdAt: new Date('2026-01-01T00:00:01Z').toISOString(),
  },
];

export interface TuitionCycleConfig {
  type: TuitionCycleType;
  sessionsTarget: number;
  feeVnd: number;
  warningFromSession: number;
  label: string;
  name: string;
  excusedAbsenceFree: number;
  unexcusedAbsenceFree: number;
}

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

function normalizeConfig(record: TuitionCycleConfigRecord): TuitionCycleConfig {
  const sessionsTarget = toPositiveInt(record.sessionsTarget, 24);
  const feeVnd = Math.max(0, Math.floor(Number(record.feeVnd) || 0));
  const excusedAbsenceFree = Math.max(0, Math.floor(Number(record.excusedAbsenceFree) || 0));
  const unexcusedAbsenceFree = Math.max(0, Math.floor(Number(record.unexcusedAbsenceFree) || 0));
  const warningFromSession = Math.min(
    sessionsTarget,
    toPositiveInt(record.warningFromSession, Math.max(1, sessionsTarget - 4))
  );

  return {
    type: record.id,
    sessionsTarget,
    feeVnd,
    warningFromSession,
    name: record.name || `Chu ky ${sessionsTarget} buoi`,
    label: `${(record.name || `Chu ky ${sessionsTarget} buoi`).trim()} (${feeVnd.toLocaleString()}d / ${sessionsTarget} buoi)`,
    excusedAbsenceFree,
    unexcusedAbsenceFree,
  };
}

export function getTuitionCycleOptions(
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): TuitionCycleConfig[] {
  if (!cycleConfigs || cycleConfigs.length === 0) {
    return DEFAULT_TUITION_CYCLE_CONFIGS.map(normalizeConfig);
  }

  return cycleConfigs
    .filter((item) => item && item.id)
    .map(normalizeConfig);
}

export const TUITION_CYCLE_OPTIONS: TuitionCycleConfig[] = getTuitionCycleOptions();
export const DEFAULT_TUITION_CYCLE_TYPE: TuitionCycleType = DEFAULT_TUITION_CYCLE_CONFIGS[0].id;

export function resolveStudentTuitionCycleType(
  student?: Pick<Student, 'tuitionCycleType'>,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): TuitionCycleType {
  const options = getTuitionCycleOptions(cycleConfigs);
  const fallback = options[0]?.type || DEFAULT_TUITION_CYCLE_TYPE;
  const selected = student?.tuitionCycleType;
  if (!selected) return fallback;
  return options.some((option) => option.type === selected) ? selected : fallback;
}

export function getTuitionCycleConfig(
  cycleType?: TuitionCycleType,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): TuitionCycleConfig {
  const options = getTuitionCycleOptions(cycleConfigs);
  const fallback = options[0] || normalizeConfig(DEFAULT_TUITION_CYCLE_CONFIGS[0]);
  if (!cycleType) return fallback;
  return options.find((item) => item.type === cycleType) || fallback;
}

export interface StudentCycleProgress {
  totalPresentSessions: number;
  completedCycles: number;
  currentCycleIndex: number;
  currentCycleSessions: number;
  sessionsRemaining: number;
  isNearCycleEnd: boolean;
}

export interface CycleSessionsSlice {
  sessions: Attendance[];
  sessionsCount: number;
}

export interface StudentAbsenceSummary {
  excusedAbsenceCount: number;
  unexcusedAbsenceCount: number;
  hasReachedExcusedThreshold: boolean;
  hasReachedUnexcusedThreshold: boolean;
}

export function getAbsenceThresholds(
  cycleType?: TuitionCycleType,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
) {
  const config = getTuitionCycleConfig(cycleType, cycleConfigs);
  return {
    excusedFree: config.excusedAbsenceFree,
    unexcusedFree: config.unexcusedAbsenceFree,
  };
}

export function getStudentAbsenceSummary(
  attendances: Attendance[],
  studentId: string,
  cycleType?: TuitionCycleType,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): StudentAbsenceSummary {
  let excusedAbsenceCount = 0;
  let unexcusedAbsenceCount = 0;
  const thresholds = getAbsenceThresholds(cycleType, cycleConfigs);

  attendances.forEach((att) => {
    if (att.studentId !== studentId) return;

    if (att.status === 'absent_excused') {
      excusedAbsenceCount += 1;
      return;
    }

    if (att.status === 'absent_unexcused') {
      unexcusedAbsenceCount += 1;
    }
  });

  return {
    excusedAbsenceCount,
    unexcusedAbsenceCount,
    hasReachedExcusedThreshold: excusedAbsenceCount >= thresholds.excusedFree,
    hasReachedUnexcusedThreshold: unexcusedAbsenceCount >= thresholds.unexcusedFree,
  };
}

export function getStudentPresentAttendances(
  attendances: Attendance[],
  studentId: string,
  cycleType?: TuitionCycleType,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): Attendance[] {
  const thresholds = getAbsenceThresholds(cycleType, cycleConfigs);
  const history = attendances
    .filter((att) => att.studentId === studentId)
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.updatedAt.localeCompare(b.updatedAt);
    });

  let excusedAbsenceCount = 0;
  let unexcusedAbsenceCount = 0;

  return history.filter((att) => {
    if (att.status === 'present') return true;

    if (att.status === 'absent_excused') {
      excusedAbsenceCount += 1;
      return excusedAbsenceCount > thresholds.excusedFree;
    }

    if (att.status === 'absent_unexcused') {
      unexcusedAbsenceCount += 1;
      return unexcusedAbsenceCount > thresholds.unexcusedFree;
    }

    return false;
  });
}

export function getStudentCycleProgress(
  attendances: Attendance[],
  studentId: string,
  cycleType: TuitionCycleType | undefined,
  sessionsTarget: number,
  warningFromSession: number,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): StudentCycleProgress {
  const totalPresentSessions = getStudentPresentAttendances(attendances, studentId, cycleType, cycleConfigs).length;
  const safeSessionsTarget = Math.max(1, sessionsTarget);
  const safeWarningFromSession = Math.max(1, Math.min(warningFromSession, safeSessionsTarget));
  const completedCycles = Math.floor(totalPresentSessions / safeSessionsTarget);
  const currentCycleSessions = totalPresentSessions % safeSessionsTarget;

  return {
    totalPresentSessions,
    completedCycles,
    currentCycleIndex: completedCycles + 1,
    currentCycleSessions,
    sessionsRemaining: safeSessionsTarget - currentCycleSessions,
    isNearCycleEnd:
      currentCycleSessions >= safeWarningFromSession && currentCycleSessions < safeSessionsTarget,
  };
}

export function getStudentCycleSessions(
  attendances: Attendance[],
  studentId: string,
  cycleIndex: number,
  cycleType: TuitionCycleType | undefined,
  sessionsTarget: number,
  cycleConfigs: TuitionCycleConfigRecord[] = DEFAULT_TUITION_CYCLE_CONFIGS
): CycleSessionsSlice {
  const history = getStudentPresentAttendances(attendances, studentId, cycleType, cycleConfigs);
  const safeSessionsTarget = Math.max(1, sessionsTarget);
  const cycleStart = Math.max(0, (cycleIndex - 1) * safeSessionsTarget);
  const sessions = history.slice(cycleStart, cycleStart + safeSessionsTarget);

  return {
    sessions,
    sessionsCount: sessions.length,
  };
}

export function getMaxCycleIndexFromSessions(
  totalPresentSessions: number,
  sessionsTarget: number
): number {
  const safeSessionsTarget = Math.max(1, sessionsTarget);
  const completedCycles = Math.floor(totalPresentSessions / safeSessionsTarget);
  return completedCycles + 1;
}
