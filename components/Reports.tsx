
import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateStudentReport } from '../services/geminiService';
import { MessageSquare, Send, Search, FileText, Loader2, User as UserIcon } from 'lucide-react';

const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [report, setReport] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    if (error) console.error('Error fetching students:', error);
    else setStudents(data || []);
    setFetching(false);
  };

  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setReport('');
    
    const student = students.find(s => s.id === selectedStudentId);
    
    // محاكاة جلب بيانات الأداء من قاعدة البيانات
    const attendance = 92; // يمكن تطويرها مستقبلاً لجلب النسبة الحقيقية
    const performance = 85;
    
    const result = await generateStudentReport(student?.name || '', attendance, performance);
    setReport(result || '');
    setLoading(false);
  };

  const handleWhatsAppSend = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !student.phone) {
      alert('لا يوجد رقم جوال مسجل لهذا الطالب');
      return;
    }
    const text = encodeURIComponent(report);
    window.open(`https://wa.me/${student.phone}?text=${text}`, '_blank');
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || s.studentNumber.includes(searchTerm)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">اختيار الطالب من السحابة</h3>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="بحث عن طالب..." 
                className="w-full pr-10 pl-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
              {fetching ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setReport('');
                    }}
                    className={`w-full text-right p-3 rounded-xl transition-all flex items-center gap-3 ${
                      selectedStudentId === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedStudentId === s.id ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className={`text-[10px] ${selectedStudentId === s.id ? 'text-blue-100' : 'text-slate-400'}`}>
                        {s.grade} - فصل {s.section}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">لا يوجد طلاب مطابقين</div>
              )}
            </div>
            
            <button
              onClick={handleGenerateReport}
              disabled={!selectedStudentId || loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
              توليد تقرير ذكي (Gemini)
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              معاينة التقرير الذكي
            </h3>
            {report && (
              <button 
                onClick={handleWhatsAppSend}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send size={16} />
                إرسال لولي الأمر (واتساب)
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-50/50 rounded-2xl p-8 relative border border-slate-100 border-dashed">
            {!report && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="p-5 bg-white rounded-3xl shadow-sm">
                  <FileText size={48} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">قم باختيار طالب من القائمة الجانبية لبدء التحليل الذكي</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 gap-4 bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
                <Loader2 className="animate-spin" size={48} />
                <p className="font-bold animate-pulse">جاري تحليل بيانات الطالب عبر Gemini AI...</p>
              </div>
            )}

            {report && (
              <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                {report}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
