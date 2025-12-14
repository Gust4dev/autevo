import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectCarPart, type CarPart } from '@/lib/carPartDetection';

export type DamageType = 'scratch' | 'dent' | 'crack' | 'paint';
export type VehicleType = 'sedan' | 'suv' | 'hatch';

export interface MarkerData {
    id: string;
    position: [number, number, number];
    normal: [number, number, number];
    partName: CarPart;
    customPosition?: string; // Manual description when partName is 'indefinido'
    damageType: DamageType;
    severity: 1 | 2 | 3;
    notes: string;
    photoUrl?: string;
    isPersisted: boolean;
}

interface InspectionState {
    // State
    markers: MarkerData[];
    selectedMarkerId: string | null;
    isAddingMarker: boolean;
    vehicleType: VehicleType;
    inspectionId: string | null;
    orderId: string | null;
    isDirty: boolean;

    // Actions
    setInspectionContext: (inspectionId: string | null, orderId: string) => void;
    setVehicleType: (type: VehicleType) => void;
    addMarker: (position: [number, number, number], normal: [number, number, number]) => void;
    removeMarker: (id: string) => void;
    selectMarker: (id: string | null) => void;
    updateMarker: (id: string, updates: Partial<MarkerData>) => void;
    toggleAddingMode: () => void;
    hydrate: (markers: MarkerData[]) => void;
    markAsPersisted: (ids: string[]) => void;
    clear: () => void;
    getUnpersistedMarkers: () => MarkerData[];
}

function generateId(): string {
    return `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useInspectionStore = create<InspectionState>()(
    persist(
        (set, get) => ({
            // Initial State
            markers: [],
            selectedMarkerId: null,
            isAddingMarker: true, // Start in adding mode
            vehicleType: 'sedan',
            inspectionId: null,
            orderId: null,
            isDirty: false,

            // Actions
            setInspectionContext: (inspectionId, orderId) => {
                set({ inspectionId, orderId });
            },

            setVehicleType: (type) => {
                set({ vehicleType: type });
            },

            addMarker: (position, normal) => {
                const detectedPart = detectCarPart(position, normal);

                // Debug log to see coordinates
                console.log('[Inspection] Adding marker:', {
                    position,
                    normal,
                    detectedPart,
                });

                const newMarker: MarkerData = {
                    id: generateId(),
                    position,
                    normal,
                    partName: detectedPart,
                    damageType: 'scratch',
                    severity: 2,
                    notes: '',
                    isPersisted: false,
                };

                set((state) => ({
                    markers: [...state.markers, newMarker],
                    selectedMarkerId: newMarker.id,
                    isDirty: true,
                }));
            },

            removeMarker: (id) => {
                set((state) => ({
                    markers: state.markers.filter((m) => m.id !== id),
                    selectedMarkerId: state.selectedMarkerId === id ? null : state.selectedMarkerId,
                    isDirty: true,
                }));
            },

            selectMarker: (id) => {
                set({ selectedMarkerId: id });
            },

            updateMarker: (id, updates) => {
                set((state) => ({
                    markers: state.markers.map((m) =>
                        m.id === id ? { ...m, ...updates, isPersisted: false } : m
                    ),
                    isDirty: true,
                }));
            },

            toggleAddingMode: () => {
                set((state) => ({ isAddingMarker: !state.isAddingMarker }));
            },

            hydrate: (markers) => {
                set({
                    markers: markers.map((m) => ({ ...m, isPersisted: true })),
                    isDirty: false,
                });
            },

            markAsPersisted: (ids) => {
                set((state) => ({
                    markers: state.markers.map((m) =>
                        ids.includes(m.id) ? { ...m, isPersisted: true } : m
                    ),
                    isDirty: false,
                }));
            },

            clear: () => {
                set({
                    markers: [],
                    selectedMarkerId: null,
                    isAddingMarker: true,
                    isDirty: false,
                });
            },

            getUnpersistedMarkers: () => {
                return get().markers.filter((m) => !m.isPersisted);
            },
        }),
        {
            name: 'inspection-store',
            // Only persist markers temporarily for offline support
            partialize: (state) => ({
                markers: state.markers,
                vehicleType: state.vehicleType,
                orderId: state.orderId,
            }),
        }
    )
);

// Selector hooks for optimized re-renders
export const useMarkers = () => useInspectionStore((state) => state.markers);
export const useSelectedMarker = () => {
    const markers = useInspectionStore((state) => state.markers);
    const selectedId = useInspectionStore((state) => state.selectedMarkerId);
    return markers.find((m) => m.id === selectedId) ?? null;
};
export const useIsAddingMarker = () => useInspectionStore((state) => state.isAddingMarker);
export const useIsDirty = () => useInspectionStore((state) => state.isDirty);
