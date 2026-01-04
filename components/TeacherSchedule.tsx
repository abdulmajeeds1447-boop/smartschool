
import React, { useState, useEffect } from 'react';
import { DAYS, PERIODS, PERIOD_TIMES as DEFAULT_PERIOD_TIMES, GRADE_SUBJECTS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { 
  Save, Loader2, Calendar, RefreshCw, Clock, Settings2, 
  X, CheckCircle, User, BookOpen, LayoutGrid, Trash2, AlertCircle, ShieldCheck 
} from 'lucide-react';
import { User as UserType } from '../types';

const TeacherSchedule: React.FC<{ user: UserType }> = ({ user }) => {
  const isAdmin = user.role === 'ADMIN';
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [periodTimes, setPeriodTimes] = useState<any[]>(DEFAULT_PERIOD_TIMES);
  const [showTimesModal, setShowTimesModal] = useState(false);
  const [isSavingTimes, setIsSavingTimes] = useState(false);

  const [selectedGrade, setSelectedGrade] = useState('أول ثانوي');
  const [selectedSection, setSelectedSection] = useState('1');

  useEffect(() => {
    fetchData();
    fetchPeriodTimes();
  }, [selectedGrade, selectedSection]);

  const fetchPeriodTimes = async () => {
    try {
      const { data } = await supabase.from('period_configs').select('*').order('period_number');
      if (data && data.length > 0) {
        const formatted = Array(7).fill(null).map((_, i) => {
          const found = data.find(d => d.period_number === i + 1);
          return found ? { start: found.start_time, end: found.end_time } : DEFAULT_PERIOD_TIMES[i];
        });
        setPeriodTimes(formatted);
      }
    } catch (err) {
      console.error("Error fetching period times:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');
        
        // ذكاء اصطناعي لتصفية المعلمين في القائمة: نفضل الحسابات التي لديها ID حقيقي
        const uniqueTeachers = new Map();
        profiles?.forEach(p => {
          const key = p.teacher_number || p.full_name;
          if (!uniqueTeachers.has(key) || p.id.length > 20) {
            uniqueTeachers.set(key, p);
          }
        });
        
        setTeachers(Array.from(uniqueTeachers.values()));
      }

      let query = supabase.from('schedule').select('*');
      if (!isAdmin) {
        query = query.eq('teacher_id', user.id);
      } else {
        query = query.eq('grade', selectedGrade).eq('section', selectedSection);
      }

      const { data } = await query;
      setScheduleData(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (day: string, period: number, field: string, value: string) => {
    if (!isAdmin) return;
    setScheduleData(prev => {
      const otherData = prev.filter(s => !(s.day === day && s.period === period));
      const currentCell = prev.find(s => s.day === day && s.period === period) || {
        day,
        period,
        grade: selectedGrade,
        section: selectedSection,
        subject: '',
        teacher_id: ''
      };
      
      const updatedCell = { ...currentCell, [field]: value };
      if (!updatedCell.subject && !updatedCell.teacher_id) return otherData;
      return [...otherData, updatedCell];
    });
  };

  const saveCurrentSchedule = async () => {
    setSaving(true);
    try {
      await supabase.from('schedule').delete().eq('grade', selectedGrade).eq('section', selectedSection);
      const toInsert = scheduleData
        .filter(s => s.grade === selectedGrade && s.section === selectedSection)
        .map(({ id, ...rest }) => rest)
        .filter(s => s.subject && s.teacher_id);

      if (toInsert.length > 0) {
        const { error } = await supabase.from('schedule').insert(toInsert);
        if (error) throw error;
      }
      
      alert('تم تحديث الجدول الدراسي بنجاح.');
      fetchData();
    } catch (err: any) {
      alert('فشل الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getCellData = (day: string, period: number) => {
    return scheduleData.find(s => s.day === day && s.period === period);
  };

  return (
    <div className="space-y-6 font-['Tajawal'] text-right" dir="rtl">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-500/20">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">
              {isAdmin ? 'الإسناد والجدولة المركزية' : 'جدول حصصي الفعلي'}
            </h3>
            <p className="text-slate-500 text-xs font-bold mt-1">إدارة المناهج وتوزيع الحصص - 1447هـ</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button onClick={() => setShowTimesModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all text-sm">
              <Clock size={18} /> ضبط أوقات الحصص
            </button>
          )}
          <button onClick={fetchData} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:text-blue-600 hover:bg-blue-50 transition-all">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          {isAdmin && (
            <>
              <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
              <div className="flex gap-2">
                <select className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                  <option value="أول ثانوي">أول ثانوي</option>
                  <option value="ثاني ثانوي">ثاني ثانوي</option>
                  <option value="ثالث ثانوي">ثالث ثانوي</option>
                </select>
                <select className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 w-28" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                  {['1','2','3','4','5','6','7','8','9','10'].map(s => <option key={s} value={s}>فصل {s}</option>)}
                </select>
              </div>
              <button onClick={saveCurrentSchedule} disabled={saving} className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} حفظ الجدول
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-8 font-black text-xs w-36 border-l border-slate-800">اليوم / الحصة</th>
                {PERIODS.map(p => (
                  <th key={p} className="px-4 py-8 border-l border-slate-800 min-w-[160px]">
                    <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">الحصة {p}</div>
                    <div className="text-xs font-black">{periodTimes[p-1].start} - {periodTimes[p-1].end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DAYS.map(day => (
                <tr key={day} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-10 bg-slate-50/30 border-l border-slate-100 font-black text-slate-700 text-sm">{day}</td>
                  {PERIODS.map(period => {
                    const cell = getCellData(day, period);
                    return (
                      <td key={`${day}-${period}`} className="px-3 py-6 border-l border-slate-100">
                        {isAdmin ? (
                          <div className="space-y-3">
                            <select className="w-full pr-8 pl-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black focus:bg-white outline-none appearance-none text-right" value={cell?.subject || ''} onChange={(e) => handleUpdate(day, period, 'subject', e.target.value)}>
                              <option value="">المادة</option>
                              {(GRADE_SUBJECTS[selectedGrade] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                            <select className="w-full pr-8 pl-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:bg-white outline-none appearance-none text-right" value={cell?.teacher_id || ''} onChange={(e) => handleUpdate(day, period, 'teacher_id', e.target.value)}>
                              <option value="">المعلم</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.id.length > 20 ? '✓ ' : ''}{t.full_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          cell ? (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-[1.5rem] text-white shadow-lg shadow-blue-500/20 animate-in zoom-in text-right">
                              <div className="text-[11px] font-black mb-1.5 leading-tight flex items-center gap-2">
                                <BookOpen size={12} /> {cell.subject}
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-[9px] font-bold opacity-80 bg-white/20 px-2 py-0.5 rounded-lg">ف {cell.section} - {cell.grade}</span>
                                <div className="p-1 bg-white/20 rounded-lg"><CheckCircle size={10} /></div>
                              </div>
                            </div>
                          ) : <div className="text-[10px] text-slate-200 font-bold italic py-4">---</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherSchedule;
