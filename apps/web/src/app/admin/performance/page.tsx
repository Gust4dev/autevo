"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";

interface BenchmarkStats {
  name: string;
  samples: number;
  avg: number;
  min: number;
  max: number;
  p95: number;
}

interface Bottleneck {
  area: string;
  issue: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
}

export default function PerformancePage() {
  const [dashboardStats, setDashboardStats] = useState<BenchmarkStats[]>([]);
  const [orderStats, setOrderStats] = useState<BenchmarkStats[]>([]);
  const [customerStats, setCustomerStats] = useState<BenchmarkStats[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [counts, setCounts] = useState<{
    orders: number;
    customers: number;
    payments: number;
  } | null>(null);

  const dashboardBenchmark = trpc.benchmark.runDashboardBenchmarks.useMutation({
    onSuccess: (data) => setDashboardStats(data),
  });

  const orderBenchmark = trpc.benchmark.runOrderBenchmarks.useMutation({
    onSuccess: (data) => setOrderStats(data),
  });

  const customerBenchmark = trpc.benchmark.runCustomerBenchmarks.useMutation({
    onSuccess: (data) => setCustomerStats(data),
  });

  const analyzeBottlenecks = trpc.benchmark.analyzeBottlenecks.useQuery(
    undefined,
    {
      enabled: false,
    },
  );

  const clearStats = trpc.benchmark.clear.useMutation();

  const isRunning =
    dashboardBenchmark.isPending ||
    orderBenchmark.isPending ||
    customerBenchmark.isPending;

  const runAllBenchmarks = async () => {
    await dashboardBenchmark.mutateAsync({ iterations: 5 });
    await orderBenchmark.mutateAsync({ iterations: 5 });
    await customerBenchmark.mutateAsync({ iterations: 5 });
    const result = await analyzeBottlenecks.refetch();
    if (result.data) {
      const data = result.data as any;
      setBottlenecks(data.bottlenecks);
      setCounts(data.counts);
    }
  };

  const handleClear = () => {
    clearStats.mutate();
    setDashboardStats([]);
    setOrderStats([]);
    setCustomerStats([]);
    setBottlenecks([]);
    setCounts(null);
  };

  const getStatusColor = (avg: number) => {
    if (avg >= 1000) return "text-red-500";
    if (avg >= 500) return "text-yellow-500";
    if (avg >= 200) return "text-blue-500";
    return "text-green-500";
  };

  const getStatusIcon = (avg: number) => {
    if (avg >= 1000) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (avg >= 500) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (avg >= 200) return <Zap className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const StatsTable = ({
    stats,
    title,
  }: {
    stats: BenchmarkStats[];
    title: string;
  }) => {
    if (stats.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Query</th>
                  <th className="text-right py-2 px-3">Avg (ms)</th>
                  <th className="text-right py-2 px-3">Min</th>
                  <th className="text-right py-2 px-3">Max</th>
                  <th className="text-right py-2 px-3">P95</th>
                  <th className="text-right py-2 px-3">Samples</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr
                    key={stat.name}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-2 px-3 flex items-center gap-2">
                      {getStatusIcon(stat.avg)}
                      <code className="text-xs">{stat.name}</code>
                    </td>
                    <td
                      className={`text-right py-2 px-3 font-mono font-semibold ${getStatusColor(
                        stat.avg,
                      )}`}
                    >
                      {stat.avg.toFixed(1)}
                    </td>
                    <td className="text-right py-2 px-3 font-mono text-muted-foreground">
                      {stat.min.toFixed(1)}
                    </td>
                    <td className="text-right py-2 px-3 font-mono text-muted-foreground">
                      {stat.max.toFixed(1)}
                    </td>
                    <td className="text-right py-2 px-3 font-mono text-muted-foreground">
                      {stat.p95.toFixed(1)}
                    </td>
                    <td className="text-right py-2 px-3 text-muted-foreground">
                      {stat.samples}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Benchmarks</h1>
          <p className="text-muted-foreground">
            Analyze query performance and identify bottlenecks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear} disabled={isRunning}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={runAllBenchmarks} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run All Benchmarks
          </Button>
        </div>
      </div>

      {counts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {counts.orders.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Orders</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {counts.customers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {counts.payments.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Payments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {bottlenecks.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Bottlenecks Detected
            </CardTitle>
            <CardDescription>
              Areas that may need optimization based on your data volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottlenecks.map((b, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    b.severity === "high"
                      ? "border-red-500/50 bg-red-500/5"
                      : b.severity === "medium"
                        ? "border-yellow-500/50 bg-yellow-500/5"
                        : "border-blue-500/50 bg-blue-500/5"
                  }`}
                >
                  <div className="font-semibold">{b.area}</div>
                  <div className="text-sm text-muted-foreground">{b.issue}</div>
                  <div className="text-sm mt-1">
                    <span className="text-green-600 font-medium">
                      Recommendation:{" "}
                    </span>
                    {b.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <StatsTable stats={dashboardStats} title="Dashboard Queries" />
        <StatsTable stats={orderStats} title="Order Queries" />
        <StatsTable stats={customerStats} title="Customer Queries" />
      </div>

      {!isRunning &&
        dashboardStats.length === 0 &&
        orderStats.length === 0 &&
        customerStats.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Click "Run All Benchmarks" to measure query performance
              </p>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Critical (&gt;1000ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>Warning (500-1000ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>Acceptable (200-500ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Fast (&lt;200ms)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
