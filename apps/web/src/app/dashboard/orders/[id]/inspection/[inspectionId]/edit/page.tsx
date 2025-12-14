'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertTriangle, Plus, X, Trash2, MapPin } from 'lucide-react';
import { trpc } from '@/lib/trpc/provider';
import { useInspectionStore, useMarkers, useIsDirty, useSelectedMarker, type DamageType } from '@/stores/useInspectionStore';
import { getPartLabel } from '@/lib/carPartDetection';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Lazy load the 3D viewer for code splitting
const CarViewerShell = lazy(() => 
  import('@/components/inspection/CarViewerShell').then(mod => ({ default: mod.CarViewerShell }))
);

const DAMAGE_TYPES: { value: DamageType; label: string; emoji: string }[] = [
  { value: 'scratch', label: 'Arranhão', emoji: '✏️' },
  { value: 'dent', label: 'Amassado', emoji: '👊' },
  { value: 'crack', label: 'Trinca', emoji: '💔' },
  { value: 'paint', label: 'Pintura', emoji: '🎨' },
];

const SEVERITY_LEVELS = [
  { value: 1, label: 'Leve', color: 'bg-yellow-500' },
  { value: 2, label: 'Médio', color: 'bg-orange-500' },
  { value: 3, label: 'Grave', color: 'bg-red-500' },
];

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  pos_limpeza: 'Pós-Limpeza',
  final: 'Final',
};

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-zinc-900 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-zinc-400">Carregando modelo 3D...</p>
      </div>
    </div>
  );
}

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full items-center justify-center bg-destructive/10 rounded-lg p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold text-destructive">Erro ao carregar</h3>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button onClick={reset} variant="outline" size="sm">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

