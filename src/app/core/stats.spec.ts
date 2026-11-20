import { describe, expect, it } from 'vitest';
import { buildStats, computeStats, expectedHours } from './stats';
import { AppData, emptyData, TimetableSlot } from './models';

function slot(weekday: number, hour: number, moduleId = 'm1'): TimetableSlot {
  return { id: `${weekday}-${hour}`, course_id: 'c1', weekday, hour, module_id: moduleId };
}

function baseData(): AppData {
  const data = emptyData();
  data.courses = [
    { id: 'c1', name: '2026-2027', start_date: '2026-09-07', end_date: '2026-09-18', active: true },
  ];
  data.modules = [{ id: 'm1', course_id: 'c1', name: 'Web', code: 'WEB', color: '#000' }];
  data.profiles = [
    { id: 's1', email: 's1@x.eus', full_name: 'S1', role: 'student', active: true },
    { id: 's2', email: 's2@x.eus', full_name: 'S2', role: 'student', active: true },
  ];
  data.enrollments = [
    { id: 'e1', course_id: 'c1', student_id: 's1' },
    { id: 'e2', course_id: 'c1', student_id: 's2' },
  ];
  return data;
}

describe('buildStats', () => {
  it('computes percentages over expected hours', () => {
    const stats = buildStats(100, 5, 5);
    expect(stats.total).toBe(10);
    expect(stats.justifiedPct).toBe(5);
    expect(stats.unjustifiedPct).toBe(5);
    expect(stats.totalPct).toBe(10);
    expect(stats.attendancePct).toBe(90);
  });

  it('handles zero expected hours', () => {
    const stats = buildStats(0, 0, 0);
    expect(stats.totalPct).toBe(0);
    expect(stats.attendancePct).toBe(100);
  });
});

describe('expectedHours', () => {
  it('counts scheduled hours on weekdays and skips holidays', () => {
    const slots = [slot(1, 8), slot(1, 9), slot(3, 10)];
    const hours = expectedHours(slots, new Set(['2026-09-09']), '2026-09-07', '2026-09-13');
    // Mon 2h, Wed slot skipped (holiday), no other weekday slots = 2
    expect(hours).toBe(2);
  });

  it('multiplies by students in computeStats', () => {
    const data = baseData();
    data.timetable = [slot(1, 8), slot(2, 8)];
    data.absences = [
      {
        id: 'a1',
        course_id: 'c1',
        student_id: 's1',
        date: '2026-09-07',
        hour: 8,
        module_id: 'm1',
        status: 'unjustified',
      },
      {
        id: 'a2',
        course_id: 'c1',
        student_id: 's2',
        date: '2026-09-08',
        hour: 8,
        module_id: 'm1',
        status: 'justified',
      },
    ];

    const stats = computeStats(data, {
      courseId: 'c1',
      studentIds: ['s1', 's2'],
      start: '2026-09-07',
      end: '2026-09-11',
    });

    // 2 weekly slots * 1 week * 2 students = 4 expected hours
    expect(stats.expected).toBe(4);
    expect(stats.justified).toBe(1);
    expect(stats.unjustified).toBe(1);
    expect(stats.total).toBe(2);
    expect(stats.totalPct).toBeCloseTo(50, 5);
  });

  it('filters by module', () => {
    const data = baseData();
    data.modules.push({ id: 'm2', course_id: 'c1', name: 'DB', code: 'DB', color: '#111' });
    data.timetable = [slot(1, 8, 'm1'), slot(1, 9, 'm2')];
    data.absences = [
      {
        id: 'a1',
        course_id: 'c1',
        student_id: 's1',
        date: '2026-09-07',
        hour: 9,
        module_id: 'm2',
        status: 'unjustified',
      },
    ];

    const stats = computeStats(data, {
      courseId: 'c1',
      studentIds: ['s1'],
      moduleId: 'm1',
      start: '2026-09-07',
      end: '2026-09-11',
    });

    expect(stats.expected).toBe(1);
    expect(stats.total).toBe(0);
  });
});
