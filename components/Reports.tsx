
import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateStudentReport } from '../services/geminiService';
import { MessageSquare, Send, Search, FileText, Loader2 } from 'lucide-react';

const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [report, setReport] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
    // Removed direct API_KEY checks as the application must not manage or request keys from the user
  }, []);

  const fetchStudents = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Supabase fetch error:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setReport('');
    
    const student = students.find(s => s.id === selectedStudentId);
    const result = await generateStudentReport(student?.name || '', 95, 88);
    setReport(result || '');
    setLoading(false);
  };

  const handleWhatsAppSend = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !student.phone) return alert('رقم الجوال غير موجود');
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(report)}`, '_blank');
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || (s.studentNumber && s.studentNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Removed keyError alert as per guidelines to not ask for or configure API keys in UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">اختيار الطالب</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="بحث سريع..." 
                  className="w-full pr-10 pl-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-2">
                {fetching ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : filteredStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStudentId(s.id); setReport(''); }}
                    className={`w-full text-right p-3 rounded-xl transition-all flex items-center gap-3 ${
                      selectedStudentId === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-sm truncate">{s.name}</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleGenerateReport}
                disabled={!selectedStudentId || loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                توليد تقرير ذكي
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[500px] flex flex-col relative">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                المعاينة
              </h3>
              {report && <button onClick={handleWhatsAppSend} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"><Send size={14} /> إرسال</button>}
            </div>

            <div className="flex-1 bg-slate-50 rounded-2xl p-6 overflow-y-auto">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 rounded-2xl">
                  <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-600">جاري التحليل عبر Gemini...</p>
                </div>
              ) : report ? (
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{report}</div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <FileText size={40} className="opacity-10" />
                  <p className="text-xs">التقرير سيظهر هنا بعد الضغط على توليد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;