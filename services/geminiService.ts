
import { GoogleGenAI, Type } from "@google/genai";
import { Project, Task } from "../types";
import { format } from 'date-fns';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSchedule = async (
  projects: Project[],
  userPrompt: string,
  targetDate: Date
): Promise<Partial<Task>[]> => {
  const model = "gemini-3-flash-preview";
  const year = targetDate.getFullYear();
  const monthName = format(targetDate, 'MMMM');

  const systemInstruction = `
    You are an expert family event planner and social media content strategist.
    The user has a set of projects for ${monthName} ${year}.
    Based on their request, generate a list of calendar tasks.
    Each task must belong to one of the provided projects.
    Tasks should have specific dates in ${monthName} ${year}.
    Time windows should be realistic (e.g., house cleaning 1-2 hours, deep work 3 hours).
    Include a checklist of sub-tasks for each task.
    
    CRITICAL: For each task, you MUST provide exactly 3 social media content ideas:
    1. A 'video' idea (e.g., Reel, TikTok trend related to the task)
    2. A 'story' idea (e.g., Behind the scenes, poll, morning routine)
    3. A 'image' idea (e.g., Aesthetic photo, finished result, flat lay)
    
    Available Projects: ${JSON.stringify(projects.map(p => ({ id: p.id, name: p.name })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Planning for ${monthName} ${year}. User Request: ${userPrompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              projectId: { type: Type.STRING, description: "The ID of the project this task belongs to" },
              title: { type: Type.STRING, description: "Short title of the task" },
              date: { type: Type.STRING, description: `Date in YYYY-MM-DD format (must be in ${monthName} ${year})` },
              startTime: { type: Type.STRING, description: "Start time in HH:mm 24h format" },
              endTime: { type: Type.STRING, description: "End time in HH:mm 24h format" },
              description: { type: Type.STRING, description: "Brief description of the task" },
              checklistItems: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of strings for checklist items"
              },
              contentIdeas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["video", "story", "image"] },
                    text: { type: Type.STRING, description: "Description of the content idea" }
                  },
                  required: ["type", "text"]
                },
                description: "List of 3 social media ideas (video, story, image)"
              }
            },
            required: ["projectId", "title", "date", "startTime", "endTime", "checklistItems", "contentIdeas"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    return rawData.map((item: any) => ({
      projectId: item.projectId,
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      description: item.description,
      checklist: item.checklistItems?.map((text: string) => ({
        id: crypto.randomUUID(),
        text,
        completed: false
      })) || [],
      contentIdeas: item.contentIdeas?.map((idea: any) => ({
        id: crypto.randomUUID(),
        type: idea.type,
        text: idea.text
      })) || [],
      completed: false
    }));

  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};
