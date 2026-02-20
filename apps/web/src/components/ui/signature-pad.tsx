"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, PenTool, ShieldCheck } from "lucide-react";

interface SignaturePadProps {
  onSave: (base64: string, metadata?: SignatureMetadata) => void;
  onClear?: () => void;
  placeholder?: string;
  requireTerms?: boolean;
  termsText?: string;
}

export interface SignatureMetadata {
  signedAt: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

export function SignaturePad({
  onSave,
  onClear,
  placeholder = "Assine aqui",
  requireTerms = false,
  termsText = "Declaro que li e concordo com os termos do serviço e confirmo que as informações acima são corretas.",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const canSign = !requireTerms || termsAccepted;

  const getCoordinates = (
    event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canSign) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);

    if (event.cancelable) event.preventDefault();
  };

  const draw = (
    event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(event);
    ctx.lineTo(x, y);
    ctx.stroke();

    if ("cancelable" in event && event.cancelable) event.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    if (requireTerms && !termsAccepted) return;

    const base64 = canvas.toDataURL("image/png");

    // Capture legal metadata
    const metadata: SignatureMetadata = {
      signedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };

    onSave(base64, metadata);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    window.addEventListener("mouseup", stopDrawing);
    window.addEventListener("touchend", stopDrawing);

    return () => {
      window.removeEventListener("mouseup", stopDrawing);
      window.removeEventListener("touchend", stopDrawing);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Terms of Acceptance */}
      {requireTerms && (
        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/30 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            <ShieldCheck className="inline h-3.5 w-3.5 mr-1 text-primary" />
            {termsText}
          </span>
        </label>
      )}

      {/* Canvas */}
      <div
        className={`relative w-full aspect-[2/1] bg-white border-2 border-dashed rounded-lg overflow-hidden touch-none transition-colors ${
          canSign
            ? "border-muted-foreground/30"
            : "border-muted-foreground/15 opacity-60"
        }`}
      >
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none opacity-50">
            <PenTool className="w-8 h-8 mb-2" />
            <span className="text-sm">
              {canSign ? placeholder : "Aceite os termos para assinar"}
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${canSign ? "cursor-crosshair" : "cursor-not-allowed"}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={isEmpty}
          className="text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Limpar
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isEmpty || (requireTerms && !termsAccepted)}
          className="text-xs"
        >
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}
