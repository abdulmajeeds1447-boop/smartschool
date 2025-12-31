
import { GoogleGenAI } from "@google/genai";

export const generateStudentReport = async (studentName: string, attendanceData: any, performanceData: any) => {
  try {
    // الوصول للمفتاح بطريقة آمنة لا يتم استبدالها أثناء البناء (Build)
    const apiKey = (window as any).process?.env?.API_KEY;
    
    if (!apiKey || apiKey === "REQUIRED_API_KEY_MISSING" || apiKey.length < 10) {
      return "تنبيه: لم يتم العثور على مفتاح Gemini API صالح في إعدادات النظام. يرجى إضافة API_KEY في لوحة تحكم Vercel لتمكين هذه الخاصية.";
    }

    // لا نقوم بإنشاء العميل إلا عند استدعاء الدالة فعلياً
    const ai = new GoogleGenAI({ apiKey });

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
    console.error("Gemini Service Error:", error);
    if (error.message?.includes('API Key') || error.message?.includes('API_KEY')) {
      return "خطأ: مفتاح API الخاص بـ Gemini غير صحيح أو لم يتم إعداده في Vercel بشكل سليم.";
    }
    return "عذراً، حدثت مشكلة أثناء محاولة إنشاء التقرير الذكي.";
  }
};
