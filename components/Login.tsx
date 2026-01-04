
import React, { useState } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { Lock, Fingerprint, ShieldCheck, GraduationCap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{msg: string, type: 'error' | 'info'} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input = identifier.trim();
    const ownerEmail = "abdulmajeed.s1447@gmail.com";
    const isSystemAdmin = input.toLowerCase() === 'admin' || input.toLowerCase() === ownerEmail;

    try {
      let targetEmail = isSystemAdmin ? ownerEmail : `${input}@school.com`;
      let targetPassword = password || input;

      // التأكد من وجود المعلم في النظام أولاً
      if (!isSystemAdmin) {
        const { data: profileExists } = await supabase
          .from('profiles')
          .select('id')
          .eq('teacher_number', input)
          .maybeSingle();

        if (!profileExists) {
          setError({ msg: 'السجل المدني غير مسجل في النظام. يرجى مراجعة الإدارة.', type: 'error' });
          setLoading(false);
          return;
        }
      }

      let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials") && !isSystemAdmin) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: targetEmail,
            password: targetPassword,
          });
          if (signUpError) throw signUpError;
          authData = { user: signUpData.user, session: signUpData.session };
        } else {
          throw signInError;
        }
      }

      if (authData?.user) {
        const userId = authData.user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const role = isSystemAdmin ? 'ADMIN' : (profile?.role || 'TEACHER');
        
        const { data: finalProfile } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            teacher_number: isSystemAdmin ? null : input,
            full_name: profile?.full_name || (isSystemAdmin ? 'مدير النظام' : 'معلم'),
            email: targetEmail,
            role: role
          })
          .select()
          .single();

        onLogin({
          id: userId,
          name: finalProfile.full_name,
          email: targetEmail,
          role: finalProfile.role as Role,
          teacherNumber: input,
          assigned_grade: finalProfile.assigned_grade,
          assigned_section: finalProfile.assigned_section
        });
      }
    } catch (err: any) {
      setError({ msg: 'خطأ في الدخول: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-['Tajawal']" dir="rtl">
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* Header - Matching Screenshot */}
        <div className="bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] p-12 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-white/20 rounded-[2rem] mx-auto flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 shadow-xl">
              <GraduationCap size={48} className="text-white" />
            </div>
            <h1 className="text-2xl font-black mb-1">ثانوية الأمير عبدالمجيد الأولى</h1>
            <p className="text-blue-100 text-[10px] font-bold opacity-80">بوابة المزامنة الموحدة - الإصدار الرابع</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
              <AlertCircle size={18} />
              {error.msg}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 px-2">اسم المستخدم (السجل المدني)</label>
              <div className="relative">
                <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="text"
                  placeholder="رقم السجل المدني الخاص بك"
                  className="w-full pr-12 pl-4 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-right font-bold outline-none"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 px-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="password"
                  placeholder="السجل المدني (لأول مرة)"
                  className="w-full pr-12 pl-4 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-right font-bold outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-[#2563eb] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />} 
            دخول النظام الموحد
          </button>

          <div className="pt-4 flex items-center justify-center gap-4">
             <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">✓ مشفر</span>
             <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">✓ آمن</span>
             <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">✓ سحابي</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
