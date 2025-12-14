'use client';

import { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { useInspectionStore, type MarkerData, type DamageType } from '@/stores/useInspectionStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const DAMAGE_TYPES: { value: DamageType; label: string; color: string }[] = [
  { value: 'scratch', label: 'Arranhão', color: 'bg-red-500' },
  { value: 'dent', label: 'Amassado', color: 'bg-orange-500' },
  { value: 'crack', label: 'Trinca', color: 'bg-yellow-500' },
  { value: 'paint', label: 'Pintura', color: 'bg-purple-500' },
];

const SEVERITY_LEVELS = [
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderado' },
  { value: 3, label: 'Grave' },
];

interface MarkerEditorProps {
  marker: MarkerData;
  onClose: () => void;
}

export function MarkerEditor({ marker, onClose }: MarkerEditorProps) {
  const updateMarker = useInspectionStore((state) => state.updateMarker);
  const removeMarker = useInspectionStore((state) => state.removeMarker);

  const [damageType, setDamageType] = useState<DamageType>(marker.damageType);
  const [severity, setSeverity] = useState<1 | 2 | 3>(marker.severity);
  const [notes, setNotes] = useState(marker.notes);

  const handleSave = () => {
    updateMarker(marker.id, { damageType, severity, notes });
    onClose();
  };

  const handleDelete = () => {
    removeMarker(marker.id);
    onClose();
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 space-y-4 w-80">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Editar Dano</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Damage Type */}
      <div className="space-y-2">
        <Label>Tipo de Dano</Label>
        <div className="grid grid-cols-2 gap-2">
          {DAMAGE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setDamageType(type.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                damageType === type.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${type.color}`} />
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <Label>Severidade</Label>
        <div className="flex gap-2">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setSeverity(level.value as 1 | 2 | 3)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                severity === level.value
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Descreva o dano..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Remover
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1"
        >
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
