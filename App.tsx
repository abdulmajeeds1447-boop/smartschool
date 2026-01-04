
import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { supabase } from './services/supabaseClient';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentsList from './components/StudentsList';
import TeacherSchedule from './components/TeacherSchedule';
import Attendance from './components/Attendance';
import Assignments from './components/Assignments';
import Reports from './components/Reports';
import UsersManagement from './components/UsersManagement';
import { Loader2, DatabaseZap } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const ownerEmail = "abdulmajeed.s1447@gmail.com";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        const session = sessionData?.session;

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError && profileError.message !== 'Failed to fetch') {
            console.error("Profile error:", profileError);
          }

          const isOwner = session.user.email === ownerEmail;
          const role = isOwner ? 'ADMIN' : ((profile?.role as Role) || 'TEACHER');

          setUser({
            id: session.user.id,
            name: profile?.full_name || session.user.user_metadata?.full_name || (isOwner ? 'مدير النظام' : 'مستخدم'),
            email: session.user.email || '',
            role: role,
            teacherNumber: profile?.teacher_number,
            assigned_grade: profile?.assigned_grade,
            assigned_section: profile?.assigned_section,
            specialization: profile?.specialization
          });

          if (role === 'TEACHER') {
            setActiveTab('attendance');
          }
        }
      } catch (err: any) {
        console.error("Initialization error:", err);
        if (err.message === 'Failed to fetch') {
           setInitError('تعذر الاتصال بالخادم. يرجى التحقق من الإنترنت.');
        }
      } finally {
        setInitializing(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-white gap-4" dir="rtl">
        <Loader2 className="animate-spin text-blue-500" size={64} />
        <p className="font-black text-lg font-['Tajawal']">ثانوية الأمير عبدالمجيد الأولى</p>
        <p className="text-slate-500 text-xs animate-pulse font-['Tajawal']">جاري استعادة جلسة العمل السحابية...</p>
      </div>
    );
  }

  if (initError && !user) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[2.5rem] max-w-md shadow-2xl">
          <DatabaseZap size={48} className="text-amber-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-black text-amber-900 mb-2 font-['Tajawal']">مشكلة في الاتصال</h2>
          <p className="text-sm text-amber-800 font-bold mb-6 font-['Tajawal']">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black font-['Tajawal'] shadow-lg active:scale-95 transition-all"
          >
            إعادة المحاولة الآن
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => {
      setUser(u);
      if (u.role === 'TEACHER') setActiveTab('attendance');
    }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} onNavigate={setActiveTab} />;
      case 'students': return <StudentsList user={user} />;
      case 'schedule': return <TeacherSchedule user={user} />;
      case 'attendance': return <Attendance user={user} />;
      case 'assignments': return <Assignments user={user} onNavigate={setActiveTab} />;
      case 'reports': return <Reports user={user} />;
      case 'users': return <UsersManagement />;
      default: return <Dashboard user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
