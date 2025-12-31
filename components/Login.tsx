
import React, { useState } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ShieldCheck, GraduationCap, Loader2, UserPlus } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('TEACHER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });
        if (signUpError) throw signUpError;
        alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول الآن.');
        setIsSignUp(false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;

        if (data.user) {
          // جلب بيانات البروفايل (الدور والاسم)
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          onLogin({
            id: data.user.id,
            name: profile?.full_name || data.user.email?.split('@')[0] || 'مستخدم',
            email: data.user.email || '',
            role: (profile?.role as Role) || 'TEACHER'
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-blue-600 p-10 text-center text-white relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">مدرسة المستقبل الثانوية</h1>
            <p className="text-blue-100 mt-2">{isSignUp ? 'إنشاء حساب نظام جديد' : 'نظام الإدارة المدرسية الموحد'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-medium text-center">
                {error}
              </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'TEACHER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                معلم
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                إدارة
              </button>
              <button
                type="button"
                onClick={() => setRole('PARENT')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'PARENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                ولي أمر
              </button>
            </div>

            <div className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              {isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </button>

            <div className="text-center">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 font-bold hover:underline"
              >
                {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ اضغط هنا للتسجيل'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
