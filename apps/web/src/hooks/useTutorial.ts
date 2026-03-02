"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TutorialStep =
    | "baptism-hook"
    | "finance-hook"
    | "finance-payload"
    | "customer-hook"
    | "customer-payload"
    | "agenda-hook"
    | "agenda-payload"
    | "os-hook"
    | "os-payload"
    | "os-closing"
    | "settings-hook"
    | "settings-payload"
    | "complete";

interface TutorialState {
    isActive: boolean;
    hideCard: boolean;
    currentStep: TutorialStep;
    hasCompletedTutorial: boolean;
    startTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTutorial: () => void;
    completeTutorial: () => void;
    setStep: (step: TutorialStep) => void;
    setHideCard: (hide: boolean) => void;
}

const steps: TutorialStep[] = [
    "baptism-hook",
    "finance-hook",
    "finance-payload",
    "customer-hook",
    "customer-payload",
    "agenda-hook",
    "agenda-payload",
    "os-hook",
    "os-payload",
    "os-closing",
    "settings-hook",
    "settings-payload",
    "complete",
];

export const useTutorial = create<TutorialState>()(
    persist(
        (set, get) => ({
            isActive: false,
            hideCard: false,
            currentStep: "baptism-hook",
            hasCompletedTutorial: false,

            startTutorial: () =>
                set({ isActive: true, hideCard: false, currentStep: "baptism-hook", hasCompletedTutorial: false }),

            nextStep: () => {
                const { currentStep } = get();
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                    set({ currentStep: steps[currentIndex + 1], hideCard: false });
                }
            },

            prevStep: () => {
                const { currentStep } = get();
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex > 0) {
                    set({ currentStep: steps[currentIndex - 1], hideCard: false });
                }
            },

            skipTutorial: () =>
                set({ isActive: false, hideCard: false, hasCompletedTutorial: true }),

            completeTutorial: () =>
                set({ isActive: false, hideCard: false, hasCompletedTutorial: true, currentStep: "complete" }),

            setStep: (step: TutorialStep) => set({ currentStep: step, hideCard: false }),

            setHideCard: (hide: boolean) => set({ hideCard: hide }),
        }),
        {
            name: "autevo-tutorial-storage-v2",
        }
    )
);
