export interface BenchmarkResult {
    name: string;
    duration: number;
    timestamp: Date;
}

export interface BenchmarkStats {
    name: string;
    samples: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
}

const results: Map<string, number[]> = new Map();

export async function benchmark<T>(
    name: string,
    fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
        const samples = results.get(name) || [];
        samples.push(duration);
        if (samples.length > 100) samples.shift();
        results.set(name, samples);


    }

    return { result, duration };
}

export function getStats(name: string): BenchmarkStats | null {
    const samples = results.get(name);
    if (!samples || samples.length === 0) return null;

    const sorted = [...samples].sort((a, b) => a - b);
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
        name,
        samples: samples.length,
        avg: Math.round(avg * 100) / 100,
        min: Math.round(sorted[0] * 100) / 100,
        max: Math.round(sorted[sorted.length - 1] * 100) / 100,
        p95: Math.round(sorted[p95Index] * 100) / 100,
    };
}

export function getAllStats(): BenchmarkStats[] {
    return Array.from(results.keys())
        .map(name => getStats(name))
        .filter((s): s is BenchmarkStats => s !== null)
        .sort((a, b) => b.avg - a.avg);
}

export function clearStats(): void {
    results.clear();
}

export async function runMultiple<T>(
    name: string,
    fn: () => Promise<T>,
    iterations: number = 5
): Promise<{ results: T[]; stats: BenchmarkStats }> {
    const outputs: T[] = [];

    for (let i = 0; i < iterations; i++) {
        const { result } = await benchmark(`${name}`, fn);
        outputs.push(result);
    }

    const stats = getStats(name)!;
    return { results: outputs, stats };
}
