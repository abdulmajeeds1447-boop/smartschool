
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  CheckCircle, XCircle, Clock, Save, Loader2, Calendar, 
  ChevronLeft, UserCheck, BookOpen, Plus, Trash2, Star, 
  FileText, Briefcase, AlertCircle, Info, ArrowRight, 
  ShieldAlert, Copy, Check, Layout, Sparkles, Activity, CalendarDays,
  PenTool, GraduationCap
} from 'lucide-react';
import { Student, User } from '../types';

const Attendance: React.FC<{ user: User }> = ({ user }) => {
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'followup' | 'notes'>('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [initialAttendance, setInitialAttendance] = useState<string>(""); 
  
  // Follow-up States
  const [followupType, setFollowupType] = useState<'واجب' | 'مشاركة' | 'بحث' | 'ملف أعمال'>('واجب');
  const [followupRecords, setFollowupRecords] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, 'DONE' | 'INCOMPLETE' | 'NOT_DONE'>>({});
  const [initialScores, setInitialScores] = useState<string>("");
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');

  const [lessonNotes, setLessonNotes] = useState('');
  
  const [dbStatus, setDbStatus] = useState<{ ok: boolean, sqlFix: string }>({ 
    ok: true, 
    sqlFix: `-- كود الإصلاح الشامل للمتابعة والحضور:
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_unique_session;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_unique_session UNIQUE (student_id, date, period, teacher_id);

CREATE TABLE IF NOT EXISTS public.assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id),
    grade text,
    section text,
    type text,
    title text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    status text CHECK (status IN ('DONE', 'INCOMPLETE', 'NOT_DONE')),
    UNIQUE(assignment_id, student_id)
);`
  });

  const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  useEffect(() => {
    fetchTodaySchedule();
  }, [user.id]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass, followupType, activeSubTab]);

  const fetchTodaySchedule = async () => {
    setLoading(true);
    try {
      const todayName = DAYS_AR[new Date().getDay()];
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('day', todayName)
        .order('period');
      
      if (error) throw error;
      setTodayClasses(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // جلب الطلاب
      const { data: stData } = await supabase
        .from('students')
        .select('*')
        .eq('grade', selectedClass.grade)
        .eq('section', selectedClass.section)
        .order('name');
      
      const stList = stData || [];
      setStudents(stList);
      
      const dateStr = new Date().toISOString().split('T')[0];

      if (activeSubTab === 'attendance') {
        const { data: attData } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('date', dateStr)
          .eq('period', selectedClass.period)
          .eq('teacher_id', user.id);

        const currentAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
        stList.forEach(s => { currentAttendance[s.id] = 'PRESENT'; });
        attData?.forEach(row => { currentAttendance[row.student_id] = row.status as any; });
        setAttendance(currentAttendance);
        setInitialAttendance(JSON.stringify(currentAttendance));
      }

      if (activeSubTab === 'followup') {
        const { data: folData } = await supabase
          .from('assignments')
          .select('*')
          .eq('teacher_id', user.id)
          .eq('grade', selectedClass.grade)
          .eq('section', selectedClass.section)
          .eq('type', followupType)
          .order('created_at', { ascending: false });
        
        setFollowupRecords(folData || []);
      }

      if (activeSubTab === 'notes') {
        const { data: notesData } = await supabase
          .from('lesson_notes')
          .select('content')
          .eq('date', dateStr)
          .eq('period', selectedClass.period)
          .eq('teacher_id', user.id)
          .maybeSingle();
        setLessonNotes(notesData?.content || '');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        status: status,
        date: dateStr,
        period: selectedClass.period,
        teacher_id: user.id,
        grade: selectedClass.grade,
        section: selectedClass.section
      }));

      await supabase.from('attendance').delete()
        .eq('date', dateStr)
        .eq('period', selectedClass.period)
        .eq('teacher_id', user.id);

      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;
      
      setInitialAttendance(JSON.stringify(attendance));
      alert('✅ تم حفظ الحضور');
    } catch (err: any) {
      setDbStatus({ ok: false, sqlFix: dbStatus.sqlFix });
      alert('❌ خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const createAssignment = async () => {
    if (!newAssignmentTitle.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('assignments').insert([{
        teacher_id: user.id,
        grade: selectedClass.grade,
        section: selectedClass.section,
        type: followupType,
        title: newAssignmentTitle.trim()
      }]).select().single();

      if (error) throw error;
      setNewAssignmentTitle('');
      setIsAddingAssignment(false);
      fetchClassData();
      openAssignment(data);
    } catch (err) {
      alert('فشل إنشاء التكليف');
    } finally {
      setSaving(false);
    }
  };

  const openAssignment = async (assignment: any) => {
    setActiveAssignment(assignment);
    setLoading(true);
    try {
      const { data } = await supabase
        .from('assignment_scores')
        .select('student_id, status')
        .eq('assignment_id', assignment.id);
      
      const scoreMap: Record<string, any> = students.reduce((acc, s) => ({ ...acc, [s.id]: 'NOT_DONE' }), {});
      data?.forEach(row => { scoreMap[row.student_id] = row.status; });
      setScores(scoreMap);
      setInitialScores(JSON.stringify(scoreMap));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveScores = async () => {
    if (!activeAssignment) return;
    setSaving(true);
    try {
      const records = Object.entries(scores).map(([studentId, status]) => ({
        assignment_id: activeAssignment.id,
        student_id: studentId,
        status: status
      }));

      const { error } = await supabase.from('assignment_scores').upsert(records, {
        onConflict: 'assignment_id,student_id'
      });
      if (error) throw error;
      
      setInitialScores(JSON.stringify(scores));
      alert('✅ تم حفظ درجات المتابعة');
    } catch (err) {
      alert('فشل حفظ الدرجات');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !selectedClass) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-400 font-black">جاري جلب البيانات...</p>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 font-['Tajawal'] text-right pb-24">
        {/* Header */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/90">
          <button onClick={() => { setActiveAssignment(null); setSelectedClass(null); }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-all">
            <ChevronLeft className="rotate-180" size={24} />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-black text-slate-800">
              {activeAssignment ? activeAssignment.title : selectedClass.subject}
            </h3>
            <p className="text-xs text-slate-400 font-bold">فصل {selectedClass.section} - الحصة {selectedClass.period}</p>
          </div>
          <button 
            onClick={activeAssignment ? saveScores : handleSaveAttendance} 
            disabled={saving} 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} حفظ
          </button>
        </div>

        {/* Tabs */}
        {!activeAssignment && (
          <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <button onClick={() => setActiveSubTab('attendance')} className={`py-3 rounded-xl font-black text-xs transition-all ${activeSubTab === 'attendance' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>الحضور</button>
            <button onClick={() => setActiveSubTab('followup')} className={`py-3 rounded-xl font-black text-xs transition-all ${activeSubTab === 'followup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>المتابعة</button>
            <button onClick={() => setActiveSubTab('notes')} className={`py-3 rounded-xl font-black text-xs transition-all ${activeSubTab === 'notes' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400'}`}>ملاحظات</button>
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          {/* Attendance Sub-Tab */}
          {activeSubTab === 'attendance' && !activeAssignment && (
            <div className="divide-y divide-slate-50">
              {students.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">السجل: {(s as any).student_number || s.studentNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAttendance(p => ({...p, [s.id]: 'PRESENT'}))} className={`p-2 rounded-lg transition-all ${attendance[s.id] === 'PRESENT' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}><CheckCircle size={20}/></button>
                    <button onClick={() => setAttendance(p => ({...p, [s.id]: 'LATE'}))} className={`p-2 rounded-lg transition-all ${attendance[s.id] === 'LATE' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}><Clock size={20}/></button>
                    <button onClick={() => setAttendance(p => ({...p, [s.id]: 'ABSENT'}))} className={`p-2 rounded-lg transition-all ${attendance[s.id] === 'ABSENT' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}><XCircle size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Follow-up Sub-Tab */}
          {activeSubTab === 'followup' && !activeAssignment && (
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {['واجب', 'مشاركة', 'بحث', 'ملف أعمال'].map((t: any) => (
                    <button 
                      key={t} 
                      onClick={() => setFollowupType(t)}
                      className={`px-4 py-2 rounded-xl font-black text-[10px] whitespace-nowrap transition-all ${followupType === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsAddingAssignment(true)}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] border border-indigo-100 flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={16} /> إضافة جديد
                </button>
              </div>

              {isAddingAssignment && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                  <input 
                    autoFocus
                    value={newAssignmentTitle}
                    onChange={(e) => setNewAssignmentTitle(e.target.value)}
                    placeholder={`عنوان ${followupType} الجديد...`}
                    className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm mb-3 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingAssignment(false)} className="px-4 py-2 text-slate-400 font-bold text-xs">إلغاء</button>
                    <button onClick={createAssignment} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-md">تأكيد</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {followupRecords.map(rec => (
                  <div 
                    key={rec.id} 
                    onClick={() => openAssignment(rec)}
                    className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <PenTool size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{rec.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                          <CalendarDays size={12} /> {new Date(rec.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 rotate-180" />
                  </div>
                ))}
                {followupRecords.length === 0 && !isAddingAssignment && (
                  <div className="text-center py-20 opacity-40">
                    <Activity size={48} className="mx-auto mb-4" />
                    <p className="font-bold text-sm">لا توجد سجلات {followupType} حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment Scoring View */}
          {activeAssignment && (
            <div className="divide-y divide-slate-50">
              <div className="bg-indigo-50/50 p-4 flex items-center justify-between border-b border-indigo-100">
                <button onClick={() => setActiveAssignment(null)} className="text-indigo-600 font-black text-xs flex items-center gap-1">
                  <ChevronLeft size={16} className="rotate-180" /> رجوع للقائمة
                </button>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">رصد الدرجات</span>
              </div>
              {students.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">رصد درجة التكليف</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setScores(p => ({...p, [s.id]: 'DONE'}))} className={`p-2 rounded-lg transition-all ${scores[s.id] === 'DONE' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}><CheckCircle size={20}/></button>
                    <button onClick={() => setScores(p => ({...p, [s.id]: 'INCOMPLETE'}))} className={`p-2 rounded-lg transition-all ${scores[s.id] === 'INCOMPLETE' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}><Clock size={20}/></button>
                    <button onClick={() => setScores(p => ({...p, [s.id]: 'NOT_DONE'}))} className={`p-2 rounded-lg transition-all ${scores[s.id] === 'NOT_DONE' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}><XCircle size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes Sub-Tab */}
          {activeSubTab === 'notes' && !activeAssignment && (
            <div className="p-6">
              <textarea 
                value={lessonNotes} 
                onChange={(e) => setLessonNotes(e.target.value)} 
                placeholder="سجل هنا أي ملاحظات حول سير الحصة أو سلوك الطلاب..." 
                className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-amber-500/20 font-bold text-sm" 
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Tajawal'] text-right">
       <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden mb-6">
        <h2 className="text-2xl font-black mb-2 relative z-10">جدول الحصص اليومي</h2>
        <p className="text-white/70 text-sm relative z-10">اختر الفصل لتبدأ رصد الحضور والمتابعة</p>
        <Layout className="absolute -bottom-10 -left-10 text-white/10 w-48 h-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {todayClasses.map(c => (
          <div key={c.id} onClick={() => setSelectedClass(c)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><BookOpen size={24}/></div>
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">الحصة {c.period}</span>
            </div>
            <h4 className="font-black text-slate-800 text-lg">{c.subject}</h4>
            <p className="text-slate-400 font-bold text-xs mt-1">فصل {c.section} - {c.grade}</p>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-blue-600">
               <span className="text-[10px] font-black uppercase">رصد الحصّة</span>
               <ArrowRight size={16} className="rotate-180" />
            </div>
          </div>
        ))}
      </div>
      {todayClasses.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm text-center">
          <Calendar className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-xl font-black text-slate-800">لا توجد حصص مجدولة اليوم</h3>
        </div>
      )}
    </div>
  );
};

export default Attendance;
