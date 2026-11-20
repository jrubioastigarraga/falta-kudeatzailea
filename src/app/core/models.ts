export interface Course {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

export interface Evaluation {
  id: string;
  course_id: string;
  name: string;
  start_date: string;
  end_date: string;
  position: number;
}

export interface Holiday {
  id: string;
  course_id: string;
  date: string;
  name: string;
}

export interface Module {
  id: string;
  course_id: string;
  name: string;
  code: string;
  color: string;
}

export interface Challenge {
  id: string;
  course_id: string;
  module_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
}

export interface TimetableSlot {
  id: string;
  course_id: string;
  weekday: number; // 1 = Monday ... 7 = Sunday
  hour: number; // 8..14
  module_id: string;
}

export type UserRole = 'admin' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
}

export type AbsenceStatus = 'justified' | 'unjustified';

export interface Absence {
  id: string;
  course_id: string;
  student_id: string;
  date: string;
  hour: number;
  module_id: string;
  status: AbsenceStatus;
  note?: string | null;
}

export interface AppData {
  courses: Course[];
  evaluations: Evaluation[];
  holidays: Holiday[];
  modules: Module[];
  challenges: Challenge[];
  timetable: TimetableSlot[];
  profiles: Profile[];
  enrollments: Enrollment[];
  absences: Absence[];
}

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export const HOURS = [8, 9, 10, 11, 12, 13, 14];

export const WEEKDAYS = [1, 2, 3, 4, 5];

export const emptyData = (): AppData => ({
  courses: [],
  evaluations: [],
  holidays: [],
  modules: [],
  challenges: [],
  timetable: [],
  profiles: [],
  enrollments: [],
  absences: [],
});
