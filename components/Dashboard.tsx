
import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, TrendingUp, ShieldCheck, LayoutGrid, 
  Loader2, ArrowUpRight, BookOpen, ClipboardCheck, Star, UserCog,
  School, Activity
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
    activeClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: tCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: schCount } = await supabase.from('schedule').select('*', { count: 'exact', head: true });
      
      setStats({
        studentsCount: sCount || 0,
        teachersCount: tCount || 0,
        scheduleCount: schCount || 0,
        activeClasses: schCount ? Math.floor(schCount / 5) : 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-right cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${color} shadow-lg group-hover:rotate-12 transition-transform`}>
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
        <p className="text-slate-400 font-bold">جاري تحديث البيانات الإدارية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-['Tajawal'] text-right">
      {/* Welcome Banner */}
      <div className={`p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden bg-gradient-to-r ${isAdmin ? 'from-slate-900 to-[#1e293b]' : 'from-blue-700 to-indigo-600'}`}>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">
            {isAdmin ? `أهلاً بك سعادة المدير، ${user.name} 🏛️` : `مرحباً بك يا أستاذ، ${user.name} 🍎`}
          </h2>
          <p className="text-white/70 font-medium max-w-lg">
            {isAdmin 
              ? 'أنت في لوحة التحكم المركزية للمدير. تتوفر لك أدوات الإشراف الكامل على المعلمين، الجداول، وقاعدة بيانات الطلاب.'
              : `أهلاً بك في فضاء المعلم. يمكنك رصد الحضور، المتابعة اليومية، وإدارة حصصك بذكاء.`
            }
          </p>
        </div>
        <ShieldCheck className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          <>
            <StatCard title="المعلمين المعتمدين" value={stats.teachersCount} icon={UserCog} color="bg-indigo-600" onClick={() => onNavigate('users')} />
            <StatCard title="إجمالي الطلاب" value={stats.studentsCount} icon={Users} color="bg-blue-600" onClick={() => onNavigate('students')} />
            <StatCard title="أنصبة الحصص" value={stats.scheduleCount} icon={Calendar} color="bg-amber-600" onClick={() => onNavigate('schedule')} />
            <StatCard title="كفاءة المدرسة" value="98%" icon={Activity} color="bg-emerald-600" onClick={() => onNavigate('reports')} />
          </>
        ) : (
          <>
            <StatCard title="حصص اليوم" value="6 حصص" icon={Calendar} color="bg-blue-600" onClick={() => onNavigate('attendance')} />
            <StatCard title="إجمالي طلابي" value={stats.studentsCount} icon={Users} color="bg-indigo-600" onClick={() => onNavigate('students')} />
            <StatCard title="نسبة الحضور" value="94%" icon={ClipboardCheck} color="bg-amber-600" onClick={() => onNavigate('attendance')} />
            <StatCard title="تقارير ذكية" value="تحديث" icon={TrendingUp} color="bg-emerald-600" onClick={() => onNavigate('reports')} />
          </>
        )}
      </div>

      {/* Quick Access */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
          <LayoutGrid size={22} className="text-blue-600" />
          {isAdmin ? 'الإدارة المدرسية العليا' : 'مركز العمليات التعليمية'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {isAdmin ? (
             <>
               <button onClick={() => onNavigate('users')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-indigo-50 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><UserCog className="text-indigo-600" size={32} /></div>
                  <p className="font-black text-slate-800">إدارة المعلمين</p>
               </button>
               <button onClick={() => onNavigate('schedule')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-blue-50 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Calendar className="text-blue-600" size={32} /></div>
                  <p className="font-black text-slate-800">إسناد الجداول</p>
               </button>
               <button onClick={() => onNavigate('students')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-emerald-50 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Users className="text-emerald-600" size={32} /></div>
                  <p className="font-black text-slate-800">بيانات الطلاب</p>
               </button>
             </>
           ) : (
             <>
               <button onClick={() => onNavigate('attendance')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-blue-50 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><ClipboardCheck className="text-blue-600" size={32} /></div>
                  <p className="font-black text-slate-800">رصد الحضور</p>
               </button>
               <button onClick={() => onNavigate('schedule')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-indigo-50 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><BookOpen className="text-indigo-600" size={32} /></div>
                  <p className="font-black text-slate-800">جدولي الدراسي</p>
               </button>
               <button onClick={() => onNavigate('reports')} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 hover:bg-emerald-50 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Star className="text-emerald-600" size={32} /></div>
                  <p className="font-black text-slate-800">تقارير التميز</p>
               </button>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
