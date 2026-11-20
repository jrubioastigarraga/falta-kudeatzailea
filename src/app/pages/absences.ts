import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { I18nService, toIso } from '../core/i18n.service';
import { addDays, startOfWeek } from '../core/date-utils';
import { HOURS, WEEKDAYS } from '../core/models';

interface Cell {
  weekday: number;
  hour: number;
  iso: string;
  day: number;
  holiday: boolean;
  outOfCourse: boolean;
  today: boolean;
  moduleId?: string;
  moduleCode?: string;
  status: 'justified' | 'unjustified' | null;
}

@Component({
  selector: 'app-absences',
  imports: [RouterLink],
  templateUrl: './absences.html',
})
export class AbsencesPage {
  readonly data = inject(DataService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly weekStart = signal(startOfWeek(new Date()));
  readonly selectedStudentId = signal('');
  readonly error = signal<string | null>(null);
  readonly savingKey = signal<string | null>(null);

  readonly hours = HOURS;

  constructor() {
    effect(() => {
      const ids = this.students().map((s) => s.id);
      if (!ids.includes(this.selectedStudentId())) {
        this.selectedStudentId.set(ids[0] ?? '');
      }
    });
  }

  readonly students = computed(() => {
    if (this.auth.isAdmin()) return this.data.enrolledStudents();
    const id = this.auth.user()?.id;
    return this.data.students().filter((s) => s.id === id);
  });

  readonly weekDays = computed(() =>
    WEEKDAYS.map((weekday, index) => {
      const date = addDays(this.weekStart(), index);
      return { weekday, date, iso: toIso(date) };
    }),
  );

  readonly holidayDates = computed(
    () => new Set(this.data.holidays().map((h) => h.date)),
  );

  readonly course = this.data.selectedCourse;

  readonly summary = computed(() => {
    const studentId = this.selectedStudentId();
    const dates = new Set(this.weekDays().map((d) => d.iso));
    const list = this.data
      .absences()
      .filter((a) => a.student_id === studentId && dates.has(a.date));
    return {
      justified: list.filter((a) => a.status === 'justified').length,
      unjustified: list.filter((a) => a.status === 'unjustified').length,
      total: list.length,
    };
  });

  readonly rows = computed(() => {
    const studentId = this.selectedStudentId();
    const course = this.course();
    const holidays = this.holidayDates();
    const todayIso = toIso(new Date());

    return this.hours.map((hour) => ({
      hour,
      cells: this.weekDays().map<Cell>((day) => {
        const slot = this.data.findSlot(day.weekday, hour);
        const absence = studentId
          ? this.data.findAbsence(studentId, day.iso, hour)
          : undefined;
        const module = slot
          ? this.data.modules().find((m) => m.id === slot.module_id)
          : undefined;
        return {
          weekday: day.weekday,
          hour,
          iso: day.iso,
          day: day.date.getDate(),
          holiday: holidays.has(day.iso),
          outOfCourse: !!course && (day.iso < course.start_date || day.iso > course.end_date),
          today: day.iso === todayIso,
          moduleId: slot?.module_id,
          moduleCode: module?.code || module?.name,
          status: absence?.status ?? null,
        };
      }),
    }));
  });

  readonly canEdit = this.auth.isAdmin;

  changeWeek(delta: number): void {
    this.weekStart.update((date) => addDays(date, delta * 7));
  }

  goToday(): void {
    this.weekStart.set(startOfWeek(new Date()));
  }

  selectStudent(event: Event): void {
    this.selectedStudentId.set((event.target as HTMLSelectElement).value);
  }

  async cycle(cell: Cell): Promise<void> {
    if (!this.canEdit() || !cell.moduleId || cell.holiday || cell.outOfCourse) return;
    const studentId = this.selectedStudentId();
    if (!studentId) return;

    const next =
      cell.status === null ? 'justified' : cell.status === 'justified' ? 'unjustified' : null;
    const key = `${cell.iso}-${cell.hour}`;
    this.savingKey.set(key);
    this.error.set(null);
    try {
      await this.data.setAbsence(studentId, cell.iso, cell.hour, cell.moduleId, next);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.i18n.t('common.error'));
    } finally {
      this.savingKey.set(null);
    }
  }

  label(status: Cell['status']): string {
    if (status === 'justified') return this.i18n.t('status.justified');
    if (status === 'unjustified') return this.i18n.t('status.unjustified');
    return this.i18n.t('status.present');
  }

  weekLabel(): string {
    const start = this.weekStart();
    const end = addDays(start, 4);
    return `${this.i18n.formatDayMonth(toIso(start))} — ${this.i18n.formatDayMonth(toIso(end))}`;
  }

  studentName(): string {
    return this.students().find((s) => s.id === this.selectedStudentId())?.full_name ?? '';
  }
}
