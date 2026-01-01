
import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
  Upload, Search, Trash2, Edit2, Loader2, RefreshCw, 
  FileSpreadsheet, AlertCircle, CheckCircle2, 
  ArrowLeftRight, Table as TableIcon, X, Plus, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MappingState {
  name: string;
  student_number: string;
  grade: string;
  section: string;
  phone: string;
}

const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  // Modals States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual Add State
  const [newStudent, setNewStudent] = useState({
    name: '',
    student_number: '',
    grade: 'الأول الثانوي',
    section: 'أ',
    phone: ''
  });

  // Smart Import States
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<MappingState>({
    name: '',
    student_number: '',
    grade: '',
    section: '',
    phone: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // ترتيب الطلاب حسب الصف ثم الاسم
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm("⚠️ تحذير: هل أنت متأكد من حذف كافة بيانات الطلاب نهائياً؟ لا يمكن التراجع عن هذه الخطوة.");
    if (!confirmed) return;

    setIsDeletingAll(true);
    try {
      // حذف كافة السجلات (عن طريق استهداف كافة المعرفات)
      const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setStudents([]);
      alert("تم مسح قاعدة بيانات الطلاب بالكامل.");
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.student_number) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('students').insert([newStudent]);
      if (error) throw error;
      setShowAddModal(false);
      setNewStudent({ name: '', student_number: '', grade: 'الأول الثانوي', section: 'أ', phone: '' });
      fetchStudents();
    } catch (err: any) {
      alert("خطأ أثناء الإضافة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!window.confirm("حذف هذا الطالب؟")) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'array' });
      setRawWorkbook(workbook);
      setExcelSheets(workbook.SheetNames);
      setSelectedSheet(workbook.SheetNames[0]);
      processSheet(workbook, workbook.SheetNames[0]);
      setShowImportModal(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const processSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (jsonData.length > 0) {
      const sheetHeaders = jsonData[0].map(h => String(h).trim());
      setHeaders(sheetHeaders);
      const newMapping = { ...mapping };
      sheetHeaders.forEach(h => {
        if (['الاسم', 'اسم الطالب', 'name'].includes(h.toLowerCase())) newMapping.name = h;
        if (['رقم الطالب', 'الرقم الأكاديمي', 'student_number', 'id'].includes(h.toLowerCase())) newMapping.student_number = h;
        if (['الصف', 'المرحلة', 'grade'].includes(h.toLowerCase())) newMapping.grade = h;
        if (['الفصل', 'section'].includes(h.toLowerCase())) newMapping.section = h;
        if (['الجوال', 'هاتف', 'phone'].includes(h.toLowerCase())) newMapping.phone = h;
      });
      setMapping(newMapping);
      const fullData = XLSX.utils.sheet_to_json(worksheet) as any[];
      setPreviewData(fullData.slice(0, 5));
    }
  };

  const executeImport = async () => {
    if (!mapping.name || !mapping.student_number) return;
    setIsImporting(true);
    try {
      const worksheet = rawWorkbook!.Sheets[selectedSheet];
      const fullData = XLSX.utils.sheet_to_json(worksheet) as any[];
      const studentsToInsert = fullData.map(row => ({
        name: row[mapping.name] || 'طالب جديد',
        grade: row[mapping.grade] || '',
        section: row[mapping.section] || '',
        phone: String(row[mapping.phone] || ''),
        student_number: String(row[mapping.student_number] || '')
      })).filter(s => s.student_number);

      const { error } = await supabase.from('students').insert(studentsToInsert);
      if (error) throw error;
      setShowImportModal(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || 
    (s as any).student_number?.includes(searchTerm) ||
    s.studentNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-['Tajawal']">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="ابحث باسم الطالب أو الرقم الأكاديمي..."
            className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-right shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDeleteAll}
            disabled={isDeletingAll || students.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all disabled:opacity-30"
          >
            <Trash2 size={18} />
            حذف الكل
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all"
          >
            <Plus size={18} />
            إضافة يدوي
          </button>

          <label className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold cursor-pointer hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <Upload size={18} />
            استيراد ذكي (Excel)
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
          </label>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="font-bold">جاري تحديث القائمة...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase">الطالب</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase">الصف</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase">الفصل</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase">رقم التواصل</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{student.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">ID: {student.studentNumber || (student as any).student_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-700">{student.section}</td>
                    <td className="px-8 py-5 text-sm font-mono text-slate-500">{student.phone || '---'}</td>
                    <td className="px-8 py-5 text-left">
                      <button 
                        onClick={() => handleDeleteOne(student.id)}
                        className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">لا يوجد طلاب مسجلين حالياً</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD MANUAL STUDENT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <form onSubmit={handleManualAdd} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">إضافة طالب جديد</h3>
                  <p className="text-slate-500 text-xs mt-1">أدخل بيانات الطالب يدوياً في النظام</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 pr-2">اسم الطالب بالكامل</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-right font-bold"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 pr-2">الرقم الأكاديمي / السجل المدني</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-right font-bold"
                  value={newStudent.student_number}
                  onChange={e => setNewStudent({...newStudent, student_number: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">الصف الدراسي</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-right font-bold appearance-none"
                    value={newStudent.grade}
                    onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  >
                    <option>الأول الثانوي</option>
                    <option>الثاني الثانوي</option>
                    <option>الثالث الثانوي</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">الفصل</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-right font-bold"
                    value={newStudent.section}
                    onChange={e => setNewStudent({...newStudent, section: e.target.value})}
                    placeholder="مثال: أ"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 pr-2">رقم جوال ولي الأمر</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-right font-bold"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors">إلغاء</button>
              <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all">إضافة الطالب</button>
            </div>
          </form>
        </div>
      )}

      {/* --- SMART IMPORT MODAL --- */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">مساعد الاستيراد الذكي</h3>
                  <p className="text-slate-500 text-xs mt-1">قم بربط أعمدة ملف الـ Excel بحقول النظام</p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Side: Mapping Configuration */}
              <div className="space-y-8">
                <section>
                  <label className="block text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                    <TableIcon size={16} className="text-blue-500" />
                    1. اختر ورقة العمل (Sheet)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {excelSheets.map(sheet => (
                      <button
                        key={sheet}
                        onClick={() => { setSelectedSheet(sheet); if (rawWorkbook) processSheet(rawWorkbook, sheet); }}
                        className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-center border ${
                          selectedSheet === sheet 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {sheet}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="block text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                    <ArrowLeftRight size={16} className="text-blue-500" />
                    2. ربط الحقول (Mapping)
                  </label>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    {[
                      { key: 'name', label: 'اسم الطالب', required: true },
                      { key: 'student_number', label: 'الرقم الأكاديمي', required: true },
                      { key: 'grade', label: 'المرحلة الدراسية', required: false },
                      { key: 'section', label: 'الفصل', required: false },
                      { key: 'phone', label: 'رقم ولي الأمر', required: false },
                    ].map((field) => (
                      <div key={field.key} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-slate-600 w-28 shrink-0">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          value={mapping[field.key as keyof MappingState]}
                          onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        >
                          <option value="">-- اختر العمود --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Side: Preview */}
              <div className="space-y-6">
                <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  3. معاينة شكل البيانات (Preview)
                </label>
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-inner">
                  <table className="w-full text-[10px] text-right">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-3">الاسم</th>
                        <th className="p-3">الرقم</th>
                        <th className="p-3">الصف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="p-3 font-bold text-blue-600">{row[mapping.name] || '---'}</td>
                          <td className="p-3 text-slate-500">{row[mapping.student_number] || '---'}</td>
                          <td className="p-3 text-slate-400">{row[mapping.grade] || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                    سيتم ترتيب الطلاب تلقائياً حسب الصف الدراسي فور اعتماد الاستيراد. تأكد من صحة الربط لتجنب تكرار السجلات.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold">إلغاء</button>
              <button 
                onClick={executeImport}
                disabled={isImporting || !mapping.name || !mapping.student_number}
                className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
              >
                {isImporting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                تأكيد الاستيراد والفرز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
