// src/stores/useAppStore.ts
/**
 * Zustand app store for Multiformat frontend.
 * - Holds current quiz, quizzes list (future), selected question id.
 * - Provides helpers: setQuiz, updateQuestion, accept/reject, bulk ops, export JSON.
 *
 * Notes:
 * - Uses zustand. Install with: npm install zustand
 * - Optionally add persist middleware by uncommenting the persist wrapper below
 *   and installing zustand/middleware.
 */

import type { Quiz, QuizQuestion } from "@/lib/api";
import { create } from "zustand";

type AppState = {
  currentQuiz: Quiz | null;
  quizzes: Quiz[]; // future multi-quiz support
  selectedQuestionId: string | null;

  // setters
  setQuiz: (quiz: Quiz | null) => void;
  clearQuiz: () => void;

  // question operations
  updateQuestion: (id: string, patch: Partial<QuizQuestion>) => void;
  setSelectedQuestion: (id: string | null) => void;
  acceptQuestion: (id: string) => void;
  rejectQuestion: (id: string) => void;

  // bulk operations
  acceptAll: () => void;
  rejectAll: () => void;

  // helpers
  exportCurrentQuizJSON: () => string | null;
};

export const useAppStore = create<AppState>((set, get) => ({
  currentQuiz: null,
  quizzes: [],
  selectedQuestionId: null,

  setQuiz: (quiz) =>
    set(() => ({
      currentQuiz: quiz,
      selectedQuestionId: quiz && quiz.questions.length > 0 ? quiz.questions[0].id : null,
    })),

  clearQuiz: () => set({ currentQuiz: null, selectedQuestionId: null }),

  updateQuestion: (id, patch) => {
    const state = get();
    const q = state.currentQuiz;
    if (!q) return;
    const nextQuestions = q.questions.map((question) =>
      question.id === id ? { ...question, ...patch } : question
    );
    set({ currentQuiz: { ...q, questions: nextQuestions } });
  },

  setSelectedQuestion: (id) => set({ selectedQuestionId: id }),

  acceptQuestion: (id) => {
    // we'll store acceptance as a `status` field on the question for UI only
    get().updateQuestion(id, { ...(undefined as unknown as Partial<QuizQuestion>), status: "accepted" } as any);
  },

  rejectQuestion: (id) => {
    get().updateQuestion(id, { ...(undefined as unknown as Partial<QuizQuestion>), status: "rejected" } as any);
  },

  acceptAll: () => {
    const state = get();
    const q = state.currentQuiz;
    if (!q) return;
    const updated = q.questions.map((question) => ({ ...question, status: "accepted" as const }));
    set({ currentQuiz: { ...q, questions: updated } });
  },

  rejectAll: () => {
    const state = get();
    const q = state.currentQuiz;
    if (!q) return;
    const updated = q.questions.map((question) => ({ ...question, status: "rejected" as const }));
    set({ currentQuiz: { ...q, questions: updated } });
  },

  exportCurrentQuizJSON: () => {
    const q = get().currentQuiz;
    if (!q) return null;
    try {
      return JSON.stringify(q, null, 2);
    } catch (e) {
      return null;
    }
  },
}));

/**
 * Optional: session persistence
 *
 * If you want the store to survive refresh during prototyping, you can wrap create() with persist:
 *
 * import { persist } from "zustand/middleware";
 * export const useAppStore = create<AppState>()(
 *   persist((set, get) => ({ ...state }), { name: "multiformat-store" })
 * );
 *
 * Remember to install zustand/middleware if you use persist.
 */
