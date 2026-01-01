
import React, { useState } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { Lock, Fingerprint, ShieldCheck, GraduationCap, Loader2, Info, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); // يمكن أن يكون سجل مدني أو بريد
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isEmail = identifier.includes('@');
    const adminEmail = "abdulmajeed.s1447@gmail.com";

    try {
      let emailToAuth = identifier.trim();
      let displayName = '';
      let userRole: Role = 'TEACHER';

      if (isEmail) {
        // --- مسار دخول الإدارة (بالبريد) ---
        emailToAuth = identifier.toLowerCase().trim();
        
        // جلب بيانات البروفايل للتأكد من الاسم والرتبة
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('email', emailToAuth)
          .maybeSingle();
        
        displayName = profile?.full_name || (emailToAuth === adminEmail ? 'مدير النظام' : 'مستخدم');
        userRole = (profile?.role as Role) || (emailToAuth === adminEmail ? 'ADMIN' : 'TEACHER');
      } else {
        // --- مسار دخول المعلمين (بالسجل المدني) ---
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, role, full_name, id')
          .eq('teacher_number', identifier.trim())
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (!profile) {
          throw new Error('السجل المدني غير مسجل في النظام. يرجى مراجعة الإدارة.');
        }

        emailToAuth = profile.email;
        displayName = profile.full_name;
        userRole = profile.role as Role;
      }

      // إتمام عملية تسجيل الدخول عبر Supabase Auth
      // للمدير: يجب إدخال كلمة المرور. للمعلم: السجل المدني هو كلمة المرور الافتراضية إذا لم تحدد
      const finalPassword = password || (isEmail ? '' : identifier.trim());
      
      if (isEmail && !password) {
        throw new Error('يرجى إدخال كلمة المرور الخاصة بحساب الإدارة.');
      }

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: finalPassword
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error(isEmail ? 'كلمة مرور الإدارة غير صحيحة.' : 'كلمة المرور غير صحيحة لهذا السجل المدني.');
        }
        throw signInError;
      }

      if (authData.user) {
        onLogin({
          id: authData.user.id,
          name: displayName,
          email: authData.user.email || '',
          role: userRole,
          teacherNumber: isEmail ? undefined : identifier
        });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-['Tajawal']">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 text-center text-white relative">
            <div className="absolute top-4 right-4 opacity-10">
              <ShieldCheck size={80} />
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-3xl mx-auto flex items-center justify-center mb-6 backdrop-blur-md border border-white/30">
              <GraduationCap size={44} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">نظام مدرسة المستقبل</h1>
            <p className="text-indigo-100 mt-2 text-sm font-medium opacity-90">بوابة الدخول الموحدة (إدارة / معلمين)</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl font-bold flex items-start gap-3 animate-pulse">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  {identifier.includes('@') ? <Mail size={20} /> : <Fingerprint size={20} />}
                </div>
                <input
                  type="text"
                  placeholder="السجل المدني أو البريد الإلكتروني"
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-right font-bold text-slate-700"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-right font-bold text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
              {identifier.includes('@') ? 'دخول الإدارة' : 'دخول المعلمين'}
            </button>

            <div className="pt-6 text-center border-t border-slate-50">
              <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> مشفر</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> آمن</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> سحابي</span>
              </div>
            </div>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-xs font-medium">
          الدعم الفني: abdulmajeed.s1447@gmail.com
        </p>
      </div>
    </div>
  );
};

export default Login;
