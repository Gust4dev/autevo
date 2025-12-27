"use client";

import { Suspense } from "react";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <TutorialOverlay />
      </Suspense>
    </>
  );
}
