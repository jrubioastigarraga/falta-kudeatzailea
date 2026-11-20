import { Absence, AppData, TimetableSlot } from './models';
import { eachDate, isWeekend, weekdayNumber } from './date-utils';

export interface AttendanceStats {
  expected: number;
  justified: number;
  unjustified: number;
  total: number;
  justifiedPct: number;
  unjustifiedPct: number;
  totalPct: number;
  attendancePct: number;
}

export interface StatsScope {
  courseId: string;
  studentIds: string[];
  moduleId?: string | null;
  start: string;
  end: string;
}

export function emptyStats(): AttendanceStats {
  return {
    expected: 0,
    justified: 0,
    unjustified: 0,
    total: 0,
    justifiedPct: 0,
    unjustifiedPct: 0,
    totalPct: 0,
    attendancePct: 100,
  };
}

export function computeStats(data: AppData, scope: StatsScope): AttendanceStats {
  const studentIds = new Set(scope.studentIds);
  if (!studentIds.size || !scope.start || !scope.end) return emptyStats();

  const holidaySet = new Set(
    data.holidays.filter((h) => h.course_id === scope.courseId).map((h) => h.date),
  );
  const slots = data.timetable.filter(
    (t) => t.course_id === scope.courseId && (!scope.moduleId || t.module_id === scope.moduleId),
  );

  const expectedPerStudent = expectedHours(slots, holidaySet, scope.start, scope.end);
  const expected = expectedPerStudent * studentIds.size;

  const absences = data.absences.filter(
    (a) =>
      a.course_id === scope.courseId &&
      studentIds.has(a.student_id) &&
      a.date >= scope.start &&
      a.date <= scope.end &&
      (!scope.moduleId || a.module_id === scope.moduleId),
  );

  const justified = absences.filter((a) => a.status === 'justified').length;
  const unjustified = absences.filter((a) => a.status === 'unjustified').length;
  const total = justified + unjustified;

  return buildStats(expected, justified, unjustified);
}

export function buildStats(
  expected: number,
  justified: number,
  unjustified: number,
): AttendanceStats {
  const total = justified + unjustified;
  const safeExpected = expected || 0;
  return {
    expected: safeExpected,
    justified,
    unjustified,
    total,
    justifiedPct: safeExpected ? (justified / safeExpected) * 100 : 0,
    unjustifiedPct: safeExpected ? (unjustified / safeExpected) * 100 : 0,
    totalPct: safeExpected ? (total / safeExpected) * 100 : 0,
    attendancePct: safeExpected ? ((safeExpected - total) / safeExpected) * 100 : 100,
  };
}

export function expectedHours(
  slots: TimetableSlot[],
  holidaySet: Set<string>,
  start: string,
  end: string,
): number {
  if (!slots.length) return 0;
  const slotsByWeekday = new Map<number, number>();
  for (const slot of slots) {
    slotsByWeekday.set(slot.weekday, (slotsByWeekday.get(slot.weekday) ?? 0) + 1);
  }
  let hours = 0;
  for (const iso of eachDate(start, end)) {
    if (holidaySet.has(iso)) continue;
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isWeekend(date)) continue;
    hours += slotsByWeekday.get(weekdayNumber(date)) ?? 0;
  }
  return hours;
}

export function absencesFor(
  data: AppData,
  courseId: string,
  studentIds: string[],
  start: string,
  end: string,
  moduleId?: string | null,
): Absence[] {
  const ids = new Set(studentIds);
  return data.absences.filter(
    (a) =>
      a.course_id === courseId &&
      ids.has(a.student_id) &&
      a.date >= start &&
      a.date <= end &&
      (!moduleId || a.module_id === moduleId),
  );
}

export function overallForCourse(data: AppData, courseId: string): AttendanceStats {
  const course = data.courses.find((c) => c.id === courseId);
  if (!course) return emptyStats();
  const studentIds = data.enrollments
    .filter((e) => e.course_id === courseId)
    .map((e) => e.student_id);
  return computeStats(data, {
    courseId,
    studentIds,
    start: course.start_date,
    end: course.end_date,
  });
}
