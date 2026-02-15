
import { GoogleGenAI, Type } from "@google/genai";

export async function suggestRoutineDescription(taskName: string): Promise<string> {
  // Directly initializing GoogleGenAI with the API key from environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a brief 1-sentence note or description for a daily routine task named: "${taskName}". Keep it motivational and concise.`,
      config: {
        // Removed maxOutputTokens to prevent response blocking as no thinkingBudget was provided
        temperature: 0.7,
      },
    });

    // Accessing the .text property directly as per SDK requirements (not calling .text())
    return response.text?.trim() || "Ready for action!";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return "Make today count!";
  }
}

export async function optimizeSchedule(tasksJson: string): Promise<string> {
   // Directly initializing GoogleGenAI with the API key from environment variables
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
   try {
     const response = await ai.models.generateContent({
       // Upgraded to gemini-3-pro-preview for complex reasoning task (schedule optimization)
       model: "gemini-3-pro-preview",
       contents: `Review the following daily schedule and suggest ONE specific improvement to productivity: ${tasksJson}`,
       config: {
         // Added thinkingBudget to reserve tokens for the final output and prevent empty responses
         maxOutputTokens: 500,
         thinkingConfig: { thinkingBudget: 250 }
       }
     });
     // Accessing the .text property directly as per SDK requirements
     return response.text || "Schedule looks solid!";
   } catch (e) {
     return "Keep up the good work!";
   }
}
