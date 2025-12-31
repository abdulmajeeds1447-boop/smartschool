
import { GoogleGenAI } from "@google/genai";

// دالة مساعدة للتهيئة الآمنة
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "REQUIRED_API_KEY_MISSING") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStudentReport = async (studentName: string, attendanceData: any, performanceData: any) => {
  try {
    const ai = getAiClient();
    
    if (!ai) {
      return "تنبيه: لم يتم ضبط مفتاح Gemini API في إعدادات الخادم. يرجى من المسؤول إضافة API_KEY لتمكين التقارير الذكية.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        اكتب تقريراً قصيراً ومحفزاً لولي أمر الطالب ${studentName} بناءً على البيانات التالية باللغة العربية:
        - نسبة الحضور: ${attendanceData}%
        - متوسط الدرجات: ${performanceData}%
        اجعل التقرير مناسباً للإرسال عبر واتساب وبأسلوب مهذب وداعم.
      `,
    });

    return response.text || "لم يتمكن الذكاء الاصطناعي من توليد نص حالياً.";
  } catch (error: any) {
    console.error("Error generating report:", error);
    if (error.message?.includes('API_KEY')) {
      return "خطأ: مفتاح API الخاص بـ Gemini غير صالح أو مفقود.";
    }
    return "عذراً، تعذر إنشاء التقرير في الوقت الحالي بسبب مشكلة في الاتصال بالذكاء الاصطناعي.";
  }
};
