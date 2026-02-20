"use client";

import { WifiOff, CloudUpload, Loader2 } from "lucide-react";

interface OfflineUploadBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

/**
 * Persistent banner shown at the top of the inspection page
 * when there are pending offline uploads or the device is offline.
 */
export function OfflineUploadBanner({
  isOnline,
  pendingCount,
  isSyncing,
}: OfflineUploadBannerProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>
          <strong>Sem conexão.</strong> As fotos serão salvas localmente e
          enviadas automaticamente quando a rede voltar.
          {pendingCount > 0 && (
            <span className="ml-1 font-medium">
              ({pendingCount} pendente{pendingCount > 1 ? "s" : ""})
            </span>
          )}
        </span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>
          <strong>Enviando fotos...</strong> Aguarde enquanto as fotos pendentes
          são sincronizadas.
        </span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
        <CloudUpload className="h-4 w-4 shrink-0" />
        <span>
          <strong>
            {pendingCount} foto{pendingCount > 1 ? "s" : ""} pendente
            {pendingCount > 1 ? "s" : ""}.
          </strong>{" "}
          Serão enviadas automaticamente.
        </span>
      </div>
    );
  }

  return null;
}
