/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 PDFs
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Secure API endpoint for Gemini PDF analysis
  app.post("/api/analyze-pdf", async (req, res) => {
    try {
      const { pdfBase64, fileName } = req.body;
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

      // Call Gemini 3.5 Flash for high speed, native PDF understanding and robust schema extraction
      const response = await ai.models.generateContent({
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

      const text = response.text;
      if (!text) {
        throw new Error("Le modèle Gemini n'a pas renvoyé de contenu textuel.");
      }

      const parsedData = JSON.parse(text.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini analysis error:", error);
      res.status(500).json({ error: error.message || "Erreur interne lors de l'analyse du PDF." });
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
