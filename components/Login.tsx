
import React, { useState } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { Lock, Fingerprint, ShieldCheck, GraduationCap, Loader2, AlertCircle, Sparkles, CheckCircle2, UserX, Settings, MailWarning, WifiOff, Globe, DatabaseZap } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{msg: string, type: 'error' | 'info' | 'success' | 'admin_alert' | 'network_error'} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input = identifier.trim();
    if (!input) {
      setError({ msg: 'يرجى إدخال رقم السجل المدني أو البريد', type: 'error' });
      setLoading(false);
      return;
    }

    const ownerEmail = "abdulmajeed.s1447@gmail.com";
    const isEmail = input.includes('@');
    const isSystemAdmin = input.toLowerCase() === 'admin' || input.toLowerCase() === ownerEmail || (isEmail && input.toLowerCase() === ownerEmail);

    try {
      let targetEmail = isSystemAdmin ? ownerEmail : `${input}@school.com`;
      let targetPassword = password || input;

      // 1. التحقق من القائمة البيضاء (profiles)
      if (!isSystemAdmin && !isEmail) {
        const { data: profileExists, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('teacher_number', input)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileExists) {
          setError({ 
            msg: 'هذا السجل المدني غير مسجل في قائمة المعلمين المعتمدين. يرجى مراجعة إدارة المدرسة للتأكد من إضافتك.', 
            type: 'error' 
          });
          setLoading(false);
          return;
        }
      }

      // 2. محاولة تسجيل الدخول
      let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword
      });

      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          setError({ 
            msg: 'تنبيه للمدير: البريد غير مؤكد. يرجى تعطيل خيار "Confirm Email" من إعدادات Supabase Authentication.', 
            type: 'admin_alert' 
          });
          setLoading(false);
          return;
        }
        
        if (signInError.message.includes("Invalid login credentials") && !isSystemAdmin && !isEmail) {
          setError({ msg: 'جاري تهيئة حسابك الجديد للمرة الأولى، فضلاً انتظر...', type: 'info' });
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
          .or(`teacher_number.eq.${input},id.eq.${userId}`)
          .maybeSingle();

        const role = isSystemAdmin ? 'ADMIN' : (profile?.role || 'TEACHER');
        
        const { data: finalProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            teacher_number: isSystemAdmin ? null : input,
            full_name: profile?.full_name || (isSystemAdmin ? 'المدير' : 'معلم'),
            email: targetEmail,
            role: role,
            assigned_grade: profile?.assigned_grade,
            assigned_section: profile?.assigned_section
          })
          .select()
          .single();

        if (upsertError) throw upsertError;

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
      console.error("Login Diagnostic Error:", err);
      
      // التعامل الذكي مع خطأ Failed to fetch
      if (err.message === 'Failed to fetch' || err.code === 'PGRST301' || err.status === 0) {
        setError({ 
          msg: 'تعذر الاتصال بقاعدة البيانات (Failed to fetch). قد يكون مشروع Supabase متوقف مؤقتاً أو هناك مشكلة في اتصال الإنترنت لديك.', 
          type: 'network_error' 
        });
      } else {
        setError({ 
          msg: 'حدث خطأ أثناء تسجيل الدخول: ' + (err.message || 'يرجى مراجعة البيانات'), 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4 font-['Tajawal'] text-right" dir="rtl">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        
        {/* تنبيه خطأ الشبكة المطور */}
        {error?.type === 'network_error' && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-200 p-6 rounded-[2.5rem] shadow-xl animate-in slide-in-from-top">
            <div className="flex items-center gap-3 text-amber-700 mb-3">
              <DatabaseZap className="animate-bounce" size={24} />
              <h3 className="font-black text-sm">خطأ في الاتصال بالخادم</h3>
            </div>
            <div className="space-y-3">
               <p className="text-[10px] text-amber-900 font-bold leading-relaxed">
                تطبيقك يحاول الوصول لقاعدة البيانات ولكنها لا تستجيب. يرجى التأكد مما يلي:
              </p>
              <ul className="text-[9px] text-amber-800 space-y-1 font-bold list-disc pr-4">
                <li>اتصال الإنترنت الخاص بك نشط ومستقر.</li>
                <li>مشروع Supabase غير متوقف (Paused) في لوحة التحكم.</li>
                <li>رابط قاعدة البيانات غير محظور بواسطة برامج الحماية أو جدار الحماية.</li>
              </ul>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
              >
                تحديث الصفحة وإعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {error?.type === 'admin_alert' && (
          <div className="mb-6 bg-rose-50 border-2 border-rose-200 p-6 rounded-[2.5rem] shadow-xl animate-in slide-in-from-top">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <MailWarning className="animate-pulse" size={24} />
              <h3 className="font-black text-sm">تنبيه تأكيد البريد</h3>
            </div>
            <p className="text-[10px] text-rose-800 font-bold leading-relaxed">
              عذراً، نظام الحماية يرفض الدخول لأن خيار "تأكيد البريد" مفعل في الإعدادات. 
              <br/><br/>
              <span className="text-rose-600 underline">الحل للمدير:</span>
              <br/>
              1. توجه لـ Supabase -> Authentication -> Providers.
              <br/>
              2. قم بتعطيل (Confirm Email).
              <br/>
              3. احذف الحساب القديم من Auth وجرب الدخول مرة أخرى.
            </p>
            <button onClick={() => setError(null)} className="mt-4 w-full py-2 bg-rose-200 text-rose-800 rounded-xl font-black text-[10px]">فهمت ذلك</button>
          </div>
        )}

        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 p-12 text-center text-white relative">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/20 rounded-[2rem] mx-auto flex items-center justify-center mb-6 backdrop-blur-xl border border-white/30 shadow-inner group transition-all duration-700 hover:rotate-[360deg]">
                <GraduationCap size={48} className="text-white" />
              </div>
              <h1 className="text-2xl font-black">ثانوية الأمير عبدالمجيد الأولى</h1>
              <p className="text-blue-200 mt-2 text-[10px] font-bold uppercase tracking-widest opacity-80">بوابة المزامنة الموحدة - الإصدار الرابع</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && error.type !== 'admin_alert' && error.type !== 'network_error' && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 border ${
                error.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                <div className="mt-0.5">
                  {error.type === 'error' ? <AlertCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                </div>
                <p className="text-[11px] font-black leading-tight">{error.msg}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">اسم المستخدم (السجل المدني)</label>
                <div className="relative">
                  <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    placeholder="رقم السجل المدني الخاص بك"
                    className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-right font-black outline-none"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="password"
                    placeholder="السجل المدني (لأول مرة)"
                    className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-right font-black outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="group w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />} 
              {loading ? 'جاري الاتصال بالسحابة...' : 'دخول النظام الموحد'}
            </button>
            
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold justify-center pt-4 border-t border-slate-50">
              <Sparkles size={12} className="text-blue-500" />
              <span>متاح فقط للكادر التعليمي المعتمد لعام 1447هـ</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
