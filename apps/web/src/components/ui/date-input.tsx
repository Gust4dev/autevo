"use client";

import { useState, useEffect, forwardRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/cn";

interface DateInputProps {
  value?: string; // Formato interno: YYYY-MM-DD
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  error?: string;
  id?: string;
  name?: string;
  min?: string;
  disabled?: boolean;
}

/**
 * DateInput com formato brasileiro (DD/MM/AAAA)
 * Aceita entrada no formato brasileiro e converte internamente para ISO
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value = "",
      onChange,
      onBlur,
      placeholder = "DD/MM/AAAA",
      className,
      error,
      id,
      name,
      min,
      disabled,
    },
    ref,
  ) => {
    // Converte YYYY-MM-DD para DD/MM/AAAA para exibição
    const formatToDisplay = (isoDate: string): string => {
      if (!isoDate) return "";
      const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
      return isoDate; // Retorna como está se não for formato ISO
    };

    // Converte DD/MM/AAAA para YYYY-MM-DD para armazenamento
    const formatToISO = (displayDate: string): string => {
      const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
      return displayDate; // Retorna como está se não for formato brasileiro
    };

    const [displayValue, setDisplayValue] = useState(formatToDisplay(value));

    // Atualiza displayValue quando value externo muda
    useEffect(() => {
      setDisplayValue(formatToDisplay(value));
    }, [value]);

    // Formata enquanto digita
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.replace(/\D/g, ""); // Remove não-dígitos

      // Limita a 8 dígitos (DDMMAAAA)
      if (input.length > 8) {
        input = input.slice(0, 8);
      }

      // Formata como DD/MM/AAAA
      let formatted = "";
      if (input.length > 0) {
        formatted = input.slice(0, 2);
        if (input.length > 2) {
          formatted += "/" + input.slice(2, 4);
          if (input.length > 4) {
            formatted += "/" + input.slice(4, 8);
          }
        }
      }

      setDisplayValue(formatted);

      // Se temos uma data completa, converte para ISO e notifica
      if (input.length === 8) {
        const day = parseInt(input.slice(0, 2));
        const month = parseInt(input.slice(2, 4));
        const year = parseInt(input.slice(4, 8));

        // Validação básica
        if (
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 1900
        ) {
          const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          onChange?.(isoDate);
        }
      } else if (input.length === 0) {
        onChange?.("");
      }
    };

    const handleBlur = () => {
      // Validação final no blur
      const match = displayValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);

        // Cria uma data e verifica se é válida
        const testDate = new Date(year, month - 1, day);
        if (
          testDate.getDate() !== day ||
          testDate.getMonth() !== month - 1 ||
          testDate.getFullYear() !== year
        ) {
          // Data inválida (ex: 31/02/2000)
          setDisplayValue("");
          onChange?.("");
        }
      }
      onBlur?.();
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(className)}
        error={error}
        disabled={disabled}
        maxLength={10} // DD/MM/AAAA
      />
    );
  },
);

DateInput.displayName = "DateInput";
