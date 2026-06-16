export const SYSTEM_PROMPTS = {
  chatWithCitations: (context: string) => `You are LearnSphere AI. Answer using ONLY the provided text blocks. 
Every time you reference an assertion from a text block, append the source indicator inline, like [Source X].

DOCUMENT CONTEXT:
${context}`,

  summarization: (fullContent: string) => `Analyze this technical text and output a clean study summary.
Include:
1. Executive Overview (TL;DR)
2. Core Concepts & Definitions
3. Critical Formulas or Governing Laws (if applicable)

TEXT:
${fullContent}`,

  quizGeneration: (difficulty: string, docTitle: string, context: string) => `Generate a 10-question multiple-choice quiz about the academic subject of "${docTitle}".
Target Difficulty Level: ${difficulty}

CRITICAL RULES:
1. Focus the quiz strictly on the core educational/academic concepts of the topic (e.g. if the topic is "Averages", ask math/aptitude questions about averages, calculations, word problems, etc.).
2. Do NOT ask metadata, header, footer, or publisher questions. Never ask about author names, page numbers, document titles, or administrative text present in the document (such as "B.VIDYA SAGAR", "APTITUDE TRAINER", "GRANDS KEY", page stamps, etc.).
3. If the CONTEXT below is empty, contains only headers/footers, or lacks actual educational/academic text to build questions from, ignore the CONTEXT and generate a standard, high-quality educational quiz on the general subject of "${docTitle}" at the target difficulty level.

CRITICAL FORMAT REQUIREMENT: Your ENTIRE response must be ONLY a raw JSON array of exactly 10 questions. Do NOT include any explanation, preamble, markdown, or text before or after the JSON.
Output format (and nothing else):
[{"question": "...", "options": ["A", "B", "C", "D"], "answer": "correct option string"}]

CONTEXT:
${context}`,

  planner: (topicSummary: string, daysUntilExam: number) => `Create a structured study itinerary based on the topic: "${topicSummary}".
The user has exactly ${daysUntilExam} days remaining before final verification.

CRITICAL: Your ENTIRE response must be ONLY a raw JSON array. Do NOT include any explanation, preamble, markdown, or text before or after the JSON.
Output format (and nothing else):
[{"day": 1, "focus": "Topic text", "milestoneAction": "Task description"}]`
};
