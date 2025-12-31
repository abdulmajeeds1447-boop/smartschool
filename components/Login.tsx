
import React, { useState } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ShieldCheck, GraduationCap, Loader2, UserPlus, Info, Send } from 'lucide-react';

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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResendLink = async () => {
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني أولاً لإعادة إرسال الرابط.');
      return;
    }
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (resendError) throw resendError;
      setSuccess('تم إرسال رابط تفعيل جديد إلى بريدك الإلكتروني بنجاح.');
    } catch (err: any) {
      setError('فشل إرسال الرابط: ' + (err.message || 'حاول مرة أخرى لاحقاً'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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
        
        if (data.user && data.session === null) {
          setSuccess('تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني (Inbox/Spam) لتفعيل الحساب.');
        } else {
          setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
        }
        setIsSignUp(false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('خطأ في البريد الإلكتروني أو كلمة المرور. تأكد من صحة البيانات.');
          } else if (signInError.message.toLowerCase().includes('email not confirmed')) {
            setError('هذا الحساب لم يتم تفعيله بعد. يرجى مراجعة بريدك الإلكتروني.');
            return; // نتوقف هنا لعرض خيار إعادة الإرسال
          }
          throw signInError;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const finalName = profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'مستخدم';
          const finalRole = (profile?.role as Role) || (data.user.user_metadata?.role as Role) || 'TEACHER';

          onLogin({
            id: data.user.id,
            name: finalName,
            email: data.user.email || '',
            role: finalRole
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
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
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-medium flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {error.includes('لم يتم تفعيله') && (
                  <button 
                    type="button"
                    onClick={handleResendLink}
                    disabled={resending}
                    className="flex items-center gap-2 text-xs bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 transition-all self-end disabled:opacity-50"
                  >
                    {resending ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                    إرسال رابط جديد الآن
                  </button>
                )}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl font-medium flex items-start gap-3">
                <CheckCircleIcon size={18} className="shrink-0 mt-0.5" />
                <span>{success}</span>
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
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-right"
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
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-right"
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
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-right"
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
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
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

// مكون أيقونة النجاح المفقود
const CheckCircleIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default Login;
