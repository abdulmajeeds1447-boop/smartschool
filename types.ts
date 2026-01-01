
export type Role = 'ADMIN' | 'VICE_PRINCIPAL' | 'ATTENDANCE_OFFICER' | 'TEACHER' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  nationalId?: string; // السجل المدني
  teacherNumber?: string;
  specialization?: string;
  assignedGrade?: string;
  assignedSection?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  phone: string;
  studentNumber: string;
  student_number?: string; // للتوافق مع قاعدة البيانات
}

export interface Schedule {
  id: string;
  teacherId: string;
  day: string;
  period: number;
  grade: string;
  section: string;
  subject: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  teacherId: string;
  period: number;
}