
import React, { useState, useEffect } from 'react';
import { Student, User } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
  Search, Trash2, Loader2, RefreshCw, 
  X, Plus, Filter, Phone, GraduationCap, 
  MessageSquare, Sparkles, Send, UserX, ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

interface StudentsListProps {
  user: User;
}

const StudentsList: React.FC<StudentsListProps> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  
  const [filterGrade, setFilterGrade] = useState('الكل');
  const [filterSection, setFilterSection] = useState('الكل');
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = user.role === 'ADMIN';

  const GRADES = ['الكل', 'أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'];
  const SECTIONS = ['الكل', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  useEffect(() => {
    fetchStudents();
  }, [filterGrade, filterSection, user]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase.from('students').select('*');
      
      if (!isAdmin) {
        // تقييد العرض للمعلم ليشمل طلاب فصوله فقط
        if (user.assigned_grade) {
          query = query.eq('grade', user.assigned_grade);
        }
        if (user.assigned_section) {
          const sections = user.assigned_section.split(',').map(s => s.trim());
          query = query.in('section', sections);
        }
      } else {
        if (filterGrade !== 'الكل') query = query.eq('grade', filterGrade);
        if (filterSection !== 'الكل' && filterGrade !== 'الكل') query = query.eq('section', filterSection);
      }

      const { data, error } = await query
        .order('grade', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSmartReport = async (student: Student) => {
    const phone = student.phone || (student as any).student_number;
    if (!phone) {
      alert('⚠️ لا يوجد رقم جوال مسجل لهذا الطالب.');
      return;
    }

    setSendingReport(student.id);
    try {
      const reportText = await generateStudentReport(student.name, student.grade, student.section);
      const whatsappUrl = `https://wa.me/966${phone.startsWith('0') ? phone.substring(1) : phone}?text=${encodeURIComponent(reportText)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setSendingReport(null);
    }
  };

  const handleQuickContact = (student: Student) => {
    const phone = student.phone;
    if (!phone) return alert('رقم الجوال غير متوفر');
    const msg = `السلام عليكم ورحمة الله، ولي أمر الطالب ${student.name}، نود التواصل معكم من ثانوية الأمير عبدالمجيد الأولى...`;
    window.open(`https://wa.me/966${phone.startsWith('0') ? phone.substring(1) : phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف هذا الطالب نهائياً؟')) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("خطأ في الحذف: " + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!isAdmin) return;
    const confirmation = window.confirm('⚠️ تنبيه خطير: هل أنت متأكد من رغبتك في حذف كافة بيانات الطلاب؟ لا يمكن التراجع عن هذه الخطوة.');
    if (!confirmation) return;

    setIsDeletingAll(true);
    try {
      const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      alert('✅ تم حذف كافة سجلات الطلاب بنجاح.');
      fetchStudents();
    } catch (err: any) {
      alert('خطأ أثناء عملية الحذف: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const studentData = {
      name: target.name.value.trim(),
      student_number: target.student_number.value.trim(),
      grade: target.grade.value,
      section: target.section.value,
      phone: target.phone.value.trim()
    };

    setLoading(true);
    try {
      const { error } = await supabase.from('students').insert([studentData]);
      if (error) throw error;
      setShowAddModal(false);
      fetchStudents();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || 
    (s as any).student_number?.includes(searchTerm) ||
    (s as any).studentNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-['Tajawal'] text-right" dir="rtl">
      {/* Header Banner for Teacher Scope */}
      {!isAdmin && user.assigned_grade && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between overflow-hidden relative group">
           <div className="relative z-10">
              <h2 className="text-2xl font-black">طلابي في {user.assigned_grade}</h2>
              <p className="text-indigo-100 text-sm font-bold mt-1 opacity-90 flex items-center gap-2">
                <GraduationCap size={18} />
                أنت تستعرض طلاب الفصول: {user.assigned_section}
              </p>
           </div>
           <GraduationCap className="absolute -bottom-10 -left-10 text-white/10 w-48 h-48 group-hover:scale-110 transition-transform duration-700" />
           <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 font-black text-lg">
              {filteredStudents.length} طالب
           </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="بحث بالاسم أو السجل المدني..."
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black outline-none cursor-pointer hover:bg-white transition-all" value={filterGrade} onChange={(e) => { setFilterGrade(e.target.value); setFilterSection('الكل'); }}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={handleDeleteAll} disabled={isDeletingAll || students.length === 0} className="flex items-center gap-2 px-6 py-3.5 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all">
                {isDeletingAll ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />} حذف الكل
              </button>
            )}
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              <Plus size={20} /> إضافة طالب جديد
            </button>
            <button onClick={fetchStudents} className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-[2.8rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6 border-b border-slate-800">اسم الطالب</th>
                <th className="px-10 py-6 border-b border-slate-800">المرحلة / الفصل</th>
                <th className="px-10 py-6 border-b border-slate-800">جوال ولي الأمر</th>
                <th className="px-10 py-6 border-b border-slate-800 text-center">إجراءات التواصل والإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/40 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">السجل: {(s as any).student_number || s.studentNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100">
                      {s.grade} - فصل {s.section}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 font-bold tracking-wider">
                      <Phone size={14} className="text-slate-300" />
                      {s.phone || '---'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleQuickContact(s)}
                        title="تواصل سريع عبر واتساب"
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                      >
                        <MessageSquare size={18} />
                      </button>
                      
                      <button 
                        onClick={() => handleSendSmartReport(s)}
                        disabled={sendingReport === s.id}
                        title="تقرير ذكي بالذكاء الاصطناعي"
                        className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100 flex items-center gap-2 group/btn"
                      >
                        {sendingReport === s.id ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="group-hover/btn:animate-pulse" />}
                        <span className="text-[10px] font-black hidden lg:inline">تقرير ذكي</span>
                      </button>

                      <button 
                        onClick={() => handleDeleteStudent(s.id)}
                        title="حذف الطالب"
                        className="p-3 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && !loading && (
          <div className="py-32 text-center">
            <UserX size={64} className="mx-auto text-slate-100 mb-6" />
            <h3 className="text-xl font-black text-slate-300 italic">لا يوجد طلاب يطابقون معايير البحث الحالية</h3>
            <p className="text-slate-400 text-xs font-bold mt-2">تأكد من اختيار المرحلة والفصل الصحيحين</p>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <form onSubmit={handleManualAdd} className="bg-white w-full max-w-xl rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden border border-slate-100">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-blue-600 to-indigo-600"></div>
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800">إضافة طالب جديد للنظام</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">يرجى تعبئة كافة الحقول بدقة لضمان صحة البيانات</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-90"><X/></button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">الاسم الرباعي للطالب</label>
                <input name="name" required placeholder="مثال: أحمد بن خالد بن علي العتيبي" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">رقم السجل المدني</label>
                <input name="student_number" required placeholder="1XXXXXXXXX" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-left" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">المرحلة الدراسية</label>
                  <select name="grade" defaultValue={!isAdmin ? user.assigned_grade : "أول ثانوي"} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none appearance-none cursor-pointer hover:bg-white transition-all">
                    {GRADES.filter(g => g !== 'الكل').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">الفصل</label>
                  <select name="section" defaultValue={!isAdmin ? user.assigned_section?.split(',')[0] : "1"} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none appearance-none cursor-pointer hover:bg-white transition-all text-center">
                    {SECTIONS.filter(s => s !== 'الكل').map(s => <option key={s} value={s}>فصل {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">جوال ولي الأمر</label>
                <div className="relative">
                  <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input name="phone" required placeholder="05XXXXXXXX" className="w-full pr-14 pl-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-left" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-lg shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
              تأكيد إضافة الطالب للنظام
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
