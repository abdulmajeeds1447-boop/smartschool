
import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { supabase } from './services/supabaseClient';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentsList from './components/StudentsList';
import TeacherSchedule from './components/TeacherSchedule';
import Attendance from './components/Attendance';
import Reports from './components/Reports';
import UsersManagement from './components/UsersManagement';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initializing, setInitializing] = useState(true);

  const ownerEmail = "abdulmajeed.s1447@gmail.com";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const isOwner = session.user.email === ownerEmail;
          const userRole = isOwner ? 'ADMIN' : (profile?.role || 'TEACHER') as Role;

          const currentUser = {
            id: session.user.id,
            name: profile?.full_name || 'مستخدم',
            email: session.user.email || '',
            role: userRole,
            teacherNumber: profile?.teacher_number,
            assigned_grade: profile?.assigned_grade,
            assigned_section: profile?.assigned_section,
          };

          setUser(currentUser);
          
          // التوجيه الذكي فور تسجيل الدخول
          if (userRole === 'TEACHER' && activeTab === 'dashboard') {
            setActiveTab('attendance');
          }
        }
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setInitializing(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setActiveTab('dashboard');
      } else if (event === 'SIGNED_IN') {
        checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white gap-4" dir="rtl">
        <Loader2 className="animate-spin text-blue-500" size={64} />
        <p className="font-black text-lg font-['Tajawal']">ثانوية الأمير عبدالمجيد الأولى</p>
        <p className="text-slate-400 text-xs animate-pulse">جاري استعادة الجلسة السحابية...</p>
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
