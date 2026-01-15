"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ScrollText,
  User,
  Building,
  Clock,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionColors: Record<string, { bg: string; text: string }> = {
  ADMIN_ACTIVATE_TRIAL: { bg: "bg-emerald-100", text: "text-emerald-700" },
  ADMIN_EXTEND_TRIAL: { bg: "bg-blue-100", text: "text-blue-700" },
  ADMIN_SUSPEND_TENANT: { bg: "bg-orange-100", text: "text-orange-700" },
  ADMIN_REACTIVATE_TENANT: { bg: "bg-blue-100", text: "text-blue-700" },
  ADMIN_CANCEL_TENANT: { bg: "bg-red-100", text: "text-red-700" },
  ADMIN_CHANGE_PLAN: { bg: "bg-purple-100", text: "text-purple-700" },
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const { data, isLoading } = trpc.admin.listAuditLogs.useQuery({
    page,
    limit: 20,
    action: actionFilter || undefined,
  });

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <ScrollText className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Histórico de ações administrativas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 my-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtrar por ação..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!actionFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("")}
            className={
              !actionFilter
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-slate-200"
            }
          >
            Todos
          </Button>
          <Button
            variant={actionFilter === "ACTIVATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("ACTIVATE")}
            className={
              actionFilter === "ACTIVATE"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-slate-200"
            }
          >
            Ativações
          </Button>
          <Button
            variant={actionFilter === "SUSPEND" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("SUSPEND")}
            className={
              actionFilter === "SUSPEND"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-slate-200"
            }
          >
            Suspensões
          </Button>
          <Button
            variant={actionFilter === "CANCEL" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("CANCEL")}
            className={
              actionFilter === "CANCEL"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-slate-200"
            }
          >
            Cancelamentos
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : data?.logs.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum log encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.logs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const colors = actionColors[log.action] || {
              bg: "bg-slate-100",
              text: "text-slate-600",
            };

            return (
              <Card
                key={log.id}
                className="bg-white border-slate-200 shadow-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Main Row */}
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="w-full p-4 flex items-start sm:items-center gap-3 sm:gap-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="shrink-0 pt-1 sm:pt-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <Badge
                          className={`${colors.bg} ${colors.text} border-0 w-fit`}
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Building className="h-3.5 w-3.5" />
                          <span className="text-slate-700 truncate max-w-[150px]">
                            {log.tenantName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <User className="h-3.5 w-3.5" />
                          <span className="text-slate-700">{log.userName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {log.oldValue && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                              Valor Anterior
                            </p>
                            <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.newValue && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                              Novo Valor
                            </p>
                            <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400 mb-1">Entity Type</p>
                          <p className="text-slate-700 font-medium">
                            {log.entityType}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Entity ID</p>
                          <p className="text-slate-700 font-mono truncate">
                            {log.entityId || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">User Email</p>
                          <p className="text-slate-700 truncate">
                            {log.userEmail || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Log ID</p>
                          <p className="text-slate-700 font-mono truncate">
                            {log.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            Mostrando {(page - 1) * data.pagination.limit + 1} a{" "}
            {Math.min(page * data.pagination.limit, data.pagination.total)} de{" "}
            {data.pagination.total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.pagination.totalPages}
              className="border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
