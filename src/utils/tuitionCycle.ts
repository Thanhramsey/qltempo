import { Attendance, Student, TuitionCycleType } from '../types';

export const COURSE_SESSION_TARGET = 24;
export const COURSE_FEE_VND = 2_400_000;
export const COURSE_WARNING_FROM_SESSION = 20;
export const SHORT_CYCLE_SESSION_TARGET = 8;
export const SHORT_CYCLE_FEE_VND = 800_000;
export const SHORT_CYCLE_WARNING_FROM_SESSION = 6;

// For 24-session cycle
export const COURSE_EXCUSED_ABSENCE_FREE_SESSIONS = 6;
export const COURSE_UNEXCUSED_ABSENCE_FREE_SESSIONS = 2;

// For 8-session cycle
export const SHORT_CYCLE_EXCUSED_ABSENCE_FREE_SESSIONS = 2;
export const SHORT_CYCLE_UNEXCUSED_ABSENCE_FREE_SESSIONS = 1;

// Legacy exports for backward compatibility
export const EXCUSED_ABSENCE_FREE_SESSIONS = COURSE_EXCUSED_ABSENCE_FREE_SESSIONS;
export const UNEXCUSED_ABSENCE_FREE_SESSIONS = COURSE_UNEXCUSED_ABSENCE_FREE_SESSIONS;

export const DEFAULT_TUITION_CYCLE_TYPE: TuitionCycleType = 'cycle_24';

export interface TuitionCycleConfig {
  type: TuitionCycleType;
  sessionsTarget: number;
  feeVnd: number;
  warningFromSession: number;
  label: string;
}

export const TUITION_CYCLE_CONFIGS: Record<TuitionCycleType, TuitionCycleConfig> = {
  cycle_24: {
    type: 'cycle_24',
    sessionsTarget: COURSE_SESSION_TARGET,
    feeVnd: COURSE_FEE_VND,
    warningFromSession: COURSE_WARNING_FROM_SESSION,
    label: '2.400.000đ / 24 buổi',
  },
  cycle_8: {
    type: 'cycle_8',
    sessionsTarget: SHORT_CYCLE_SESSION_TARGET,
    feeVnd: SHORT_CYCLE_FEE_VND,
    warningFromSession: SHORT_CYCLE_WARNING_FROM_SESSION,
    label: '800.000đ / 8 buổi',
  },
};

export const TUITION_CYCLE_OPTIONS: TuitionCycleConfig[] = [
  TUITION_CYCLE_CONFIGS.cycle_24,
  TUITION_CYCLE_CONFIGS.cycle_8,
];

export function resolveStudentTuitionCycleType(student?: Pick<Student, 'tuitionCycleType'>): TuitionCycleType {
  return student?.tuitionCycleType || DEFAULT_TUITION_CYCLE_TYPE;
}

export function getTuitionCycleConfig(cycleType?: TuitionCycleType): TuitionCycleConfig {
  const safeType = cycleType || DEFAULT_TUITION_CYCLE_TYPE;
  return TUITION_CYCLE_CONFIGS[safeType] || TUITION_CYCLE_CONFIGS[DEFAULT_TUITION_CYCLE_TYPE];
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

export function getAbsenceThresholds(cycleType: TuitionCycleType = 'cycle_24') {
  if (cycleType === 'cycle_8') {
    return {
      excusedFree: SHORT_CYCLE_EXCUSED_ABSENCE_FREE_SESSIONS,
      unexcusedFree: SHORT_CYCLE_UNEXCUSED_ABSENCE_FREE_SESSIONS,
    };
  }
  return {
    excusedFree: COURSE_EXCUSED_ABSENCE_FREE_SESSIONS,
    unexcusedFree: COURSE_UNEXCUSED_ABSENCE_FREE_SESSIONS,
  };
}

export function getStudentAbsenceSummary(
  attendances: Attendance[],
  studentId: string,
  cycleType: TuitionCycleType = 'cycle_24'
): StudentAbsenceSummary {
  let excusedAbsenceCount = 0;
  let unexcusedAbsenceCount = 0;
  const thresholds = getAbsenceThresholds(cycleType);

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
  cycleType: TuitionCycleType = 'cycle_24'
): Attendance[] {
  const thresholds = getAbsenceThresholds(cycleType);
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
  cycleType: TuitionCycleType = 'cycle_24',
  sessionsTarget: number = COURSE_SESSION_TARGET,
  warningFromSession: number = COURSE_WARNING_FROM_SESSION
): StudentCycleProgress {
  const totalPresentSessions = getStudentPresentAttendances(attendances, studentId, cycleType).length;
  const completedCycles = Math.floor(totalPresentSessions / sessionsTarget);
  const currentCycleSessions = totalPresentSessions % sessionsTarget;

  return {
    totalPresentSessions,
    completedCycles,
    currentCycleIndex: completedCycles + 1,
    currentCycleSessions,
    sessionsRemaining: sessionsTarget - currentCycleSessions,
    isNearCycleEnd:
      currentCycleSessions >= warningFromSession && currentCycleSessions < sessionsTarget,
  };
}

export function getStudentCycleSessions(
  attendances: Attendance[],
  studentId: string,
  cycleIndex: number,
  cycleType: TuitionCycleType = 'cycle_24',
  sessionsTarget: number = COURSE_SESSION_TARGET
): CycleSessionsSlice {
  const history = getStudentPresentAttendances(attendances, studentId, cycleType);
  const cycleStart = Math.max(0, (cycleIndex - 1) * sessionsTarget);
  const sessions = history.slice(cycleStart, cycleStart + sessionsTarget);

  return {
    sessions,
    sessionsCount: sessions.length,
  };
}

export function getMaxCycleIndexFromSessions(
  totalPresentSessions: number,
  sessionsTarget: number = COURSE_SESSION_TARGET
): number {
  const completedCycles = Math.floor(totalPresentSessions / sessionsTarget);
  return completedCycles + 1;
}
