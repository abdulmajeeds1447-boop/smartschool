
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Trash2, UserCog, Shield, Loader2, RefreshCw, BookOpen, Upload, Search, FileSpreadsheet, AlertTriangle, Fingerprint } from 'lucide-react';
import { User } from '../types';
import * as XLSX from 'xlsx';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      
      const formattedUsers = (data || []).map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        teacherNumber: u.teacher_number, // هذا هو السجل المدني
        specialization: u.specialization,
        assignedGrade: u.assigned_grade,
        assignedSection: u.assigned_section
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        if (!dataBuffer) throw new Error("فشل قراءة بيانات الملف.");
        
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) throw new Error("ملف Excel فارغ.");

        const getValue = (row: any, keys: string[]) => {
          const foundKey = Object.keys(row).find(k => 
            keys.some(key => k.trim().toLowerCase() === key.toLowerCase())
          );
          return foundKey ? row[foundKey] : null;
        };

        let successCount = 0;
        for (const row of data) {
          const nationalId = String(getValue(row, ['السجل المدني', 'رقم الهوية', 'national_id', 'id_number', 'رقم السجل']) || '');
          const email = getValue(row, ['البريد', 'email']) || `${nationalId}@school.com`;
          const name = getValue(row, ['الاسم', 'name', 'اسم المعلم']);
          
          if (!nationalId || nationalId === 'null') continue;

          // تحديث أو إدراج المعلم بالسجل المدني
          const { error } = await supabase.from('profiles').upsert({
            full_name: name || 'معلم جديد',
            email: String(email).toLowerCase().trim(),
            teacher_number: nationalId, // تخزين السجل المدني هنا
            specialization: getValue(row, ['التخصص', 'subject', 'المادة']) || '',
            assigned_grade: getValue(row, ['المرحلة', 'grade', 'الصف']) || '',
            assigned_section: getValue(row, ['الفصل', 'section']) || '',
            role: 'TEACHER'
          }, { onConflict: 'teacher_number' }); // النزاع الآن على السجل المدني
          
          if (!error) successCount++;
        }

        alert(`تم استيراد ${successCount} معلم بنجاح وتفعيل دخولهم بالسجل المدني.`);
        fetchUsers();
      } catch (err: any) {
        alert(`خطأ: ${err.message}`);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || u.teacherNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog size={28} className="text-blue-600" />
            إدارة الكادر التعليمي
          </h3>
          <p className="text-slate-500 text-sm mt-1">تسجيل الدخول مفعل عبر السجل المدني</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="بحث بالاسم أو السجل المدني..."
              className="pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64 text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all ${isImporting ? 'bg-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'}`}>
            <FileSpreadsheet size={18} />
            {isImporting ? 'جاري الرفع...' : 'استيراد بالسجل المدني'}
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                <Fingerprint size={12} />
                {user.teacherNumber || 'بدون سجل'}
              </div>
            </div>
            
            <h4 className="font-bold text-slate-800 text-lg mb-1">{user.name}</h4>
            <div className="text-blue-600 text-xs font-bold mb-4">{user.specialization || 'التخصص غير محدد'}</div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">المرحلة</div>
                <div className="text-xs font-bold text-slate-700">{user.assignedGrade || '---'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">الفصل</div>
                <div className="text-xs font-bold text-slate-700">{user.assignedSection || '---'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;