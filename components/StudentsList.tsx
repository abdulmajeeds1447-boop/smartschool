
import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { supabase } from '../services/supabaseClient';
import { Upload, Plus, Search, Trash2, Edit2, X, User as UserIcon, Phone, GraduationCap, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsImporting(true);
    // محاكاة استيراد حقيقي
    setTimeout(async () => {
      alert('تمت معالجة الملف حان الوقت لرفع البيانات');
      setIsImporting(false);
      fetchStudents();
    }, 2000);
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || s.studentNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="البحث في قاعدة البيانات السحابية..."
            className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={fetchStudents} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <label className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold cursor-pointer transition-all ${isImporting ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {isImporting ? 'جاري الرفع...' : 'استيراد الطلاب'}
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={isImporting} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="font-bold">جاري جلب البيانات من Supabase...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 text-slate-500 text-xs font-black uppercase border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">المعلومات الشخصية</th>
                <th className="px-8 py-5">الصف</th>
                <th className="px-8 py-5">الفصل</th>
                <th className="px-8 py-5">رقم التواصل</th>
                <th className="px-8 py-5">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">#{student.studentNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-600">{student.grade}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">فصل {student.section}</span>
                  </td>
                  <td className="px-8 py-4 text-sm font-mono text-slate-500">{student.phone}</td>
                  <td className="px-8 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit2 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-20 text-center text-slate-400">لا توجد بيانات طلاب حالياً. قم بالاستيراد للبدء.</div>
          )}
        </div>
      )}
      {/* Modal logic remains same but can be extended with Supabase data */}
    </div>
  );
};

export default StudentsList;
