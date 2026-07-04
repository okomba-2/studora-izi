/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 PDFs up to 120mb to accommodate up to 100mb PDF files without any page or size limitations
  app.use(express.json({ limit: "120mb" }));
  app.use(express.urlencoded({ limit: "120mb", extended: true }));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Secure API endpoint for Gemini and DeepSeek PDF analysis
  app.post("/api/analyze-pdf", async (req, res) => {
    try {
      const { pdfBase64, fileName, provider } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: "Le contenu du fichier PDF (Base64) est manquant." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "La clé d'API Gemini (GEMINI_API_KEY) n'est pas configurée dans l'espace de travail. Veuillez l'ajouter dans Settings > Secrets."
        });
      }

      // Initialize Gemini SDK with telemetry header
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Handle DeepSeek Provider if selected and key is present
      if (provider === 'deepseek') {
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekApiKey) {
          return res.status(400).json({
            error: "La clé d'API DeepSeek (DEEPSEEK_API_KEY) n'est pas configurée sur le serveur. Veuillez l'ajouter dans vos variables d'environnement."
          });
        }

        console.log("Using Gemini to extract structured text content from PDF...");
        const extractionResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
            "Extrais et liste de manière extrêmement exhaustive et structurée toutes les informations, théories, chapitres, questions, définitions ou formules de ce document pour révision universitaire."
          ]
        });

        const extractedText = extractionResponse.text || "";
        if (!extractedText) {
          throw new Error("Échec de l'extraction textuelle du PDF par Gemini.");
        }

        console.log("Calling DeepSeek API (deepseek-chat) for Quiz/Flashcards generation...");
        const deepseekPrompt = `Analyse ce document d'études ou de révision nommé "${fileName || 'cours.pdf'}".
Génère un quiz de révision de haute qualité avec 3 à 5 questions à choix multiples (QCM) très précises sur le contenu du document.
Génère également 3 à 5 flashcards pour mémoriser les définitions importantes ou les formules clés.
Toutes les questions, options de réponse, explications et flashcards doivent être rédigées en français académique et irréprochable.

Contenu extrait du document :
---
${extractedText.substring(0, 15000)}
---

Tu dois répondre obligatoirement sous forme d'un objet JSON valide respectant strictement ce schéma :
{
  "quizTitle": "Un titre court et académique pour le quiz, par exemple 'Quiz : Histologie L1' ou 'Structures Algébriques'.",
  "questions": [
    {
      "question": "La question de révision.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct": 0, // l'index correct (0, 1, 2, ou 3)
      "explanation": "Une courte explication didactique de la réponse correcte."
    }
  ],
  "flashcards": [
    {
      "front": "Recto : terme, concept ou question.",
      "back": "Verso : définition, formule ou réponse."
    }
  ]
}`;

        const dsResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "Tu es un enseignant universitaire expert. Tu réponds uniquement en format JSON brut correspondant strictement au schéma demandé."
              },
              {
                role: "user",
                content: deepseekPrompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          })
        });

        if (!dsResponse.ok) {
          const errText = await dsResponse.text();
          throw new Error(`Erreur API DeepSeek: ${dsResponse.status} - ${errText}`);
        }

        const dsData: any = await dsResponse.json();
        const jsonText = dsData.choices[0].message.content.trim();
        const parsedData = JSON.parse(jsonText);
        return res.json(parsedData);
      }

      // Default Gemini flow
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      };

      const textPart = {
        text: `Analyse ce document PDF d'études universitaires ou de révision nommé "${fileName || 'cours'}".
Génère un quiz de révision de haute qualité avec 3 à 5 questions à choix multiples (QCM) très précises sur le contenu du document.
Génère également 3 à 5 flashcards pour mémoriser les définitions importantes ou les formules clés.
Toutes les questions, options de réponse, explications et flashcards doivent être en français académique et irréprochable.`,
      };

      // Call Gemini with high speed, native PDF understanding and robust schema extraction
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts: [pdfPart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                quizTitle: {
                  type: Type.STRING,
                  description: "Un titre court et académique pour le quiz, par exemple 'Quiz : Histologie L1' ou 'Structures Algébriques'."
                },
                questions: {
                  type: Type.ARRAY,
                  description: "Une liste de 3 à 5 questions à choix multiples basées sur le document.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING, description: "La question de révision." },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "3 à 4 options de réponse exclusives."
                      },
                      correct: { type: Type.INTEGER, description: "L'index correct (0, 1, 2, ou 3)." },
                      explanation: { type: Type.STRING, description: "Une courte explication de la réponse correcte." }
                    },
                    required: ["question", "options", "correct", "explanation"]
                  }
                },
                flashcards: {
                  type: Type.ARRAY,
                  description: "Une liste de 3 à 5 flashcards basées sur le document.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      front: { type: Type.STRING, description: "Recto : terme, concept ou question." },
                      back: { type: Type.STRING, description: "Verso : définition, formule ou réponse." }
                    },
                    required: ["front", "back"]
                  }
                }
              },
              required: ["quizTitle", "questions", "flashcards"]
            }
          }
        });
      } catch (primaryModelError: any) {
        console.warn("Primary model 'gemini-3.5-flash' failed or timed out, trying fallback model 'gemini-flash-latest'...", primaryModelError);
        response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: { parts: [pdfPart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                quizTitle: {
                  type: Type.STRING,
                  description: "Un titre court et académique pour le quiz, par exemple 'Quiz : Histologie L1' ou 'Structures Algébriques'."
                },
                questions: {
                  type: Type.ARRAY,
                  description: "Une liste de 3 à 5 questions à choix multiples basées sur le document.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING, description: "La question de révision." },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "3 à 4 options de réponse exclusives."
                      },
                      correct: { type: Type.INTEGER, description: "L'index correct (0, 1, 2, ou 3)." },
                      explanation: { type: Type.STRING, description: "Une courte explication de la réponse correcte." }
                    },
                    required: ["question", "options", "correct", "explanation"]
                  }
                },
                flashcards: {
                  type: Type.ARRAY,
                  description: "Une liste de 3 à 5 flashcards basées sur le document.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      front: { type: Type.STRING, description: "Recto : terme, concept ou question." },
                      back: { type: Type.STRING, description: "Verso : définition, formule ou réponse." }
                    },
                    required: ["front", "back"]
                  }
                }
              },
              required: ["quizTitle", "questions", "flashcards"]
            }
          }
        });
      }

      const text = response.text;
      if (!text) {
        throw new Error("Le modèle Gemini n'a pas renvoyé de contenu textuel.");
      }

      // Robust JSON extraction
      let jsonText = text.trim();
      if (jsonText.startsWith("```")) {
        const firstBrace = jsonText.indexOf("{");
        const lastBrace = jsonText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        } else {
          jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
        }
      }

      // Sanitize trailing commas in array/object properties that can break JSON.parse
      jsonText = jsonText
        .replace(/,\s*\]/g, "]")
        .replace(/,\s*\}/g, "}");

      const parsedData = JSON.parse(jsonText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini/DeepSeek analysis error:", error);
      res.status(500).json({ error: error.message || "Erreur interne lors de l'analyse du PDF." });
    }
  });

  // Helper to extract GitHub token from headers
  const getGitHubToken = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    return (req.headers["x-github-token"] as string) || "";
  };

  // Generate GitHub OAuth url
  app.get("/api/github/oauth-url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({ error: "Client ID GitHub non configuré." });
    }
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${appUrl}/auth/callback`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
    res.json({ url: authUrl });
  });

  // Handle GitHub OAuth callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send("Code d'autorisation GitHub manquant.");
      }

      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).send("Configuration OAuth GitHub incomplète (Client ID ou Client Secret manquant dans le .env).");
      }

      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${appUrl}/auth/callback`;

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData: any = await tokenResponse.json();
      if (tokenData.error) {
        return res.status(400).send(`Erreur lors de l'échange de jeton : ${tokenData.error_description || tokenData.error}`);
      }

      const accessToken = tokenData.access_token;

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connexion réussie</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #0b0f19;
                color: #f8fafc;
                text-align: center;
              }
              .spinner {
                border: 4px solid rgba(255, 255, 255, 0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #3b82f6;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h1 { font-size: 20px; margin-bottom: 8px; font-weight: 600; }
              p { color: #94a3b8; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h1>Connexion à GitHub réussie</h1>
            <p>Cette fenêtre va se fermer automatiquement...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: "${accessToken}" }, '*');
                setTimeout(() => {
                  window.close();
                }, 800);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
         </html>
      `);
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      res.status(500).send(`Erreur lors de l'authentification : ${error.message}`);
    }
  });

  // Fetch GitHub User Profile
  app.get("/api/github/profile", async (req, res) => {
    try {
      const token = getGitHubToken(req);
      if (!token) {
        return res.status(401).json({ error: "Jeton GitHub manquant ou invalide." });
      }

      const response = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Studora-App",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Erreur GitHub API: ${response.status} ${err}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching GitHub profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch GitHub Repositories
  app.get("/api/github/repos", async (req, res) => {
    try {
      const token = getGitHubToken(req);
      if (!token) {
        return res.status(401).json({ error: "Jeton GitHub manquant ou invalide." });
      }

      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Studora-App",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Erreur GitHub API: ${response.status} ${err}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching GitHub repos:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch GitHub Repository Contents (folder or file details)
  app.get("/api/github/contents", async (req, res) => {
    try {
      const token = getGitHubToken(req);
      const { owner, repo, path: filePath } = req.query;
      if (!token) {
        return res.status(401).json({ error: "Jeton GitHub manquant ou invalide." });
      }
      if (!owner || !repo) {
        return res.status(400).json({ error: "Propriétaire (owner) et dépôt (repo) requis." });
      }

      const cleanPath = filePath ? String(filePath) : "";
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Studora-App",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Erreur GitHub API: ${response.status} ${err}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching GitHub contents:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Analyze code or text file fetched from GitHub
  app.post("/api/github/analyze-file", async (req, res) => {
    try {
      const token = getGitHubToken(req);
      const { owner, repo, path: filePath, contentText, fileName, provider } = req.body;

      let finalContent = contentText;

      // If file content was not sent directly, pull it raw from GitHub
      if (!finalContent && owner && repo && filePath) {
        if (!token) {
          return res.status(401).json({ error: "Jeton GitHub requis pour lire le fichier." });
        }
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "User-Agent": "Studora-App",
            "Accept": "application/vnd.github.v3.raw",
          },
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Impossible d'obtenir le fichier de GitHub : ${response.status} ${err}`);
        }
        finalContent = await response.text();
      }

      if (!finalContent) {
        return res.status(400).json({ error: "Le contenu du fichier est vide ou introuvable." });
      }

      // Handle DeepSeek Provider if selected
      if (provider === 'deepseek') {
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekApiKey) {
          return res.status(400).json({
            error: "La clé d'API DeepSeek (DEEPSEEK_API_KEY) n'est pas configurée sur le serveur. Veuillez l'ajouter dans vos variables d'environnement."
          });
        }

        console.log("Calling DeepSeek API (deepseek-chat) for GitHub file analysis...");
        const deepseekPrompt = `Analyse ce fichier d'études ou de programmation universitaire nommé "${fileName || filePath || 'cours.txt'}".
Contenu du fichier :
---
${finalContent.substring(0, 15000)}
---

Génère un quiz de révision de haute qualité avec 3 à 5 questions à choix multiples (QCM) pour évaluer la compréhension de ce fichier (concepts clés, syntaxe, algorithmes, ou définitions selon le contenu).
Génère également 3 à 5 flashcards pour mémoriser les notions indispensables de ce fichier.
Toutes les questions, options de réponse, explications et flashcards doivent être rédigées en français impeccable et de niveau académique.

Tu devez répondre obligatoirement sous forme d'un objet JSON valide respectant strictement ce schéma :
{
  "quizTitle": "Un titre court et académique pour le quiz, par exemple 'Quiz : Concepts du fichier X'.",
  "questions": [
    {
      "question": "La question de révision.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct": 0, // l'index de l'option correcte (0, 1, 2, ou 3)
      "explanation": "L'explication didactique de la réponse correcte."
    }
  ],
  "flashcards": [
    {
      "front": "Recto : terme, concept ou question.",
      "back": "Verso : réponse ou définition."
    }
  ]
}`;

        const dsResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "Tu es un enseignant universitaire expert. Tu réponds uniquement en format JSON brut correspondant strictement au schéma demandé."
              },
              {
                role: "user",
                content: deepseekPrompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          })
        });

        if (!dsResponse.ok) {
          const errText = await dsResponse.text();
          throw new Error(`Erreur API DeepSeek: ${dsResponse.status} - ${errText}`);
        }

        const dsData: any = await dsResponse.json();
        const jsonText = dsData.choices[0].message.content.trim();
        const parsedData = JSON.parse(jsonText);
        return res.json(parsedData);
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "La clé d'API Gemini (GEMINI_API_KEY) n'est pas configurée dans l'espace de travail. Veuillez l'ajouter dans Settings > Secrets."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const textPart = {
        text: `Analyse ce fichier d'études ou de programmation universitaire nommé "${fileName || filePath || 'cours.txt'}".
Contenu du fichier :
---
${finalContent.substring(0, 15000)}
---

Génère un quiz de révision de haute qualité avec 3 à 5 questions à choix multiples (QCM) pour évaluer la compréhension de ce fichier (concepts clés, syntaxe, algorithmes, ou définitions selon le contenu).
Génère également 3 à 5 flashcards pour mémoriser les notions indispensables de ce fichier.
Toutes les questions, options de réponse, explications et flashcards doivent être rédigées en français impeccable et de niveau académique.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: {
                type: Type.STRING,
                description: "Un titre court et académique pour le quiz, par exemple 'Quiz : Concepts du fichier X'."
              },
              questions: {
                type: Type.ARRAY,
                description: "Une liste de 3 à 5 questions basées sur le fichier.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "La question de révision." },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "3 à 4 options exclusives de réponse."
                    },
                    correct: { type: Type.INTEGER, description: "L'index de l'option correcte (0, 1, 2, ou 3)." },
                    explanation: { type: Type.STRING, description: "L'explication de la réponse correcte." }
                  },
                  required: ["question", "options", "correct", "explanation"]
                }
              },
              flashcards: {
                type: Type.ARRAY,
                description: "Une liste de 3 à 5 flashcards de révision.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING, description: "Recto : terme, concept ou question." },
                    back: { type: Type.STRING, description: "Verso : réponse ou définition." }
                  },
                  required: ["front", "back"]
                }
              }
            },
            required: ["quizTitle", "questions", "flashcards"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Le modèle Gemini n'a pas renvoyé de contenu.");
      }

      const parsedData = JSON.parse(text.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini/DeepSeek GitHub analysis error:", error);
      res.status(500).json({ error: error.message || "Erreur interne lors de l'analyse du fichier GitHub." });
    }
  });

  // Mount Vite middleware in development mode

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
