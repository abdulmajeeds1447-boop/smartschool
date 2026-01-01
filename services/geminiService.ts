
import { GoogleGenAI } from "@google/genai";

// AI helper for generating student reports using the Gemini 3 Flash model
export const generateStudentReport = async (studentName: string, attendanceData: any, performanceData: any) => {
  try {
    // Correctly initialize Gemini API using process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Use gemini-3-flash-preview for basic text generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        اكتب تقريراً قصيراً ومحفزاً لولي أمر الطالب ${studentName} بناءً على البيانات التالية باللغة العربية:
        - نسبة الحضور: ${attendanceData}%
        - متوسط الدرجات: ${performanceData}%
        اجعل التقرير مناسباً للإرسال عبر واتساب وبأسلوب مهذب وداعم.
      `,
    });

    // Access response.text directly (property, not a method)
    return response.text || "لم يتمكن الذكاء الاصطناعي من توليد نص حالياً.";
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // Return a generic user-friendly message without exposing technical details about API keys
    return "عذراً، حدثت مشكلة أثناء محاولة إنشاء التقرير الذكي.";
  }
};