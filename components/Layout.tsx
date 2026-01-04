
import React from 'react';
import { User, Role } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  BarChart3, 
  LogOut,
  Bell,
  UserCircle,
  ShieldCheck,
  Power,
  Zap,
  UserCog
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

const LayoutComponent: React.FC<LayoutProps> = ({ user, onLogout, activeTab, setActiveTab, children }) => {
  const isAdmin = user.role === 'ADMIN';

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER'] as Role[] },
    { id: 'attendance', label: 'رصد الحصص', icon: ClipboardCheck, roles: ['TEACHER'] as Role[] },
    { id: 'users', label: 'إدارة المعلمين', icon: UserCog, roles: ['ADMIN'] as Role[] },
    { id: 'schedule', label: isAdmin ? 'إسناد' : 'الجدول', icon: Calendar, roles: ['ADMIN', 'TEACHER'] as Role[] },
    { id: 'students', label: 'الطلاب', icon: Users, roles: ['ADMIN', 'TEACHER'] as Role[] },
    { id: 'reports', label: 'التقارير', icon: BarChart3, roles: ['ADMIN', 'TEACHER'] as Role[] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden text-right font-['Tajawal']" dir="rtl">
      {/* Sidebar - Desktop (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white flex-col shadow-2xl z-50">
        <div className="p-8 flex items-center gap-4 border-b border-slate-800/50">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">ع</div>
          <div>
            <h1 className="font-black text-sm leading-tight tracking-wide">ثانوية الأمير عبدالمجيد</h1>
            <span className="text-[10px] text-indigo-400 font-bold block mt-1 uppercase tracking-widest italic">الجيل الرابع لإدارة التعليم</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:text-indigo-400'} />
                <span className="font-black text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-black text-sm group">
            <Power size={22} className="group-hover:rotate-12 transition-transform" />
            <span>خروج آمن</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b flex items-center justify-between px-6 lg:px-10 z-40 sticky top-0 border-slate-100">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-50">ع</div>
             <div>
                <h2 className="text-xl font-black text-slate-800">
                  {menuItems.find(i => i.id === activeTab)?.label}
                </h2>
                <p className="text-[9px] text-slate-400 font-bold sm:hidden">ثانوية الأمير عبدالمجيد الأولى</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-left items-end">
              <p className="text-sm font-black text-slate-800 leading-none">{user.name}</p>
              <p className="text-[9px] text-indigo-500 font-black mt-1 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {isAdmin ? 'المشرف العام' : 'الكادر التعليمي'}
              </p>
            </div>
            <div className="w-11 h-11 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer">
               <UserCircle size={28} className="group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 pb-36 lg:pb-10 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* 🏝️ الشريط السفلي المطور (The Floating Island) 🏝️ */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[100] transition-all">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[2.8rem] flex items-center justify-between px-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
            
            <nav className="flex items-center justify-between w-full relative z-10">
              {filteredMenu.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex flex-col items-center justify-center h-14 w-14 rounded-full transition-all duration-500 ${
                      activeTab === item.id 
                        ? 'text-white' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-in zoom-in duration-300"></div>
                    )}
                    <Icon size={20} className={`relative z-10 ${activeTab === item.id ? 'scale-110' : ''}`} />
                    <span className={`relative z-10 text-[8px] font-black mt-0.5 ${activeTab === item.id ? 'block' : 'hidden'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
              <div className="w-[1px] h-8 bg-white/10 mx-1"></div>
              <button 
                onClick={onLogout}
                className="flex flex-col items-center justify-center h-14 w-14 text-rose-500 hover:text-rose-400 transition-colors active:scale-90"
              >
                <Power size={20} />
                <span className="text-[8px] font-black mt-0.5">خروج</span>
              </button>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LayoutComponent;
