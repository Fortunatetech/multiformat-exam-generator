// src/stores/useAppStore.ts
import type { Quiz, QuizQuestion } from "@/lib/api";
import { create } from "zustand";

type AppState = {
  currentQuiz: Quiz | null;
  quizzes: Quiz[];
  selectedQuestionId: string | null;

  setQuiz: (quiz: Quiz | null) => void;
  clearQuiz: () => void;

  updateQuestion: (id: string, patch: Partial<QuizQuestion>) => void;
  setSelectedQuestion: (id: string | null) => void;
  acceptQuestion: (id: string) => void;
  rejectQuestion: (id: string) => void;

  acceptAll: () => void;
  rejectAll: () => void;

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
    get().updateQuestion(id, { status: "accepted" });
  },

  rejectQuestion: (id) => {
    get().updateQuestion(id, { status: "rejected" });
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
    } catch {
      return null;
    }
  },
}));
