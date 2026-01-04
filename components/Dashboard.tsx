
import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, TrendingUp, Activity, 
  ShieldCheck, LayoutGrid, Loader2, ArrowUpRight, BookOpen, ClipboardCheck, Star
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface DashboardProps {
  user: User;
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    scheduleCount: 0,
    assignmentsCount: 0,
    todayClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const todayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date().getDay()];
      
      // جلب الإحصائيات مع معالجة الأخطاء لكل استعلام بشكل مستقل
      let sCount = 0;
      try {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
        sCount = count || 0;
      } catch (e) { console.warn("Students fetch failed", e); }

      let tCount = 0;
      try {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        tCount = count || 0;
      } catch (e) { console.warn("Profiles fetch failed", e); }

      let schCount = 0;
      try {
        const { count } = await supabase.from('schedule').select('*', { count: 'exact', head: true });
        schCount = count || 0;
      } catch (e) { console.warn("Schedule fetch failed", e); }
      
      let aCount = 0;
      try {
        const { count } = await supabase.from('assignments').select('*', { count: 'exact', head: true });
        aCount = count || 0;
      } catch (e) { console.warn("Assignments fetch failed", e); }
      
      let tClasses = 0;
      if (!isAdmin) {
        try {
          const { count } = await supabase.from('schedule')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', user.id)
            .eq('day', todayName);
          tClasses = count || 0;
        } catch (e) { console.warn("Today classes fetch failed", e); }
      }

      setStats({
        studentsCount: sCount,
        teachersCount: tCount,
        scheduleCount: schCount,
        assignmentsCount: aCount,
        todayClasses: tClasses
      });
    } catch (error) {
      console.error("Dashboard Global Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-right cursor-pointer group active:scale-95"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="text-white" size={24} />
        </div>
        <ArrowUpRight className="text-slate-200 group-hover:text-blue-500" size={20} />
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-400 font-bold">جاري تحميل لوحتك الخاصة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-['Tajawal'] text-right">
      <div className={`p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden bg-gradient-to-r ${isAdmin ? 'from-slate-900 to-slate-800' : 'from-indigo-700 to-blue-600'}`}>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">
            {isAdmin ? `أهلاً بك سعادة المدير، ${user.name} 🏛️` : `مرحباً بك يا أستاذ، ${user.name} 🍎`}
          </h2>
          <p className="text-white/70 font-medium max-w-lg">
            {isAdmin 
              ? 'أنت الآن في لوحة التحكم المركزية. يمكنك إدارة الكادر التعليمي، إسناد الجداول، ومتابعة التقارير العامة للمدرسة.'
              : `لديك اليوم ${stats.todayClasses} حصص مجدولة. يمكنك البدء برصد الحضور والمتابعة مباشرة من هنا.`
            }
          </p>
        </div>
        {isAdmin ? <ShieldCheck className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" /> : <BookOpen className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          <>
            <StatCard title="إجمالي الطلاب" value={stats.studentsCount} icon={Users} color="bg-blue-600" onClick={() => onNavigate('students')} />
            <StatCard title="المعلمين النشطين" value={stats.teachersCount} icon={ShieldCheck} color="bg-indigo-600" onClick={() => onNavigate('users')} />
            <StatCard title="الحصص المسندة" value={stats.scheduleCount} icon={Calendar} color="bg-amber-600" onClick={() => onNavigate('schedule')} />
            <StatCard title="سجلات المتابعة" value={stats.assignmentsCount} icon={Activity} color="bg-emerald-600" onClick={() => onNavigate('reports')} />
          </>
        ) : (
          <>
            <StatCard title="حصصي اليوم" value={stats.todayClasses} icon={Calendar} color="bg-blue-600" onClick={() => onNavigate('attendance')} />
            <StatCard title="طلابي" value={stats.studentsCount} icon={Users} color="bg-indigo-600" onClick={() => onNavigate('students')} />
            <StatCard title="سجل المتابعة" value={stats.assignmentsCount} icon={Star} color="bg-amber-600" onClick={() => onNavigate('attendance')} />
            <StatCard title="التقارير" value="تحليل آلي" icon={TrendingUp} color="bg-emerald-600" onClick={() => onNavigate('reports')} />
          </>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
          <LayoutGrid size={22} className="text-blue-600" />
          {isAdmin ? 'مركز العمليات والإدارة' : 'الوصول السريع للمهام'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {isAdmin ? (
             <>
               <button onClick={() => onNavigate('users')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><ShieldCheck className="text-indigo-600" size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800">إدارة المعلمين</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">تفعيل حسابات الكادر</p>
                  </div>
               </button>
               <button onClick={() => onNavigate('schedule')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Calendar className="text-blue-600" size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800">توزيع الإسناد</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">تعديل الجدول المدرسي</p>
                  </div>
               </button>
               <button onClick={() => onNavigate('reports')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><TrendingUp className="text-emerald-600" size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800">التقارير العامة</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">متابعة الأداء والإحصائيات</p>
                  </div>
               </button>
             </>
           ) : (
             <>
               <button onClick={() => onNavigate('attendance')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><ClipboardCheck className="text-blue-600" size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800">رصد الحصص</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">حضور ومتابعة فورية</p>
                  </div>
               </button>
               <button onClick={() => onNavigate('schedule')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Calendar className="text-indigo-600" size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800">جدولي الدراسي</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">عرض الحصص الأسبوعية</p>
                  </div>
               </button>
               <button onClick={() => onNavigate('reports')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><TrendingUp className="text-emerald-600" size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-800">تقارير الطلاب</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">إرسال تقارير ذكية للأهالي</p>
                  </div>
               </button>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
