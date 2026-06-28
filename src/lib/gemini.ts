// Gemini AI Client
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ComplaintAnalysis {
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  estimatedRepairTime: string;
  estimatedCost: string;
  urgencyScore: number;
  isSpam: boolean;
  isDuplicate: boolean;
  tags: string[];
  impactSummary: string;
  citizenUpdate: string;
}

export async function analyzeComplaint(
  userDescription: string,
  imageBase64?: string
): Promise<ComplaintAnalysis> {
  const prompt = `You are an AI assistant for a civic issue reporting platform called CIVIX AI.
Analyze the following citizen complaint and provide a structured JSON response.

Citizen's Description: "${userDescription}"

Provide a JSON response with these exact fields:
{
  "category": "one of: Road & Infrastructure, Water & Sanitation, Electricity, Public Safety, Garbage & Waste, Parks & Recreation, Noise Pollution, Air Quality, Public Transport, Buildings & Construction, Other",
  "title": "concise professional title (max 10 words)",
  "description": "detailed professional description (2-3 sentences)",
  "severity": "one of: low, medium, high, critical",
  "department": "responsible government department name",
  "estimatedRepairTime": "realistic time estimate like '3-5 days' or '2-3 weeks'",
  "estimatedCost": "rough cost estimate in INR like '₹5,000 - ₹15,000'",
  "urgencyScore": number between 1-100,
  "isSpam": boolean,
  "isDuplicate": false,
  "tags": ["array", "of", "relevant", "tags"],
  "impactSummary": "brief impact on community (1 sentence)",
  "citizenUpdate": "friendly message to citizen about next steps"
}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    let response;
    if (imageBase64) {
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      };
      const result = await geminiModel.generateContent([prompt, imagePart]);
      response = result.response.text();
    } else {
      const result = await geminiModel.generateContent(prompt);
      response = result.response.text();
    }

    // Clean JSON response
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini analysis error:', error);
    // Return sensible defaults if AI fails
    return {
      category: 'Other',
      title: 'Civic Issue Report',
      description: userDescription,
      severity: 'medium',
      department: 'Municipal Corporation',
      estimatedRepairTime: '7-14 days',
      estimatedCost: '₹10,000 - ₹50,000',
      urgencyScore: 50,
      isSpam: false,
      isDuplicate: false,
      tags: ['civic', 'issue'],
      impactSummary: 'Issue affecting local community.',
      citizenUpdate: 'Your complaint has been received and will be reviewed shortly.',
    };
  }
}

export async function generateCitizenUpdate(complaint: {
  title: string;
  status: string;
  category: string;
}): Promise<string> {
  const prompt = `Generate a friendly, professional update message for a citizen whose complaint titled "${complaint.title}" (category: ${complaint.category}) has moved to status: "${complaint.status}". Keep it under 50 words, empathetic and informative.`;
  
  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch {
    return `Your complaint "${complaint.title}" status has been updated to ${complaint.status}.`;
  }
}

export async function detectSpam(description: string): Promise<boolean> {
  const prompt = `Is the following civic complaint description spam or fake? Reply with only "true" or "false".
Description: "${description}"`;
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().toLowerCase().trim();
    return text === 'true';
  } catch {
    return false;
  }
}
