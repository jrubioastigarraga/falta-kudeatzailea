import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { emptyStats, computeStats } from '../core/stats';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly data = inject(DataService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly course = this.data.selectedCourse;

  readonly studentIds = computed(() => {
    if (this.auth.isAdmin()) {
      return this.data.enrolledStudents().map((s) => s.id);
    }
    return this.auth.user() ? [this.auth.user()!.id] : [];
  });

  readonly overall = computed(() => {
    const course = this.course();
    if (!course) return emptyStats();
    return computeStats(this.data.data(), {
      courseId: course.id,
      studentIds: this.studentIds(),
      start: course.start_date,
      end: course.end_date,
    });
  });

  readonly moduleRows = computed(() => {
    const course = this.course();
    if (!course) return [];
    return this.data.modules().map((module) => ({
      module,
      stats: computeStats(this.data.data(), {
        courseId: course.id,
        studentIds: this.studentIds(),
        moduleId: module.id,
        start: course.start_date,
        end: course.end_date,
      }),
    }));
  });

  readonly recent = computed(() => {
    const ids = new Set(this.studentIds());
    return this.data
      .absences()
      .filter((a) => ids.has(a.student_id))
      .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour)
      .slice(0, 8);
  });

  studentName(id: string): string {
    return this.data.profiles().find((p) => p.id === id)?.full_name ?? '—';
  }

  moduleName(id: string): string {
    return this.data.modules().find((m) => m.id === id)?.name ?? '—';
  }

  percent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
