
import React, { useState } from 'react';
import { DAYS, PERIODS, PERIOD_TIMES } from '../constants';

const TeacherSchedule: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<Record<string, Record<number, string>>>({});

  const handleCellChange = (day: string, period: number, value: string) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [period]: value
      }
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">إدارة الجدول الأسبوعي</h3>
        {/* Fix: Explicitly type the accumulator 'sum' to number to avoid 'unknown' type error */}
        <span className="text-sm text-slate-500">مجموع الحصص: {Object.values(scheduleData).reduce((sum: number, day) => sum + Object.keys(day).length, 0)} حصة</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-4 border-l border-b border-slate-200 text-slate-500 text-sm">الحصة / اليوم</th>
              {DAYS.map(day => (
                <th key={day} className="px-4 py-4 border-l border-b border-slate-200 text-slate-800 font-bold">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-6 border-l border-b border-slate-200 bg-slate-50/30">
                  <div className="font-bold text-slate-800">الحصة {period}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{PERIOD_TIMES[period-1].start} - {PERIOD_TIMES[period-1].end}</div>
                </td>
                {DAYS.map(day => (
                  <td key={`${day}-${period}`} className="px-4 py-2 border-l border-b border-slate-200 p-2">
                    <input 
                      type="text" 
                      placeholder="الصف/الفصل"
                      className="w-full bg-transparent border-none text-center text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0"
                      value={scheduleData[day]?.[period] || ''}
                      onChange={(e) => handleCellChange(day, period, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherSchedule;
