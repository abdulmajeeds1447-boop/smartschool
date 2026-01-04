
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  UserCog, Shield, Loader2, RefreshCw, BookOpen, 
  Search, Edit3, Bookmark, School, Save, Activity, AlertTriangle, X, Fingerprint, Trash2, ShieldAlert
} from 'lucide-react';
import { User, Role } from '../types';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');
      const { data: scheduleData } = await supabase.from('schedule').select('*');
      
      const uniqueUsersMap = new Map();
      profiles?.forEach(profile => {
        const key = profile.teacher_number || profile.id;
        if (!uniqueUsersMap.has(key) || profile.id.length > 20) {
          uniqueUsersMap.set(key, profile);
        }
      });
      
      setUsers(Array.from(uniqueUsersMap.values()));
      setSchedules(scheduleData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherStats = (teacherId: string) => {
    const teacherClasses = schedules.filter(s => s.teacher_id === teacherId);
    const uniqueSections = Array.from(new Set(teacherClasses.map(s => `ف ${s.section}`)));
    const uniqueSubjects = Array.from(new Set(teacherClasses.map(s => s.subject)));
    return {
      count: teacherClasses.length,
      sections: uniqueSections.join('، '),
      subjects: uniqueSubjects.join('، ')
    };
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await supabase.from('profiles').delete().eq('id', id);
      fetchData();
    } catch (err) {
      alert('خطأ في الحذف');
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    
    const cleanTeacherNumber = selectedTeacher.teacher_number?.trim();
    if (!cleanTeacherNumber) {
      alert("يرجى إدخال رقم السجل المدني أولاً");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          teacher_number: cleanTeacherNumber, // تنظيف المسافات هنا
          specialization: selectedTeacher.specialization,
          assigned_grade: selectedTeacher.assigned_grade,
          assigned_section: selectedTeacher.assigned_section,
          phone: selectedTeacher.phone,
          full_name: selectedTeacher.full_name
        })
        .eq('id', selectedTeacher.id);
      
      if (error) throw error;
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      alert("خطأ في التحديث: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.includes(searchTerm) || u.teacher_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-['Tajawal'] text-right">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <UserCog size={24} />
            </div>
            إدارة الكادر والنصاب
          </h3>
          <p className="text-slate-500 text-sm mt-1 font-medium">متابعة دقيقة لنصاب الحصص وتنشيط الحسابات</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="بحث بالاسم أو السجل..."
              className="pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] text-sm focus:ring-4 focus:ring-blue-500/10 outline-none w-80 text-right font-bold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchData} className="p-3.5 bg-slate-100 text-slate-400 rounded-[1.2rem] hover:bg-blue-50 hover:text-blue-600 transition-all">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-400 font-black animate-pulse">جاري فحص حالة الحسابات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((u) => {
            const stats = getTeacherStats(u.id);
            const isNotActive = !u.teacher_number;

            return (
              <div key={u.id} className={`bg-white rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all p-7 flex flex-col relative group border-t-4 ${isNotActive ? 'border-t-rose-500 bg-rose-50/20' : 'border-t-transparent hover:border-t-blue-500'}`}>
                <div className="absolute top-6 left-6 flex items-center gap-2">
                   {isNotActive ? (
                     <div className="flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1.5 rounded-xl animate-pulse shadow-lg shadow-rose-500/20">
                       <ShieldAlert size={12} />
                       <span className="text-[10px] font-black">يحتاج تنشيط</span>
                     </div>
                   ) : (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <Activity size={12} />
                      <span className="text-[10px] font-black">{stats.count} حصة</span>
                    </div>
                   )}
                </div>

                <div className="flex justify-between items-start mb-6 mt-4">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner ${isNotActive ? 'bg-rose-100 text-rose-400' : 'bg-slate-100 text-slate-600'}`}>
                    {u.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedTeacher({...u}); setShowEditModal(true); }} className={`p-2.5 rounded-xl transition-all ${isNotActive ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-black text-slate-800 text-xl mb-1 flex items-center gap-2">
                    {u.full_name || 'معلم غير مسمى'}
                    {/* Fixed: Removed 'title' attribute which is not supported by Lucide icon component props */}
                    {u.id.length > 20 && <Shield size={14} className="text-emerald-500" />}
                  </h4>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-white/50 p-2 rounded-lg border border-slate-50">
                      <Bookmark size={14} className="text-blue-500" />
                      المواد: {stats.subjects || u.specialization || 'غير محدد'}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                      <Fingerprint size={12} className={isNotActive ? "text-rose-400" : ""} /> 
                      {u.teacher_number || 'السجل مفقود'}
                   </div>
                   {isNotActive && (
                     <p className="text-[9px] text-rose-500 font-bold">أضف السجل لتمكينه من الدخول</p>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleUpdateAssignment} className="bg-white w-full max-w-xl rounded-[3rem] p-10 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  {!selectedTeacher.teacher_number ? 'تنشيط حساب المعلم' : 'تعديل بيانات الكادر'}
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1">يجب إدخال رقم السجل المدني ليتمكن المعلم من الدخول</p>
              </div>
              <button type="button" onClick={() => setShowEditModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest flex items-center gap-2">
                  رقم السجل المدني (تنشيط)
                </label>
                <div className="relative">
                  <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    className="w-full pr-12 pl-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                    placeholder="أدخل 10 أرقام السجل المدني هنا"
                    value={selectedTeacher.teacher_number || ''} 
                    onChange={e => setSelectedTeacher({...selectedTeacher, teacher_number: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">الاسم الكامل</label>
                <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none" value={selectedTeacher.full_name || ''} onChange={e => setSelectedTeacher({...selectedTeacher, full_name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">التخصص</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none" value={selectedTeacher.specialization || ''} onChange={e => setSelectedTeacher({...selectedTeacher, specialization: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">الجوال</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-left" value={selectedTeacher.phone || ''} onChange={e => setSelectedTeacher({...selectedTeacher, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={updating} 
                className="w-full py-5 rounded-[1.5rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
              >
                {updating ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} 
                حفظ البيانات وتفعيل الدخول
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
