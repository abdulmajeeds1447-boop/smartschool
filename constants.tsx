
import { Student, User, Schedule } from './types';

export const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'أحمد محمد علي', grade: 'الأول الثانوي', section: 'أ', phone: '0501234567', studentNumber: '2021001' },
  { id: '2', name: 'خالد عبدالله عمر', grade: 'الأول الثانوي', section: 'أ', phone: '0501234568', studentNumber: '2021002' },
  { id: '3', name: 'سارة إبراهيم فهد', grade: 'الأول الثانوي', section: 'ب', phone: '0501234569', studentNumber: '2021003' },
  { id: '4', name: 'نورة صالح حمد', grade: 'الثاني الثانوي', section: 'أ', phone: '0501234570', studentNumber: '2021004' },
];

export const MOCK_TEACHERS: User[] = [
  { id: 't1', name: 'الأستاذ محمد القحطاني', email: 'teacher@school.com', role: 'TEACHER', phone: '0555555555', nationalId: '123456789' },
  { id: 'admin', name: 'مدير المدرسة', email: 'admin@school.com', role: 'ADMIN' },
];

export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const PERIOD_TIMES = [
  { start: '08:00', end: '08:45' },
  { start: '08:45', end: '09:30' },
  { start: '09:30', end: '10:15' },
  { start: '10:45', end: '11:30' },
  { start: '11:30', end: '12:15' },
  { start: '12:15', end: '13:00' },
  { start: '13:00', end: '13:45' },
];
