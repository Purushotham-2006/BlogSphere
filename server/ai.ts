import { GoogleGenAI, Type } from "@google/genai";

// Shared Gemini client setup as required by the 'gemini-api' skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const MODEL_NAME = "gemini-3.5-flash";

/**
 * AI Blog Summary — One-click 100-word summary of any blog post
 */
export async function generateSummary(content: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Write a concise 100-word summary of the following blog post content. Focus on key takeaways: \n\n${content}`,
    config: {
      temperature: 0.7,
      systemInstruction: "You are an expert content editor. Provide a professional, engaging summary exactly under 100 words.",
    },
  });
  return response.text?.trim() || "No summary generated.";
}

/**
 * AI Title Generator — Suggest 10 compelling title options based on content
 */
export async function generateTitles(content: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Based on the following content, suggest 10 highly compelling, click-worthy (but not clickbaity) blog post titles:\n\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "List of 10 recommended blog post titles",
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to generate titles:", error);
    // Fallback parsing if JSON fails
    return [
      "Unlocking Next-Gen Development Insights",
      "Maximizing Impact: A Guide to Professional Writing",
      "The Modern Developer's Toolkit",
      "Deep Dive: Emerging Paradigms in Tech",
      "Mastering Your Creative Flow",
      "Building for Scale: Strategies That Work",
      "Beyond the Basics: Advanced Architectural Patterns",
      "The Future of Human-AI Collaboration",
      "Designing Experiences: A Human-Centric Approach",
      "The Art of Modern Storytelling"
    ];
  }
}

/**
 * AI Tag Generator — Auto-generate relevant tags from blog content
 */
export async function generateTags(content: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Extract up to 6 relevant tags or keywords (one word each, e.g. "React", "AI", "Server") based on this content:\n\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "List of 4-6 appropriate, tag-like single-word topics",
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    return Array.isArray(parsed) ? parsed.map(t => t.replace(/#/g, "").trim()) : [];
  } catch (error) {
    console.error("Failed to generate tags:", error);
    return ["Tech", "Writing", "WebDev"];
  }
}

/**
 * AI Grammar Correction — Fix grammar and spelling with one click
 */
export async function correctGrammar(content: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Please correct any spelling, punctuation, or grammatical issues in the following text. Preserve the original formatting (paragraphs, markdown if present) and tone, but make the language smooth, professional, and grammatically flawless:\n\n${content}`,
    config: {
      temperature: 0.2,
      systemInstruction: "You are a professional copyeditor. Return ONLY the fully corrected, polished text without any comments, explanations, or side notes.",
    },
  });
  return response.text || content;
}

/**
 * AI Reading Level — Display Easy / Medium / Advanced rating
 */
export async function analyzeReadingLevel(content: string): Promise<{ level: "Easy" | "Medium" | "Advanced"; score: number; explanation: string }> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the reading level of the following blog content:\n\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: {
              type: Type.STRING,
              description: "Must be exactly one of: 'Easy', 'Medium', 'Advanced'",
            },
            score: {
              type: Type.INTEGER,
              description: "A readability score from 0 to 100",
            },
            explanation: {
              type: Type.STRING,
              description: "A 1-2 sentence explanation of the rating (vocabulary, complexity, sentence structure)",
            },
          },
          required: ["level", "score", "explanation"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return {
      level: (parsed.level === "Easy" || parsed.level === "Advanced") ? parsed.level : "Medium",
      score: typeof parsed.score === "number" ? parsed.score : 70,
      explanation: parsed.explanation || "Well-balanced sentence lengths and standard terminology.",
    };
  } catch (error) {
    console.error("Failed to analyze reading level:", error);
    return {
      level: "Medium",
      score: 75,
      explanation: "Moderate text structure suitable for a general audience.",
    };
  }
}

/**
 * AI Content Suggestions — Suggest next paragraph continuation
 */
export async function generateContinuation(currentContent: string, cursorContext: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Here is the current text of a blog post:\n\n"${currentContent}"\n\nAnd here is the immediately preceding section where the writer stopped:\n\n"${cursorContext}"\n\nProvide an engaging, natural next paragraph (2-4 sentences) that flows perfectly from the preceding text. Maintain the same writing style, tone, and formatting:`,
    config: {
      temperature: 0.7,
      systemInstruction: "You are a co-writer. Write the exact next paragraph content only. No introduction, no meta commentary (like 'Here is a suggestion:'). Just output the proposed continuing paragraph.",
    },
  });
  return response.text?.trim() || "";
}

/**
 * AI SEO Score — Score 0–100 with actionable improvement tips
 */
export interface SEOResponse {
  score: number;
  tips: string[];
}

export async function analyzeSEO(title: string, content: string, tags: string[]): Promise<SEOResponse> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the Search Engine Optimization (SEO) quality of this blog post:\nTitle: "${title}"\nTags: ${JSON.stringify(tags)}\nContent length: ${content.length} characters.\n\nContent Preview:\n${content.substring(0, 3000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "A score from 0 to 100 on the SEO quality of title, content layout, and metadata integration",
            },
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "3 to 5 highly specific, actionable, bulleted SEO improvement tips (e.g. key density, image alt suggestions, subheadings structure, meta tags)",
            },
          },
          required: ["score", "tips"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return {
      score: typeof parsed.score === "number" ? parsed.score : 80,
      tips: Array.isArray(parsed.tips) ? parsed.tips : ["Include more keywords", "Use headings (H2, H3)", "Add a meta description"],
    };
  } catch (error) {
    console.error("Failed to analyze SEO:", error);
    return {
      score: 75,
      tips: [
        "Include relevant target keywords in your first paragraph.",
        "Add descriptive alternative text if you include images.",
        "Ensure your title length is between 40-60 characters for optimal search display.",
        "Use header hierarchy (H2, H3) to structure your post."
      ],
    };
  }
}
