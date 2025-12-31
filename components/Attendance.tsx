
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { DAYS, PERIODS, PERIOD_TIMES } from '../constants';
import { CheckCircle, XCircle, Clock, Save, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { Student } from '../types';

const Attendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState('الأول الثانوي');
  const [selectedSection, setSelectedSection] = useState('أ');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});

  useEffect(() => {
    const now = new Date();
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    setSelectedDay(arabicDays[now.getDay()] || 'الأحد');
    fetchStudents();
  }, [selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('grade', selectedGrade)
      .eq('section', selectedSection);
    
    if (error) console.error(error);
    else {
      setStudents(data || []);
      const initial = (data || []).reduce((acc: any, s: Student) => ({ ...acc, [s.id]: 'PRESENT' }), {});
      setAttendance(initial);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      status,
      period: selectedPeriod,
      date: new Date().toISOString().split('T')[0]
    }));

    const { error } = await supabase.from('attendance').insert(records);
    
    if (error) alert('خطأ في الحفظ: ' + error.message);
    else alert('تم حفظ الحضور في قاعدة البيانات السحابية');
    setSaving(false);
  };

  const toggleStatus = (studentId: string) => {
    setAttendance(prev => {
      const current = prev[studentId];
      let next: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT';
      if (current === 'PRESENT') next = 'ABSENT';
      else if (current === 'ABSENT') next = 'LATE';
      return { ...prev, [studentId]: next };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100">
          <AlertCircle size={18} />
          <span className="text-sm font-bold">التاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
        </div>
        
        <div className="flex gap-4">
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option>الأول الثانوي</option>
            <option>الثاني الثانوي</option>
            <option>الثالث الثانوي</option>
          </select>
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option>أ</option>
            <option>ب</option>
            <option>ج</option>
          </select>
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedPeriod === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              الحصة {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {students.map((student) => {
            const status = attendance[student.id];
            return (
              <div 
                key={student.id}
                onClick={() => toggleStatus(student.id)}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer group active:scale-95 ${
                  status === 'PRESENT' ? 'bg-white border-emerald-100' : 
                  status === 'ABSENT' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    status === 'PRESENT' ? 'bg-emerald-100 text-emerald-600' : 
                    status === 'ABSENT' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {status === 'PRESENT' ? <CheckCircle size={24} /> : status === 'ABSENT' ? <XCircle size={24} /> : <Clock size={24} />}
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{student.name}</h4>
                <p className="text-xs text-slate-400">#{student.studentNumber}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-8 left-8 flex gap-3">
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/40 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          اعتماد الحضور السحابي
        </button>
      </div>
    </div>
  );
};

export default Attendance;
