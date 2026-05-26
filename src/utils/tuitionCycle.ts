import { Attendance } from '../types';

export const COURSE_SESSION_TARGET = 24;
export const COURSE_FEE_VND = 2_400_000;
export const COURSE_WARNING_FROM_SESSION = 20;

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

export function getStudentCycleProgress(attendances: Attendance[], studentId: string): StudentCycleProgress {
  const totalPresentSessions = getStudentPresentAttendances(attendances, studentId).length;
  const completedCycles = Math.floor(totalPresentSessions / COURSE_SESSION_TARGET);
  const currentCycleSessions = totalPresentSessions % COURSE_SESSION_TARGET;

  return {
    totalPresentSessions,
    completedCycles,
    currentCycleIndex: completedCycles + 1,
    currentCycleSessions,
    sessionsRemaining: COURSE_SESSION_TARGET - currentCycleSessions,
    isNearCycleEnd:
      currentCycleSessions >= COURSE_WARNING_FROM_SESSION && currentCycleSessions < COURSE_SESSION_TARGET,
  };
}

export function getStudentCycleSessions(
  attendances: Attendance[],
  studentId: string,
  cycleIndex: number
): CycleSessionsSlice {
  const history = getStudentPresentAttendances(attendances, studentId);
  const cycleStart = Math.max(0, (cycleIndex - 1) * COURSE_SESSION_TARGET);
  const sessions = history.slice(cycleStart, cycleStart + COURSE_SESSION_TARGET);

  return {
    sessions,
    sessionsCount: sessions.length,
  };
}

export function getMaxCycleIndexFromSessions(totalPresentSessions: number): number {
  const completedCycles = Math.floor(totalPresentSessions / COURSE_SESSION_TARGET);
  return completedCycles + 1;
}
