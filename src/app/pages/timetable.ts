import { Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../core/data.service';
import { I18nService, toIso } from '../core/i18n.service';
import { addDays, startOfWeek } from '../core/date-utils';
import { HOURS, WEEKDAYS } from '../core/models';

@Component({
  selector: 'app-timetable',
  imports: [],
  templateUrl: './timetable.html',
})
export class TimetablePage {
  readonly data = inject(DataService);
  readonly i18n = inject(I18nService);

  readonly hours = HOURS;
  readonly weekStart = signal(startOfWeek(new Date()));
  readonly saved = signal(false);

  readonly weekDays = computed(() =>
    WEEKDAYS.map((weekday, index) => {
      const date = addDays(this.weekStart(), index);
      return { weekday, date, iso: toIso(date) };
    }),
  );

  readonly holidayDates = computed(() => new Set(this.data.holidays().map((h) => h.date)));

  readonly rows = computed(() =>
    this.hours.map((hour) => ({
      hour,
      cells: this.weekDays().map((day) => ({
        ...day,
        holiday: this.holidayDates().has(day.iso),
        session: this.data.findSession(day.iso, hour),
      })),
    })),
  );

  readonly weeklySummary = computed(() => {
    const isoDates = new Set(this.weekDays().map((d) => d.iso));
    const weekSessions = this.data.sessions().filter((s) => isoDates.has(s.date));
    return this.data.modules().map((module) => ({
      module,
      hours: weekSessions.filter((s) => s.module_id === module.id).length,
    }));
  });

  changeWeek(delta: number): void {
    this.weekStart.update((date) => addDays(date, delta * 7));
  }

  goToday(): void {
    this.weekStart.set(startOfWeek(new Date()));
  }

  weekLabel(): string {
    const start = this.weekStart();
    const end = addDays(start, 4);
    return `${this.i18n.formatDayMonth(toIso(start))} — ${this.i18n.formatDayMonth(toIso(end))}`;
  }

  moduleColor(moduleId: string | undefined): string {
    return this.data.modules().find((m) => m.id === moduleId)?.color || '#4e73df';
  }

  async change(iso: string, hour: number, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    try {
      await this.data.setSession(iso, hour, value || null);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 1500);
    } catch {
      (event.target as HTMLSelectElement).value = this.data.findSession(iso, hour)?.module_id ?? '';
    }
  }

  async clearWeek(): Promise<void> {
    if (!confirm(this.i18n.t('common.deleteConfirm'))) return;
    for (const day of this.weekDays()) {
      for (const hour of this.hours) {
        if (this.data.findSession(day.iso, hour)) {
          await this.data.setSession(day.iso, hour, null);
        }
      }
    }
  }
}
