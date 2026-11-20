import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { AttendanceStats, computeStats, emptyStats } from '../core/stats';
import { ReportRow, StatsTable } from '../shared/stats-table';

type Tab = 'summary' | 'evaluations' | 'challenges' | 'modules';

@Component({
  selector: 'app-reports',
  imports: [FormsModule, StatsTable],
  templateUrl: './reports.html',
})
export class ReportsPage {
  readonly data = inject(DataService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  readonly tab = signal<Tab>('summary');
  readonly studentFilter = signal('');
  readonly moduleFilter = signal(this.route.snapshot.queryParamMap.get('module') ?? '');

  readonly students = computed(() =>
    this.auth.isAdmin()
      ? this.data.enrolledStudents()
      : this.data.students().filter((s) => s.id === this.auth.user()?.id),
  );

  readonly studentIds = computed(() => {
    const selected = this.studentFilter();
    if (selected) return [selected];
    if (this.auth.isAdmin()) return this.data.enrolledStudents().map((s) => s.id);
    return this.auth.user() ? [this.auth.user()!.id] : [];
  });

  readonly course = this.data.selectedCourse;

  readonly courseStats = computed<AttendanceStats>(() => {
    const course = this.course();
    if (!course) return emptyStats();
    return this.scope(course.start_date, course.end_date, this.moduleFilter() || null);
  });

  readonly moduleRows = computed<ReportRow[]>(() => {
    const course = this.course();
    if (!course) return [];
    const filter = this.moduleFilter();
    return this.data
      .modules()
      .filter((m) => !filter || m.id === filter)
      .map((module) => ({
        name: module.name,
        subtitle: module.code || undefined,
        stats: this.scope(course.start_date, course.end_date, module.id),
      }));
  });

  readonly evaluationRows = computed<ReportRow[]>(() =>
    this.data.evaluations().map((evaluation) => ({
      name: evaluation.name,
      subtitle: `${this.i18n.formatDate(evaluation.start_date)} — ${this.i18n.formatDate(evaluation.end_date)}`,
      stats: this.scope(
        evaluation.start_date,
        evaluation.end_date,
        this.moduleFilter() || null,
      ),
    })),
  );

  readonly challengeRows = computed<ReportRow[]>(() => {
    const sala = this.data.modules().find((m) => m.code === 'SALA' || m.name === 'Sala');
    return this.data.challenges().map((challenge) => {
      const moduleId = this.moduleFilter() || challenge.module_id || null;
      const module = this.data.modules().find((m) => m.id === moduleId);
      const excludeModuleId =
        !this.moduleFilter() && !challenge.module_id ? (sala?.id ?? null) : null;
      return {
        name: challenge.name,
        subtitle: `${module?.name ?? this.i18n.t('reports.allModules')} · ${this.i18n.formatDate(
          challenge.start_date,
        )} — ${this.i18n.formatDate(challenge.end_date)}`,
        stats: this.scope(
          challenge.start_date,
          challenge.end_date,
          moduleId,
          excludeModuleId,
        ),
      };
    });
  });

  readonly overallRows = computed<ReportRow[]>(() => {
    const course = this.course();
    if (!course) return [];
    return [
      {
        name: course.name,
        subtitle: `${this.i18n.formatDate(course.start_date)} — ${this.i18n.formatDate(
          course.end_date,
        )}`,
        stats: this.courseStats(),
      },
    ];
  });

  private scope(
    start: string,
    end: string,
    moduleId: string | null,
    excludeModuleId: string | null = null,
  ): AttendanceStats {
    const course = this.course();
    if (!course) return emptyStats();
    return computeStats(this.data.data(), {
      courseId: course.id,
      studentIds: this.studentIds(),
      moduleId,
      excludeModuleId,
      start,
      end,
    });
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  currentRows(): ReportRow[] {
    switch (this.tab()) {
      case 'evaluations':
        return this.evaluationRows();
      case 'challenges':
        return this.challengeRows();
      case 'modules':
        return this.moduleRows();
      default:
        return this.overallRows();
    }
  }

  pct(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  exportCsv(): void {
    const header = [
      this.i18n.t('common.name'),
      this.i18n.t('common.course'),
      this.i18n.t('reports.expectedHours'),
      this.i18n.t('reports.justified'),
      this.i18n.t('reports.justifiedShort') + ' %',
      this.i18n.t('reports.unjustified'),
      this.i18n.t('reports.unjustifiedShort') + ' %',
      this.i18n.t('reports.totalAbsences'),
      this.i18n.t('reports.percentOfHours'),
    ];
    const course = this.course();
    const lines = [header.join(';')];
    const groups: Array<[string, ReportRow[]]> = [
      [this.i18n.t('reports.summary'), this.overallRows()],
      [this.i18n.t('reports.byEvaluation'), this.evaluationRows()],
      [this.i18n.t('reports.byChallenge'), this.challengeRows()],
      [this.i18n.t('reports.byModule'), this.moduleRows()],
    ];
    for (const [group, rows] of groups) {
      for (const row of rows) {
        lines.push(
          [
            group,
            `"${row.name.replace(/"/g, '""')}"`,
            course?.name ?? '',
            row.stats.expected,
            row.stats.justified,
            row.stats.justifiedPct.toFixed(1),
            row.stats.unjustified,
            row.stats.unjustifiedPct.toFixed(1),
            row.stats.total,
            row.stats.totalPct.toFixed(1),
          ].join(';'),
        );
      }
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `faltak-${course?.name ?? 'course'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
