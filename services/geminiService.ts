
import { GoogleGenAI } from "@google/genai";

export const generateStudentReport = async (studentName: string, grade: string, section: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        أنت مستشار طلابي محترف في ثانوية الأمير عبدالمجيد. 
        اكتب رسالة واتساب لولي أمر الطالب (اسم الطالب: ${studentName}) في (الصف: ${grade} - فصل: ${section}).
        الرسالة يجب أن تبدأ بتحية إسلامية، وتكون بلهجة سعودية بيضاء، مهذبة، وتحث على التعاون بين البيت والمدرسة لمصلحة الطالب.
        تجنب التفاصيل التقنية المعقدة واجعلها رسالة تشعر ولي الأمر بالاهتمام والتقدير.
        لا تضف أي رموز برمجية، فقط نص الرسالة جاهز للإرسال.
      `,
    });

    return response.text || "السلام عليكم، نود إحاطتكم بتميز ابننا في المدرسة وضرورة استمرار المتابعة.";
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return "السلام عليكم، نود إحاطتكم بضرورة متابعة أداء ابننا الدراسي لضمان تفوقه الدائم. شكراً لتعاونكم.";
  }
};