// Mobile-friendly bottom sheet editor
function BottomSheetEditor() {
  const selectedMarker = useSelectedMarker();
  const updateMarker = useInspectionStore((state) => state.updateMarker);
  const removeMarker = useInspectionStore((state) => state.removeMarker);
  const selectMarker = useInspectionStore((state) => state.selectMarker);
  const [customInput, setCustomInput] = useState('');

  // Sync local state with marker's customPosition
  useEffect(() => {
    if (selectedMarker?.customPosition) {
      setCustomInput(selectedMarker.customPosition);
    } else {
      setCustomInput('');
    }
  }, [selectedMarker?.id, selectedMarker?.customPosition]);

  if (!selectedMarker) return null;

  const handleTypeChange = (type: DamageType) => {
    updateMarker(selectedMarker.id, { damageType: type });
  };

  const handleSeverityChange = (severity: 1 | 2 | 3) => {
    updateMarker(selectedMarker.id, { severity });
  };

  const handleCustomPositionChange = (value: string) => {
    setCustomInput(value);
    updateMarker(selectedMarker.id, { customPosition: value });
  };

  const handleDelete = () => {
    removeMarker(selectedMarker.id);
  };

  const handleClose = () => {
    selectMarker(null);
  };

  const isUndefined = selectedMarker.partName === 'indefinido';
  const displayLabel = selectedMarker.customPosition 
    ? selectedMarker.customPosition 
    : getPartLabel(selectedMarker.partName);

  return (
    <div className="bg-background border-t shadow-lg animate-in slide-in-from-bottom duration-200">
      {/* Header with detected position */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          {isUndefined ? (
            <span className="font-semibold text-sm text-amber-600">
              📍 Local não identificado
            </span>
          ) : (
            <span className="font-semibold text-sm truncate">{displayLabel}</span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Custom position input - shown when undefined or always editable */}
        {isUndefined && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
              Descreva o local do dano:
            </p>
            <input
              type="text"
              value={customInput}
              onChange={(e) => handleCustomPositionChange(e.target.value)}
              placeholder="Ex: Roda dianteira esquerda, Retrovisor direito..."
              className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {/* Damage Type - Large buttons for touch */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Tipo de Dano</p>
          <div className="grid grid-cols-4 gap-2">
            {DAMAGE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  selectedMarker.damageType === type.value
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{type.emoji}</span>
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Severity - Large touch targets */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Severidade</p>
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => handleSeverityChange(level.value as 1 | 2 | 3)}
                className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${
                  selectedMarker.severity === level.value
                    ? `border-primary ${level.color} text-white scale-105`
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Markers counter badge
function MarkersCounter() {
  const markers = useMarkers();
  
  if (markers.length === 0) return null;
  
  return (
    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
      {markers.length} dano{markers.length !== 1 ? 's' : ''}
    </div>
  );
}

export default function InspectionEditPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = params.inspectionId as string;
  const orderId = params.id as string;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markers = useMarkers();
  const isDirty = useIsDirty();
  const selectedMarker = useSelectedMarker();
  const hydrate = useInspectionStore((state) => state.hydrate);
  const markAsPersisted = useInspectionStore((state) => state.markAsPersisted);
  const clear = useInspectionStore((state) => state.clear);
  const isAddingMarker = useInspectionStore((state) => state.isAddingMarker);
  const toggleAddingMode = useInspectionStore((state) => state.toggleAddingMode);

  // Fetch inspection by ID
  const { data: inspection, isLoading, refetch } = trpc.inspection.getById.useQuery(
    { inspectionId },
    { enabled: !!inspectionId }
  );

  // Mutations
  const addDamages = trpc.inspection.addDamages.useMutation();

  // Hydrate store with existing damages
  useEffect(() => {
    if (inspection?.damages) {
      const markersFromDb = inspection.damages.map((d) => ({
        id: d.id,
        position: [d.x, d.y, d.z] as [number, number, number],
        normal: [d.normalX, d.normalY, d.normalZ] as [number, number, number],
        partName: d.position as any,
        damageType: d.damageType as DamageType,
        severity: 2 as 1 | 2 | 3,
        notes: d.notes || '',
        photoUrl: d.photoUrl || undefined,
        isPersisted: true,
      }));
      hydrate(markersFromDb);
    }
  }, [inspection, hydrate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  const handleSave = async () => {
    if (!isDirty || !inspectionId) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    setIsSaving(true);
    try {
      const unpersistedMarkers = markers.filter((m) => !m.isPersisted);

      if (unpersistedMarkers.length > 0) {
        await addDamages.mutateAsync({
          inspectionId,
          damages: unpersistedMarkers.map((m) => ({
            // Use customPosition if available (for 'indefinido' parts), otherwise use partName
            position: m.customPosition || m.partName,
            x: m.position[0],
            y: m.position[1],
            z: m.position[2],
            normalX: m.normal[0],
            normalY: m.normal[1],
            normalZ: m.normal[2],
            is3D: true,
            damageType: m.damageType,
            notes: m.notes,
          })),
        });

        markAsPersisted(unpersistedMarkers.map((m) => m.id));
        
        // Refetch to get the persisted IDs
        await refetch();
      }

      toast.success('Vistoria salva!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      const confirmed = window.confirm('Alterações não salvas. Sair mesmo assim?');
      if (!confirmed) return;
    }
    router.push(`/dashboard/orders/${orderId}/inspection/${inspectionId}/report`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Vistoria não encontrada</p>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  const typeLabel = INSPECTION_TYPE_LABELS[inspection.type] || inspection.type;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Compact for mobile */}
      <header className="border-b px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              Editando: {typeLabel}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {inspection.order.vehicle.plate} • {inspection.order.vehicle.brand} {inspection.order.vehicle.model}
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!isDirty || isSaving}
          size="sm"
          className="shrink-0"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </>
          )}
        </Button>
      </header>

      {/* 3D Viewer - Takes remaining space */}
      <div className="flex-1 relative min-h-0">
        {error ? (
          <ErrorFallback error={error} reset={() => setError(null)} />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <CarViewerShell
              orderId={orderId}
              inspectionId={inspectionId}
              onError={setError}
            />
          </Suspense>
        )}

        {/* Markers counter overlay */}
        <MarkersCounter />

        {/* Mode toggle - Floating button */}
        <button
          onClick={toggleAddingMode}
          className={`absolute bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            isAddingMarker
              ? 'bg-red-600 text-white'
              : 'bg-zinc-700 text-zinc-300'
          }`}
        >
          <Plus className={`h-6 w-6 transition-transform ${isAddingMarker ? '' : 'rotate-45'}`} />
        </button>

        {/* Instructions overlay */}
        {!selectedMarker && (
          <div className="absolute bottom-20 left-4 right-20 pointer-events-none">
            <p className="text-xs text-zinc-400 bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm inline-block">
              {isAddingMarker ? '👆 Toque no carro para marcar dano' : '🔄 Arraste para girar'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Sheet Editor - Mobile friendly */}
      <BottomSheetEditor />
    </div>
  );
}
