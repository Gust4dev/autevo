"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TutorialStep =
    | "welcome"
    | "dashboard-overview"
    | "navigate-services"
    | "services-page"
    | "new-service-form"
    | "service-name"
    | "service-price"
    | "service-time"
    | "service-save"
    | "complete";

interface TutorialState {
    isActive: boolean;
    currentStep: TutorialStep;
    hasCompletedTutorial: boolean;
    startTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTutorial: () => void;
    completeTutorial: () => void;
    setStep: (step: TutorialStep) => void;
}

const steps: TutorialStep[] = [
    "welcome",
    "dashboard-overview",
    "navigate-services",
    "services-page",
    "new-service-form",
    "service-name",
    "service-price",
    "service-time",
    "service-save",
    "complete",
];

export const useTutorial = create<TutorialState>()(
    persist(
        (set, get) => ({
            isActive: false,
            currentStep: "welcome",
            hasCompletedTutorial: false,

            startTutorial: () =>
                set({ isActive: true, currentStep: "welcome", hasCompletedTutorial: false }),

            nextStep: () => {
                const { currentStep } = get();
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                    set({ currentStep: steps[currentIndex + 1] });
                }
            },

            prevStep: () => {
                const { currentStep } = get();
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex > 0) {
                    set({ currentStep: steps[currentIndex - 1] });
                }
            },

            skipTutorial: () =>
                set({ isActive: false, hasCompletedTutorial: true }),

            completeTutorial: () =>
                set({ isActive: false, hasCompletedTutorial: true, currentStep: "complete" }),

            setStep: (step: TutorialStep) => set({ currentStep: step }),
        }),
        {
            name: "filmtech-tutorial-storage",
        }
    )
);
