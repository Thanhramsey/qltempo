import { Attendance, Student, TuitionCycleType } from '../types';

export const COURSE_SESSION_TARGET = 24;
export const COURSE_FEE_VND = 2_400_000;
export const COURSE_WARNING_FROM_SESSION = 20;
export const SHORT_CYCLE_SESSION_TARGET = 8;
export const SHORT_CYCLE_FEE_VND = 800_000;
export const SHORT_CYCLE_WARNING_FROM_SESSION = 6;

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

export function getStudentPresentAttendances(attendances: Attendance[], studentId: string): Attendance[] {
  return attendances
    .filter((att) => att.studentId === studentId && att.status === 'present')
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.updatedAt.localeCompare(b.updatedAt);
    });
}

export function getStudentCycleProgress(
  attendances: Attendance[],
  studentId: string,
  sessionsTarget: number = COURSE_SESSION_TARGET,
  warningFromSession: number = COURSE_WARNING_FROM_SESSION
): StudentCycleProgress {
  const totalPresentSessions = getStudentPresentAttendances(attendances, studentId).length;
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
  sessionsTarget: number = COURSE_SESSION_TARGET
): CycleSessionsSlice {
  const history = getStudentPresentAttendances(attendances, studentId);
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
