
import React from 'react';
import { User, Role } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  BookOpen, 
  BarChart3, 
  LogOut,
  Bell,
  UserCircle
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, activeTab, setActiveTab, children }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['ADMIN', 'VICE_PRINCIPAL', 'TEACHER'] as Role[] },
    { id: 'students', label: 'الطلاب', icon: Users, roles: ['ADMIN', 'VICE_PRINCIPAL', 'ATTENDANCE_OFFICER'] as Role[] },
    { id: 'schedule', label: 'الجدول المدرسي', icon: Calendar, roles: ['TEACHER', 'ADMIN'] as Role[] },
    { id: 'attendance', label: 'الحضور والغياب', icon: ClipboardCheck, roles: ['TEACHER', 'ATTENDANCE_OFFICER', 'ADMIN'] as Role[] },
    { id: 'assignments', label: 'الواجبات والمشاركة', icon: BookOpen, roles: ['TEACHER', 'PARENT', 'ADMIN'] as Role[] },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: BarChart3, roles: ['ADMIN', 'VICE_PRINCIPAL', 'TEACHER'] as Role[] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">م</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">مدرسة المستقبل</h1>
            <span className="text-xs text-slate-400">نظام الإدارة المتكامل</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white">3</span>
            </button>
            <div className="flex items-center gap-3 pr-6 border-r">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role === 'ADMIN' ? 'مدير النظام' : 'معلم'}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 border border-slate-300">
                <UserCircle size={28} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
