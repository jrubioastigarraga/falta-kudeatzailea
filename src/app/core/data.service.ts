import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { isDemoMode, supabase } from './supabase';
import { loadDemoCredentials, loadDemoData, saveDemoCredentials, saveDemoData } from './demo-store';
import {
  Absence,
  AbsenceStatus,
  AppData,
  Challenge,
  Course,
  Enrollment,
  Evaluation,
  Holiday,
  Module,
  Profile,
  TimetableSlot,
  emptyData,
} from './models';

const COURSE_KEY = 'fk_selected_course';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly auth = inject(AuthService);

  readonly data = signal<AppData>(emptyData());
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isDemo = isDemoMode;

  readonly selectedCourseId = signal<string>(localStorage.getItem(COURSE_KEY) ?? '');

  readonly courses = computed(() => this.data().courses);
  readonly selectedCourse = computed<Course | null>(() => {
    const id = this.selectedCourseId();
    return this.data().courses.find((c) => c.id === id) ?? null;
  });
  readonly evaluations = computed(() =>
    this.data()
      .evaluations.filter((e) => e.course_id === this.selectedCourseId())
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
  );
  readonly holidays = computed(() =>
    this.data()
      .holidays.filter((h) => h.course_id === this.selectedCourseId())
      .sort((a, b) => a.date.localeCompare(b.date)),
  );
  readonly modules = computed(() =>
    this.data()
      .modules.filter((m) => m.course_id === this.selectedCourseId())
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  readonly challenges = computed(() =>
    this.data()
      .challenges.filter((c) => c.course_id === this.selectedCourseId())
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
  );
  readonly timetable = computed(() =>
    this.data().timetable.filter((t) => t.course_id === this.selectedCourseId()),
  );
  readonly profiles = computed(() => this.data().profiles);
  readonly students = computed(() =>
    this.data()
      .profiles.filter((p) => p.role === 'student')
      .sort((a, b) => a.full_name.localeCompare(b.full_name)),
  );
  readonly enrolledStudents = computed(() => {
    const courseId = this.selectedCourseId();
    const ids = new Set(
      this.data()
        .enrollments.filter((e) => e.course_id === courseId)
        .map((e) => e.student_id),
    );
    return this.students().filter((s) => ids.has(s.id));
  });
  readonly absences = computed(() =>
    this.data().absences.filter((a) => a.course_id === this.selectedCourseId()),
  );

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        void this.reload();
      } else {
        this.data.set(emptyData());
        this.loading.set(false);
      }
    });
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (isDemoMode) {
        this.data.set(loadDemoData());
      } else if (supabase) {
        const tables = [
          'courses',
          'evaluations',
          'holidays',
          'modules',
          'challenges',
          'timetable',
          'profiles',
          'enrollments',
          'absences',
        ] as const;
        const results = await Promise.all(
          tables.map((table) => supabase!.from(table).select('*')),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw new Error(failed.error.message);
        const next = emptyData();
        results.forEach((result, index) => {
          (next as unknown as Record<string, unknown>)[tables[index]] = result.data ?? [];
        });
        this.data.set(next);
      }
      this.ensureSelectedCourse();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }

  private ensureSelectedCourse(): void {
    const courses = this.data().courses;
    if (!courses.length) {
      this.selectedCourseId.set('');
      return;
    }
    const current = this.selectedCourseId();
    if (courses.some((c) => c.id === current)) return;
    const active = courses.find((c) => c.active) ?? courses[0];
    this.selectCourse(active.id);
  }

  selectCourse(id: string): void {
    this.selectedCourseId.set(id);
    localStorage.setItem(COURSE_KEY, id);
  }

  // ---------------------------------------------------------------------------
  // Courses
  // ---------------------------------------------------------------------------

  async saveCourse(course: Partial<Course>): Promise<void> {
    if (course.id) {
      await this.update('courses', course.id, course);
    } else {
      const created = await this.insert<Course>('courses', {
        name: course.name ?? '',
        start_date: course.start_date ?? '',
        end_date: course.end_date ?? '',
        active: this.data().courses.length === 0,
      });
      if (created?.id) this.selectCourse(created.id);
    }
    await this.reload();
  }

  async deleteCourse(id: string): Promise<void> {
    await this.remove('courses', id);
    await this.reload();
  }

  async setActiveCourse(id: string): Promise<void> {
    if (isDemoMode) {
      const next = {
        ...this.data(),
        courses: this.data().courses.map((c) => ({ ...c, active: c.id === id })),
      };
      this.commitDemo(next);
    } else if (supabase) {
      await supabase.from('courses').update({ active: false }).neq('id', id);
      await supabase.from('courses').update({ active: true }).eq('id', id);
    }
    await this.reload();
    this.selectCourse(id);
  }

  // ---------------------------------------------------------------------------
  // Evaluations
  // ---------------------------------------------------------------------------

  async saveEvaluation(evaluation: Partial<Evaluation>): Promise<void> {
    const payload = { ...evaluation, course_id: this.selectedCourseId() };
    if (evaluation.id) {
      await this.update('evaluations', evaluation.id, payload);
    } else {
      payload.position = payload.position ?? this.evaluations().length + 1;
      await this.insert('evaluations', payload);
    }
    await this.reload();
  }

  async deleteEvaluation(id: string): Promise<void> {
    await this.remove('evaluations', id);
    await this.reload();
  }

  // ---------------------------------------------------------------------------
  // Holidays
  // ---------------------------------------------------------------------------

  async addHoliday(date: string, name: string): Promise<void> {
    await this.insert('holidays', {
      course_id: this.selectedCourseId(),
      date,
      name,
    });
    await this.reload();
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.remove('holidays', id);
    await this.reload();
  }

  // ---------------------------------------------------------------------------
  // Modules
  // ---------------------------------------------------------------------------

  async saveModule(module: Partial<Module>): Promise<void> {
    const payload = { ...module, course_id: this.selectedCourseId() };
    if (module.id) {
      await this.update('modules', module.id, payload);
    } else {
      await this.insert('modules', payload);
    }
    await this.reload();
  }

  async deleteModule(id: string): Promise<void> {
    await this.remove('modules', id);
    await this.reload();
  }

  // ---------------------------------------------------------------------------
  // Challenges
  // ---------------------------------------------------------------------------

  async saveChallenge(challenge: Partial<Challenge>): Promise<void> {
    const payload = {
      ...challenge,
      course_id: this.selectedCourseId(),
      module_id: challenge.module_id || null,
    };
    if (challenge.id) {
      await this.update('challenges', challenge.id, payload);
    } else {
      await this.insert('challenges', payload);
    }
    await this.reload();
  }

  async deleteChallenge(id: string): Promise<void> {
    await this.remove('challenges', id);
    await this.reload();
  }

  // ---------------------------------------------------------------------------
  // Timetable
  // ---------------------------------------------------------------------------

  findSlot(weekday: number, hour: number): TimetableSlot | undefined {
    return this.timetable().find((t) => t.weekday === weekday && t.hour === hour);
  }

  async setSlot(weekday: number, hour: number, moduleId: string | null): Promise<void> {
    const courseId = this.selectedCourseId();
    const existing = this.findSlot(weekday, hour);

    if (isDemoMode) {
      const rest = this.data().timetable.filter(
        (t) => !(t.course_id === courseId && t.weekday === weekday && t.hour === hour),
      );
      const nextSlots = moduleId
        ? [
            ...rest,
            {
              id: existing?.id ?? this.uid(),
              course_id: courseId,
              weekday,
              hour,
              module_id: moduleId,
            },
          ]
        : rest;
      this.commitDemo({ ...this.data(), timetable: nextSlots });
      return;
    }

    if (!supabase) throw new Error('NO_SUPABASE');
    if (!moduleId) {
      const { error } = await supabase
        .from('timetable')
        .delete()
        .eq('course_id', courseId)
        .eq('weekday', weekday)
        .eq('hour', hour);
      if (error) throw new Error(error.message);
      this.data.update((current) => ({
        ...current,
        timetable: current.timetable.filter(
          (t) => !(t.course_id === courseId && t.weekday === weekday && t.hour === hour),
        ),
      }));
    } else {
      const { data, error } = await supabase
        .from('timetable')
        .upsert(
          { course_id: courseId, weekday, hour, module_id: moduleId },
          { onConflict: 'course_id,weekday,hour' },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      this.data.update((current) => {
        const others = current.timetable.filter(
          (t) => !(t.course_id === courseId && t.weekday === weekday && t.hour === hour),
        );
        return { ...current, timetable: [...others, data as TimetableSlot] };
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Absences
  // ---------------------------------------------------------------------------

  findAbsence(studentId: string, date: string, hour: number): Absence | undefined {
    return this.data().absences.find(
      (a) => a.student_id === studentId && a.date === date && a.hour === hour,
    );
  }

  async setAbsence(
    studentId: string,
    date: string,
    hour: number,
    moduleId: string,
    status: AbsenceStatus | null,
  ): Promise<void> {
    const courseId = this.selectedCourseId();
    const existing = this.findAbsence(studentId, date, hour);

    if (isDemoMode) {
      const rest = this.data().absences.filter(
        (a) => !(a.student_id === studentId && a.date === date && a.hour === hour),
      );
      const next: Absence[] = status
        ? [
            ...rest,
            {
              id: existing?.id ?? this.uid(),
              course_id: courseId,
              student_id: studentId,
              date,
              hour,
              module_id: moduleId,
              status,
            },
          ]
        : rest;
      this.commitDemo({ ...this.data(), absences: next });
      return;
    }

    if (!supabase) throw new Error('NO_SUPABASE');
    if (!status) {
      const { error } = await supabase
        .from('absences')
        .delete()
        .eq('student_id', studentId)
        .eq('date', date)
        .eq('hour', hour);
      if (error) throw new Error(error.message);
      this.data.update((current) => ({
        ...current,
        absences: current.absences.filter(
          (a) => !(a.student_id === studentId && a.date === date && a.hour === hour),
        ),
      }));
    } else {
      const { data, error } = await supabase
        .from('absences')
        .upsert(
          {
            course_id: courseId,
            student_id: studentId,
            date,
            hour,
            module_id: moduleId,
            status,
          },
          { onConflict: 'student_id,date,hour' },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      this.data.update((current) => {
        const others = current.absences.filter(
          (a) => !(a.student_id === studentId && a.date === date && a.hour === hour),
        );
        return { ...current, absences: [...others, data as Absence] };
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Users & enrollments
  // ---------------------------------------------------------------------------

  async updateProfile(id: string, patch: Partial<Profile>): Promise<void> {
    await this.update('profiles', id, patch);
    await this.reload();
    this.auth.refreshDemoUser();
  }

  async createDemoUser(
    fullName: string,
    email: string,
    password: string,
    role: Profile['role'],
    enroll: boolean,
  ): Promise<void> {
    if (!isDemoMode) throw new Error('NOT_DEMO');
    const normalized = email.trim().toLowerCase();
    const data = loadDemoData();
    if (data.profiles.some((p) => p.email.toLowerCase() === normalized)) {
      throw new Error('EMAIL_EXISTS');
    }
    const id = this.uid();
    const profile: Profile = {
      id,
      email: normalized,
      full_name: fullName,
      role,
      active: true,
    };
    const next: AppData = { ...data, profiles: [...data.profiles, profile] };
    if (enroll) {
      next.enrollments = [
        ...data.enrollments,
        { id: this.uid(), course_id: this.selectedCourseId(), student_id: id },
      ];
    }
    saveDemoData(next);
    const credentials = loadDemoCredentials();
    saveDemoCredentials([...credentials, { email: normalized, password, profileId: id }]);
    this.data.set(next);
  }

  async deleteDemoUser(id: string): Promise<void> {
    if (!isDemoMode) throw new Error('NOT_DEMO');
    const data = loadDemoData();
    const next: AppData = {
      ...data,
      profiles: data.profiles.filter((p) => p.id !== id),
      enrollments: data.enrollments.filter((e) => e.student_id !== id),
      absences: data.absences.filter((a) => a.student_id !== id),
    };
    saveDemoData(next);
    const credentials = loadDemoCredentials().filter((c) => c.profileId !== id);
    saveDemoCredentials(credentials);
    this.data.set(next);
  }

  async toggleEnrollment(studentId: string): Promise<void> {
    const courseId = this.selectedCourseId();
    const existing = this.data().enrollments.find(
      (e) => e.course_id === courseId && e.student_id === studentId,
    );

    if (isDemoMode) {
      const enrollments: Enrollment[] = existing
        ? this.data().enrollments.filter((e) => e.id !== existing.id)
        : [...this.data().enrollments, { id: this.uid(), course_id: courseId, student_id: studentId }];
      this.commitDemo({ ...this.data(), enrollments });
      return;
    }

    if (!supabase) throw new Error('NO_SUPABASE');
    if (existing) {
      await supabase.from('enrollments').delete().eq('id', existing.id);
    } else {
      await supabase
        .from('enrollments')
        .insert({ course_id: courseId, student_id: studentId });
    }
    await this.reload();
  }

  isEnrolled(studentId: string): boolean {
    return this.data().enrollments.some(
      (e) => e.course_id === this.selectedCourseId() && e.student_id === studentId,
    );
  }

  // ---------------------------------------------------------------------------
  // Low-level adapters
  // ---------------------------------------------------------------------------

  private uid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private commitDemo(next: AppData): void {
    this.data.set(next);
    saveDemoData(next);
  }

  private async insert<T>(table: string, row: Record<string, unknown>): Promise<T | null> {
    if (isDemoMode) {
      const current = this.data() as unknown as Record<string, unknown[]>;
      const record = { id: this.uid(), ...row };
      const next = { ...this.data(), [table]: [...(current[table] ?? []), record] };
      this.commitDemo(next as AppData);
      return record as T;
    }
    if (!supabase) throw new Error('NO_SUPABASE');
    const { data, error } = await supabase.from(table).insert(row).select().maybeSingle();
    if (error) throw new Error(error.message);
    return data as T | null;
  }

  private async update(
    table: string,
    id: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    if (isDemoMode) {
      const current = this.data() as unknown as Record<string, Array<{ id: string }>>;
      const rows = (current[table] ?? []).map((row) =>
        row.id === id ? { ...row, ...patch, id } : row,
      );
      this.commitDemo({ ...this.data(), [table]: rows } as AppData);
      return;
    }
    if (!supabase) throw new Error('NO_SUPABASE');
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) throw new Error(error.message);
  }

  private async remove(table: string, id: string): Promise<void> {
    if (isDemoMode) {
      const current = this.data() as unknown as Record<string, Array<{ id: string }>>;
      const rows = (current[table] ?? []).filter((row) => row.id !== id);
      let next = { ...this.data(), [table]: rows } as AppData;
      if (table === 'courses') {
        next = {
          ...next,
          evaluations: next.evaluations.filter((e) => e.course_id !== id),
          holidays: next.holidays.filter((h) => h.course_id !== id),
          modules: next.modules.filter((m) => m.course_id !== id),
          challenges: next.challenges.filter((c) => c.course_id !== id),
          timetable: next.timetable.filter((t) => t.course_id !== id),
          enrollments: next.enrollments.filter((e) => e.course_id !== id),
          absences: next.absences.filter((a) => a.course_id !== id),
        };
      }
      if (table === 'modules') {
        const moduleIds = new Set(this.data().modules.filter((m) => m.id === id).map((m) => m.id));
        next = {
          ...next,
          timetable: next.timetable.filter((t) => !moduleIds.has(t.module_id)),
          absences: next.absences.filter((a) => !moduleIds.has(a.module_id)),
          challenges: next.challenges.map((c) =>
            c.module_id && moduleIds.has(c.module_id) ? { ...c, module_id: null } : c,
          ),
        };
      }
      this.commitDemo(next);
      return;
    }
    if (!supabase) throw new Error('NO_SUPABASE');
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
