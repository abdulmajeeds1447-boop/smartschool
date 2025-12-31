
import React, { useState } from 'react';
import { MOCK_STUDENTS } from '../constants';
import { generateStudentReport } from '../services/geminiService';
import { MessageSquare, Send, Search, FileText, Loader2 } from 'lucide-react';

const Reports: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');

  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    const student = MOCK_STUDENTS.find(s => s.id === selectedStudentId);
    // Simulate some metrics
    const attendance = 94;
    const performance = 88;
    
    const result = await generateStudentReport(student?.name || '', attendance, performance);
    setReport(result || '');
    setLoading(false);
  };

  const handleWhatsAppSend = () => {
    const student = MOCK_STUDENTS.find(s => s.id === selectedStudentId);
    const text = encodeURIComponent(report);
    window.open(`https://wa.me/${student?.phone}?text=${text}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">اختر الطالب</h3>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="w-full pr-10 pl-4 py-2 text-sm border border-slate-200 rounded-lg" 
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {MOCK_STUDENTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`w-full text-right p-3 rounded-xl transition-all ${
                    selectedStudentId === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className={`text-[10px] ${selectedStudentId === s.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {s.grade} - فصل {s.section}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={!selectedStudentId || loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
              توليد تقرير ذكي (Gemini)
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              معاينة التقرير
            </h3>
            {report && (
              <button 
                onClick={handleWhatsAppSend}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send size={16} />
                إرسال عبر واتساب
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl p-6 relative">
            {!report && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                <FileText size={48} className="opacity-20" />
                <p>اختر طالباً واضغط على "توليد تقرير" للبدء</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 gap-3">
                <Loader2 className="animate-spin" size={48} />
                <p className="font-bold">جاري تحليل البيانات وإنشاء التقرير...</p>
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
