
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
          // جلب البروفايل فوراً للتأكد من الدور
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const isOwner = session.user.email === ownerEmail;
          // الدور يحسب بناءً على القاعدة أو الافتراضي هو معلم
          const userRole = isOwner ? 'ADMIN' : (profile?.role || 'TEACHER') as Role;

          setUser({
            id: session.user.id,
            name: profile?.full_name || 'مستخدم',
            email: session.user.email || '',
            role: userRole,
            teacherNumber: profile?.teacher_number,
            assigned_grade: profile?.assigned_grade,
            assigned_section: profile?.assigned_section,
          });

          // التوجيه التلقائي بناءً على الدور
          if (userRole === 'TEACHER' && activeTab === 'dashboard') {
            setActiveTab('attendance');
          } else if (userRole === 'ADMIN' && activeTab === 'attendance') {
            setActiveTab('dashboard');
          }
        }
      } catch (err: any) {
        console.error("Init Error:", err);
        setInitError('مشكلة في الاتصال بالخادم');
      } finally {
        setInitializing(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setActiveTab('dashboard');
      } else if (event === 'SIGNED_IN' && session?.user) {
        checkUser(); // إعادة الفحص عند الدخول
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
        <p className="font-black text-lg font-['Tajawal'] tracking-wider">ثانوية الأمير عبدالمجيد الأولى</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => {
      setUser(u);
      setActiveTab(u.role === 'ADMIN' ? 'dashboard' : 'attendance');
    }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} onNavigate={setActiveTab} />;
      case 'students': return <StudentsList user={user} />;
      case 'schedule': return <TeacherSchedule user={user} />;
      case 'attendance': return <Attendance user={user} />;
      case 'reports': return <Reports user={user} />;
      case 'users': return <UsersManagement />;
      default: return <Dashboard user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
