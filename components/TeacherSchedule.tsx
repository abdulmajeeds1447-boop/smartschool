
import React, { useState, useEffect } from 'react';
import { DAYS, PERIODS, PERIOD_TIMES } from '../constants';
import { supabase } from '../services/supabaseClient';
import { Save, Loader2, BookOpen, UserCheck, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import { User } from '../types';

interface ScheduleCell {
  subject: string;
  teacher_id: string;
}

const TeacherSchedule: React.FC<{ userRole?: string }> = ({ userRole = 'ADMIN' }) => {
  const [scheduleData, setScheduleData] = useState<Record<string, Record<number, ScheduleCell>>>({});
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // نظام الفلاتر للـ 22 فصل
  const [selectedGrade, setSelectedGrade] = useState('الأول الثانوي');
  const [selectedSection, setSelectedSection] = useState('أ');

  useEffect(() => {
    fetchInitialData();
  }, [selectedGrade, selectedSection]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. جلب المعلمين مع تخصصاتهم
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'TEACHER');
      
      setTeachers((profiles || []).map(p => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: p.role,
        specialization: p.specialization
      })));

      // 2. جلب جدول الفصل المحدد فقط
      const { data: schedule } = await supabase
        .from('schedule')
        .select('*')
        .eq('grade', selectedGrade)
        .eq('section', selectedSection);

      const formattedData: Record<string, Record<number, ScheduleCell>> = {};
      schedule?.forEach(item => {
        if (!formattedData[item.day]) formattedData[item.day] = {};
        formattedData[item.day][item.period] = {
          subject: item.subject || '',
          teacher_id: item.teacher_id || ''
        };
      });
      setScheduleData(formattedData);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (day: string, period: number, field: keyof ScheduleCell, value: string) => {
    if (userRole !== 'ADMIN') return;
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [period]: {
          ...(prev[day]?.[period] || { subject: '', teacher_id: '' }),
          [field]: value
        }
      }
    }));
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const recordsToInsert: any[] = [];
      Object.entries(scheduleData).forEach(([day, periods]) => {
        Object.entries(periods).forEach(([period, cell]) => {
          if (cell.subject || cell.teacher_id) {
            recordsToInsert.push({
              day,
              period: parseInt(period),
              subject: cell.subject,
              teacher_id: cell.teacher_id,
              grade: selectedGrade,
              section: selectedSection
            });
          }
        });
      });

      // حذف جدول الفصل الحالي فقط قبل التحديث
      await supabase.from('schedule')
        .delete()
        .eq('grade', selectedGrade)
        .eq('section', selectedSection);

      const { error } = await supabase.from('schedule').insert(recordsToInsert);
      if (error) throw error;
      alert(`تم حفظ جدول [${selectedGrade} - فصل ${selectedSection}] بنجاح`);
    } catch (err: any) {
      alert('فشل الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع الفلاتر */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <Filter size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">تخصيص جدول الفصل</h3>
            <p className="text-slate-500 text-xs">اختر الفصل لتعديل توزيع الحصص والمعلمين</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option>الأول الثانوي</option>
            <option>الثاني الثانوي</option>
            <option>الثالث الثانوي</option>
          </select>

          <select 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none w-32"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {['أ', 'ب', 'ج', 'د', 'هـ', 'و'].map(s => <option key={s} value={s}>فصل {s}</option>)}
          </select>

          {userRole === 'ADMIN' && (
            <button 
              onClick={saveSchedule}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              حفظ هذا الجدول
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 font-bold">جاري تحميل بيانات الفصل {selectedSection}...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-5 font-black text-xs w-32 border-l border-slate-800">اليوم / الحصة</th>
                  {PERIODS.map(p => (
                    <th key={p} className="px-4 py-5 border-l border-slate-800">
                      <div className="text-xs font-black">الحصة {p}</div>
                      <div className="text-[9px] text-slate-400 font-medium">{PERIOD_TIMES[p-1].start}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-right">
                {DAYS.map(day => (
                  <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-8 bg-slate-50/50 border-l border-slate-100 font-bold text-slate-700">
                      {day}
                    </td>
                    {PERIODS.map(period => {
                      const cell = scheduleData[day]?.[period] || { subject: '', teacher_id: '' };
                      const teacher = teachers.find(t => t.id === cell.teacher_id);
                      return (
                        <td key={`${day}-${period}`} className="px-2 py-3 border-l border-slate-100 relative">
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              placeholder="المادة"
                              className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-800 text-center focus:bg-white outline-none transition-all"
                              value={cell.subject}
                              onChange={(e) => handleCellChange(day, period, 'subject', e.target.value)}
                            />
                            
                            <select
                              className={`w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-center outline-none cursor-pointer ${
                                teacher ? 'text-blue-600' : 'text-slate-400'
                              }`}
                              value={cell.teacher_id}
                              onChange={(e) => handleCellChange(day, period, 'teacher_id', e.target.value)}
                            >
                              <option value="">اختر معلماً</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.specialization || 'بدون تخصص'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
