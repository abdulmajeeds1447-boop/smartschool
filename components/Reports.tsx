
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Student } from '../types';
import { 
  Users, PieChart, ChevronLeft, LayoutGrid, Search, 
  BookOpen, School, UserCheck, Loader2, ArrowLeftRight, 
  Briefcase, Activity, ClipboardList, MessageCircle, Send, Sparkles
} from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

const Reports: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const { data: schedData } = await supabase.from('schedule').select('*');
        const { data: profiles } = await supabase.from('profiles').select('*');
        setAllSchedules(schedData || []);
        setAllTeachers(profiles || []);
      } else {
        const { data: schedule } = await supabase.from('schedule').select('*').eq('teacher_id', user.id);
        setAllSchedules(schedule || []);
      }
    } catch (err) {
      console.error("Reports Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSmartReport = async (student: Student) => {
    const phone = student.phone || (student as any).parent_phone;
    if (!phone) {
      alert('⚠️ عذراً، لا يوجد رقم جوال مسجل لولي أمر هذا الطالب.');
      return;
    }

    setSendingReport(student.id);
    try {
      const reportText = await generateStudentReport(student.name, student.grade, student.section);
      const encodedText = encodeURIComponent(reportText);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setSendingReport(null);
    }
  };

  const viewStudents = async (grade: string, section: string) => {
    setLoading(true);
    setSelectedSection({ grade, section });
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('grade', grade)
      .eq('section', section)
      .order('name');
    setStudents(data || []);
    setLoading(false);
  };

  const getAdminReportData = () => {
    const filteredSchedules = allSchedules.filter(s => 
      s.subject?.includes(searchTerm) || 
      allTeachers.find(t => t.id === s.teacher_id)?.full_name?.includes(searchTerm)
    );

    const grouped = filteredSchedules.reduce((acc: any, curr) => {
      const key = `${curr.teacher_id}-${curr.subject}-${curr.grade}-${curr.section}`;
      if (!acc[key]) {
        const teacher = allTeachers.find(t => t.id === curr.teacher_id);
        acc[key] = {
          teacherName: teacher?.full_name || 'غير معروف',
          subject: curr.subject,
          grade: curr.grade,
          section: curr.section,
          periods: [curr.period]
        };
      } else {
        acc[key].periods.push(curr.period);
      }
      return acc;
    }, {});

    return Object.values(grouped);
  };

  const getTeacherSections = () => {
    const unique = Array.from(new Set(allSchedules.map(s => `${s.grade}|${s.section}`)))
      .map(str => {
        const [grade, section] = (str as string).split('|');
        return { grade, section };
      });
    return unique;
  };

  if (loading && !selectedSection) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-right">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-400 font-black">جاري تجميع التقارير والبيانات...</p>
      </div>
    );
  }

  if (selectedSection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center justify-between border border-slate-100">
          <button onClick={() => setSelectedSection(null)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all">
            <ChevronLeft className="rotate-180" size={24} />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-black text-slate-800">قائمة طلاب فصل {selectedSection.section}</h3>
            <p className="text-xs text-indigo-600 font-bold">{selectedSection.grade}</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-xl font-black text-xs shadow-sm border border-indigo-100">
            {students.length} طالب
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">الاسم الكامل</th>
                <th className="px-8 py-6">جوال ولي الأمر</th>
                <th className="px-8 py-6 text-left">تقرير ذكي (WhatsApp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{s.name.charAt(0)}</div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{s.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold">رقم السجل: {(s as any).student_number || s.studentNumber}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-mono text-slate-500 tracking-wider">{s.phone || '---'}</td>
                  <td className="px-8 py-5 text-left">
                    <button 
                      onClick={() => handleSendSmartReport(s)}
                      disabled={sendingReport === s.id}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {sendingReport === s.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} className="text-amber-500" />
                      )}
                      إرسال تقرير المعلم
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-['Tajawal'] text-right" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black mb-2">
              {isAdmin ? 'مركز التقارير والتواصل الذكي 📲' : 'إحصائياتي وقائمة التواصل'}
            </h2>
            <p className="text-indigo-100 font-bold text-sm max-w-lg opacity-80">
              استخدم زر "التقرير الذكي" بجانب كل طالب لإرسال تحديثات فورية لولي أمره بصياغة الذكاء الاصطناعي.
            </p>
          </div>
          {isAdmin && (
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 grid grid-cols-2 gap-4">
              <div className="text-center px-4 border-l border-white/10">
                <p className="text-[10px] font-black uppercase opacity-60">المعلمين</p>
                <p className="text-xl font-black">{allTeachers.length}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase opacity-60">الحصص</p>
                <p className="text-xl font-black">{allSchedules.length}</p>
              </div>
            </div>
          )}
        </div>
        <Activity className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" />
      </div>

      {isAdmin ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-indigo-600" />
              عرض الفصول والتواصل
            </h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-6">المعلم</th>
                  <th className="px-8 py-6">المادة</th>
                  <th className="px-8 py-6">الفصل</th>
                  <th className="px-8 py-6 text-left">قائمة الطلاب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(getAdminReportData() as any[]).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">{row.teacherName.charAt(0)}</div>
                        <span className="font-black text-slate-800 text-sm">{row.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-500">{row.subject}</td>
                    <td className="px-8 py-6 font-black text-blue-600">فصل {row.section}</td>
                    <td className="px-8 py-6 text-left">
                      <button 
                        onClick={() => viewStudents(row.grade, row.section)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        عرض الطلاب والتواصل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getTeacherSections().map((sec, idx) => (
            <div 
              key={idx} 
              onClick={() => viewStudents(sec.grade, sec.section)}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white border border-slate-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">فصل {sec.section}</h3>
                <p className="text-slate-400 font-bold text-sm mt-1">{sec.grade}</p>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 group-hover:bg-white transition-colors">قائمة التواصل</span>
                  <ArrowLeftRight size={20} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
