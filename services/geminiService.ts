
import { GoogleGenAI, Type, Modality } from "@google/genai";

export class ArchitectService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async synthesizeSpeech(text: string, language: 'RU' | 'EN') {
    try {
      const prompt = language === 'RU' 
        ? `Произнеси это техническим, уверенным голосом ведущего инженера: ${text}`
        : `Say this in a technical, confident lead engineer voice: ${text}`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return base64Audio;
      }
      return null;
    } catch (e) {
      console.error("TTS Error:", e);
      return null;
    }
  }

  async synthesizeSFX(description: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate technical sound design parameters for: ${description}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sampleRate: { type: Type.INTEGER },
              bitDepth: { type: Type.INTEGER },
              duration: { type: Type.NUMBER },
              layers: { type: Type.ARRAY, items: { type: Type.STRING } },
              filters: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["sampleRate", "bitDepth", "duration", "layers"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return null;
    }
  }

  async scaffoldProject(prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a full project structure for: ${prompt}. Return a JSON tree of files and folders. Each file should have a "name", "type" (file/folder), and "content" (boilerplate code).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                path: { type: Type.STRING },
                content: { type: Type.STRING },
                children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, path: { type: Type.STRING }, content: { type: Type.STRING } } } }
              },
              required: ["name", "type", "path"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Scaffold Error:", e);
      return null;
    }
  }

  async analyzeConcept(imageData: { data: string, mimeType: string }, prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: {
          parts: [
            { inlineData: imageData },
            { text: `Analyze this game concept art. Task: ${prompt}` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              polycount: { type: Type.STRING, description: "Estimated polygon count" },
              material_type: { type: Type.STRING, description: "PBR Material workflow" },
              bones: { type: Type.INTEGER, description: "Skeleton bone count" },
              lods: { type: Type.INTEGER, description: "LOD levels count" },
              technical_summary: { type: Type.STRING, description: "Brief dev summary" }
            },
            required: ["polycount", "material_type", "bones", "lods", "technical_summary"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Analysis Error:", e);
      return null;
    }
  }

  async conductCompatibilityAudit(files: {name: string, path: string, content?: string}[], profile: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Conduct a platform compatibility audit for profile: ${profile}. Files: ${JSON.stringify(files)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING },
                message: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                file: { type: Type.STRING }
              },
              required: ["severity", "message", "suggestion", "file"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  }

  async synthesizeAnimation(prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Synthesize animation technical metadata for: ${prompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              frames: { type: Type.INTEGER },
              boneWeight: { type: Type.STRING },
              complexity_score: { type: Type.NUMBER }
            },
            required: ["name", "category", "frames", "boneWeight", "complexity_score"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return null;
    }
  }

  async generateNetNode(description: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a network node definition for: ${description}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, description: "EVENT or HANDLER" },
              direction: { type: Type.STRING, description: "C2S, S2C, or INTERNAL" },
              params: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING }
                  },
                  required: ["name", "type"]
                }
              }
            },
            required: ["name", "type", "direction", "params"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Node Gen Error:", e);
      return null;
    }
  }

  async generateResponse(prompt: string, context: string, language: 'RU' | 'EN') {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: `Context: ${context}\nUser: ${prompt}`,
        config: {
          systemInstruction: `You are the "Architect" of Terraformer Studio. Provide specific technical advice for game development. Language: ${language}.`,
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text || "";
    } catch (error) {
      return "Architect Node Error.";
    }
  }

  async generateCode(task: string, fileContext: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Task: ${task}\nContext: ${fileContext}`,
        config: {
          systemInstruction: "Return ONLY raw high-performance game engine code. No markdown, no explanations.",
          temperature: 0.1
        }
      });
      return response.text?.replace(/```[a-z]*\n?|```/g, '').trim() || "// Error generating code.";
    } catch (error) {
      return `// Error: ${error}`;
    }
  }

  async scanForIssues(files: string[], language: 'RU' | 'EN') {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scan these project files for architectural issues: ${files.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, description: "error, warning, or info" },
                message: { type: Type.STRING },
                file: { type: Type.STRING },
                suggestion: { type: Type.STRING }
              },
              required: ["severity", "message", "file", "suggestion"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  }
}
