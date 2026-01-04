
import React from 'react';
import { User } from '../types';
import { BookOpen, ArrowRight, ClipboardCheck, Sparkles } from 'lucide-react';

interface AssignmentsProps {
  user: User;
  onNavigate: (tab: string) => void;
}

const Assignments: React.FC<AssignmentsProps> = ({ user, onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 lg:py-24 space-y-8 text-center font-['Tajawal'] px-4">
      <div className="relative">
        <div className="w-28 h-28 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner animate-pulse">
          <BookOpen size={56} />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Sparkles size={20} />
        </div>
      </div>
      
      <div className="space-y-4 max-w-md">
        <h2 className="text-3xl font-black text-slate-800">سجل المتابعة المدمج</h2>
        <p className="text-slate-500 font-bold leading-relaxed">
          لتوفير الوقت، تم دمج سجلات المتابعة والواجبات مباشرة داخل واجهة "الحصص". يمكنك الآن رصد الحضور والواجب في شاشة واحدة!
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => onNavigate('attendance')}
          className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all active:scale-95 group"
        >
          <ClipboardCheck size={24} className="group-hover:text-blue-400 transition-colors" />
          ابدأ رصد المتابعة الآن
          <ArrowRight size={20} className="rotate-180" />
        </button>
        
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl text-right">
          <p className="text-[11px] font-black text-amber-800 leading-tight">
            * نصيحة: عند فتح أي حصة من تبويب "الحصص"، ستجد ثلاثة أزرار في الأعلى للتنقل بين (الحضور، المتابعة، الملاحظات).
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
