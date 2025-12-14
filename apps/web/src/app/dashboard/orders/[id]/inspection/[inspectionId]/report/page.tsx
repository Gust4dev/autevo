'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Printer, FileText, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui/badge';

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  entrada: 'Vistoria de Entrada',
  pos_limpeza: 'Vistoria Pós-Limpeza',
  final: 'Vistoria Final',
};

const DAMAGE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  scratch: { label: 'Arranhão', emoji: '✏️' },
  dent: { label: 'Amassado', emoji: '👊' },
  crack: { label: 'Trinca', emoji: '💔' },
  paint: { label: 'Pintura Danificada', emoji: '🎨' },
};

const POSITION_LABELS: Record<string, string> = {
  capo: 'Capô',
  teto: 'Teto',
  para_brisa: 'Para-brisa',
  vidro_traseiro: 'Vidro Traseiro',
  porta_dianteira_esq: 'Porta Dianteira Esquerda',
  porta_dianteira_dir: 'Porta Dianteira Direita',
  porta_traseira_esq: 'Porta Traseira Esquerda',
  porta_traseira_dir: 'Porta Traseira Direita',
  paralama_dianteiro_esq: 'Paralama Dianteiro Esquerdo',
  paralama_dianteiro_dir: 'Paralama Dianteiro Direito',
  paralama_traseiro_esq: 'Paralama Traseiro Esquerdo',
  paralama_traseiro_dir: 'Paralama Traseiro Direito',
  para_choque_dianteiro: 'Para-choque Dianteiro',
  para_choque_traseiro: 'Para-choque Traseiro',
  roda_dianteira_esq: 'Roda Dianteira Esquerda',
  roda_dianteira_dir: 'Roda Dianteira Direita',
  roda_traseira_esq: 'Roda Traseira Esquerda',
  roda_traseira_dir: 'Roda Traseira Direita',
  lateral_esquerda: 'Lateral Esquerda',
  lateral_direita: 'Lateral Direita',
  traseira: 'Traseira',
  dianteira: 'Dianteira',
  indefinido: 'Outras Áreas',
};

export default function InspectionReportPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = params.inspectionId as string;
  const orderId = params.id as string;

  const { data: inspection, isLoading } = trpc.inspection.getById.useQuery(
    { inspectionId },
    { enabled: !!inspectionId }
  );

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
  const vehicle = inspection.order.vehicle;

  const handlePrint = () => {
    window.print();
  };

  // Group damages by position
  const damagesByPosition = inspection.damages.reduce((acc, damage) => {
    const pos = damage.position;
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(damage);
    return acc;
  }, {} as Record<string, typeof inspection.damages>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/orders/${orderId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{typeLabel}</h1>
            <p className="text-sm text-muted-foreground">
              {vehicle.plate} • {vehicle.brand} {vehicle.model}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/orders/${orderId}/inspection/${inspectionId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar 3D
            </Link>
          </Button>
        </div>
      </header>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{typeLabel}</h1>
            <p className="text-muted-foreground mt-1">
              Data: {new Date(inspection.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold">{vehicle.plate}</p>
            <p className="text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo da Vistoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">{typeLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data</p>
                <p className="font-medium">
                  {new Date(inspection.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Veículo</p>
                <p className="font-medium">{vehicle.plate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total de Danos</p>
                <p className="font-medium">{inspection.damages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Damages List */}
        <Card>
          <CardHeader>
            <CardTitle>Danos Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            {inspection.damages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dano identificado nesta vistoria.
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(damagesByPosition).map(([position, damages]) => {
                  const posLabel = POSITION_LABELS[position] || position.toUpperCase();
                  
                  return (
                    <div key={position} className="border-l-4 border-primary pl-4">
                      <h3 className="font-bold text-lg uppercase tracking-wide text-primary mb-3">
                        {posLabel}
                      </h3>
                      <ul className="space-y-3">
                        {damages.map((damage) => {
                          const typeInfo = DAMAGE_TYPE_LABELS[damage.damageType] || {
                            label: damage.damageType,
                            emoji: '📋',
                          };
                          
                          return (
                            <li
                              key={damage.id}
                              className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg"
                            >
                              <span className="text-2xl">{typeInfo.emoji}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{typeInfo.label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {damage.damageType}
                                  </Badge>
                                </div>
                                {damage.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {damage.notes}
                                  </p>
                                )}
                                {/* Placeholder for future image link */}
                                {damage.photoUrl && (
                                  <a
                                    href={damage.photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline mt-1 inline-block"
                                  >
                                    Ver foto
                                  </a>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section (if signed) */}
        {inspection.signedAt && (
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Assinado em{' '}
                {new Date(inspection.signedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {inspection.signedVia && ` via ${inspection.signedVia}`}
              </p>
              {inspection.signatureUrl && (
                <img
                  src={inspection.signatureUrl}
                  alt="Assinatura"
                  className="mt-4 max-w-xs border rounded"
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
