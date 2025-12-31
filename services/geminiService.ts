
import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudentReport = async (studentName: string, attendanceData: any, performanceData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        اكتب تقريراً قصيراً ومحفزاً لولي أمر الطالب ${studentName} بناءً على البيانات التالية باللغة العربية:
        - نسبة الحضور: ${attendanceData}%
        - متوسط الدرجات: ${performanceData}%
        اجعل التقرير مناسباً للإرسال عبر واتساب وبأسلوب مهذب.
      `,
    });
    // Correctly access .text property
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "عذراً، تعذر إنشاء التقرير في الوقت الحالي. يرجى التواصل مع الإدارة.";
  }
};
