
export type Role = 'ADMIN' | 'VICE_PRINCIPAL' | 'ATTENDANCE_OFFICER' | 'TEACHER' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  nationalId?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  phone: string;
  studentNumber: string;
}

export interface Schedule {
  id: string;
  teacherId: string;
  day: string;
  period: number;
  grade: string;
  section: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  teacherId: string;
  period: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  grade: string;
  section: string;
  dueDate: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  feedback: string;
  status: 'SUBMITTED' | 'GRADED' | 'MISSING';
}
