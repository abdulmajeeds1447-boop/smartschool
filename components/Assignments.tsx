
import React, { useState } from 'react';
import { Plus, BookOpen, Clock, Users, ChevronLeft, CheckCircle, AlertCircle, Star } from 'lucide-react';

const Assignments: React.FC = () => {
  const [view, setView] = useState<'LIST' | 'DETAILS'>('LIST');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const mockAssignments = [
    { id: 1, title: 'بحث في علم الفيزياء - قوانين الحركة', grade: 'الأول الثانوي', section: 'أ', submissions: 24, total: 30, deadline: '2024-05-15', status: 'ACTIVE' },
    { id: 2, title: 'حل واجب الرياضيات - الدوال واللوغاريتمات', grade: 'الثاني الثانوي', section: 'ب', submissions: 28, total: 32, deadline: '2024-05-12', status: 'EXPIRED' },
    { id: 3, title: 'ملف أعمال - اللغة العربية (الشعر الأموي)', grade: 'الثالث الثانوي', section: 'ج', submissions: 15, total: 28, deadline: '2024-05-20', status: 'ACTIVE' },
  ];

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setView('DETAILS');
  };

  if (view === 'DETAILS') {
    return (
      <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
        <button 
          onClick={() => setView('LIST')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
        >
          <ChevronLeft className="rotate-180" size={20} />
          العودة لقائمة التكليفات
        </button>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black mb-2 inline-block">{selectedTask.grade}</span>
              <h2 className="text-2xl font-bold text-slate-800">{selectedTask.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-400 mb-1">نسبة التسليم</div>
              <div className="text-2xl font-black text-blue-600">%{Math.round((selectedTask.submissions / selectedTask.total) * 100)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Users size={18} />
              قائمة الطلاب والتسليمات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">ط</div>
                    <div>
                      <div className="font-bold text-slate-800">طالب عينة {i}</div>
                      <div className="text-[10px] text-slate-400">تم التسليم: 2024-05-10</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="درجة" 
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">التكليفات الأكاديمية</h3>
          <p className="text-sm text-slate-500">إدارة البحوث والواجبات المنزلية وملفات الأعمال</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
          <Plus size={18} />
          إنشاء تكليف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAssignments.map((assignment) => (
          <div 
            key={assignment.id} 
            onClick={() => handleTaskClick(assignment)}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${assignment.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                  <BookOpen size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg mb-1">
                    {assignment.grade}
                  </span>
                  {assignment.status === 'EXPIRED' && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> منتهي
                    </span>
                  )}
                </div>
              </div>
              
              <h4 className="font-bold text-slate-800 text-lg mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                {assignment.title}
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-bold mb-1">التسليمات</div>
                  <div className="text-sm font-black text-slate-700">{assignment.submissions} / {assignment.total}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-bold mb-1">الموعد النهائي</div>
                  <div className="text-sm font-black text-slate-700">{assignment.deadline}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    +{assignment.submissions - 3}
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assignments;
