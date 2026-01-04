
export type Role = 'ADMIN' | 'VICE_PRINCIPAL' | 'ATTENDANCE_OFFICER' | 'TEACHER' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  teacherNumber?: string;
  specialization?: string;
  assigned_grade?: string;    // متوافق مع قاعدة البيانات
  assigned_section?: string;  // متوافق مع قاعدة البيانات (نص مفصول بفاصلة)
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  phone: string;
  studentNumber: string;
  student_number?: string;
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
