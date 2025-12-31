
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
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // التحقق من الجلسة الحالية عند تشغيل التطبيق
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.email?.split('@')[0] || 'مستخدم',
          email: session.user.email || '',
          role: (profile?.role as Role) || 'TEACHER'
        });
      }
      setInitializing(false);
    };

    checkUser();

    // الاستماع لتغييرات حالة تسجيل الدخول
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="font-bold text-lg">جاري تحميل نظام مدرسة المستقبل...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <StudentsList />;
      case 'schedule': return <TeacherSchedule />;
      case 'attendance': return <Attendance />;
      case 'assignments': return <Assignments />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
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
