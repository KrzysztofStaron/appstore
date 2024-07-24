export interface BenchmarkResult {
  operation: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BenchmarkSummary {
  totalDuration: number;
  operations: BenchmarkResult[];
  averageDuration: number;
  slowestOperation: BenchmarkResult | null;
  fastestOperation: BenchmarkResult | null;
  llmSummary?: {
    totalLLMTime: number;
    totalLLMCalls: number;
    averageLLMTime: number;
  };
}

class Benchmark {
  private results: BenchmarkResult[] = [];
  private startTime: number | null = null;

  start(operation: string): void {
    this.startTime = performance.now();
  }

  end(operation: string, metadata?: Record<string, any>): number {
    if (this.startTime === null) {
      console.warn(`Benchmark end called for ${operation} without start`);
      return 0;
    }

    const duration = performance.now() - this.startTime;
    this.results.push({
      operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    });

    this.startTime = null;
    return duration;
  }

  async measure<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation, metadata);
      return result;
    } catch (error) {
      this.end(operation, { ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  measureSync<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(operation);
    try {
      const result = fn();
      this.end(operation, metadata);
      return result;
    } catch (error) {
      this.end(operation, { ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  getSummary(): BenchmarkSummary {
    if (this.results.length === 0) {
      return {
        totalDuration: 0,
        operations: [],
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
      };
    }

    const totalDuration = this.results.reduce((sum, result) => sum + result.duration, 0);
    const averageDuration = totalDuration / this.results.length;
    const slowestOperation = this.results.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );
    const fastestOperation = this.results.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    );

    // Calculate LLM summary
    const llmOperations = this.results.filter(
      result =>
        result.operation.includes("llm") || result.operation.includes("filter") || result.operation.includes("LLM")
    );

    let llmSummary = undefined;
    if (llmOperations.length > 0) {
      const totalLLMTime = llmOperations.reduce((sum, result) => sum + result.duration, 0);
      const totalLLMCalls = llmOperations.length;
      const averageLLMTime = totalLLMTime / totalLLMCalls;

      llmSummary = {
        totalLLMTime,
        totalLLMCalls,
        averageLLMTime,
      };
    }

    return {
      totalDuration,
      operations: this.results,
      averageDuration,
      slowestOperation,
      fastestOperation,
      llmSummary,
    };
  }

  clear(): void {
    this.results = [];
    this.startTime = null;
  }

  printSummary(): void {
    const summary = this.getSummary();

    console.log("\n🚀 BENCHMARK SUMMARY");
    console.log("=".repeat(50));
    console.log(`⏱️  Total Duration: ${summary.totalDuration.toFixed(2)}ms`);
    console.log(`📊 Operations: ${summary.operations.length}`);
    console.log(`📈 Average Duration: ${summary.averageDuration.toFixed(2)}ms`);

    if (summary.slowestOperation) {
      console.log(
        `🐌 Slowest: ${summary.slowestOperation.operation} (${summary.slowestOperation.duration.toFixed(2)}ms)`
      );
    }

    if (summary.fastestOperation) {
      console.log(
        `⚡ Fastest: ${summary.fastestOperation.operation} (${summary.fastestOperation.duration.toFixed(2)}ms)`
      );
    }

    // Print LLM summary if available
    if (summary.llmSummary) {
      console.log("\n🧠 LLM OPERATIONS SUMMARY");
      console.log("-".repeat(30));
      console.log(`⏱️  Total LLM Time: ${summary.llmSummary.totalLLMTime.toFixed(2)}ms`);
      console.log(`📞 Total LLM Calls: ${summary.llmSummary.totalLLMCalls}`);
      console.log(`📊 Average LLM Time: ${summary.llmSummary.averageLLMTime.toFixed(2)}ms`);
      console.log(
        `📈 LLM % of Total: ${((summary.llmSummary.totalLLMTime / summary.totalDuration) * 100).toFixed(1)}%`
      );
    }

    console.log("\n📋 DETAILED OPERATIONS");
    console.log("-".repeat(30));

    // Group operations by type
    const grouped = summary.operations.reduce((acc, result) => {
      const type = this.getOperationType(result.operation);
      if (!acc[type]) acc[type] = [];
      acc[type].push(result);
      return acc;
    }, {} as Record<string, BenchmarkResult[]>);

    Object.entries(grouped).forEach(([type, operations]) => {
      const totalTime = operations.reduce((sum, op) => sum + op.duration, 0);
      console.log(`\n${type.toUpperCase()}:`);
      operations.forEach(op => {
        console.log(`  ⏱️  ${op.operation}: ${op.duration.toFixed(2)}ms`);
      });
      console.log(`  📊 Total ${type}: ${totalTime.toFixed(2)}ms`);
    });

    console.log("=".repeat(50));
  }

  private getOperationType(operation: string): string {
    if (operation.includes("llm") || operation.includes("filter") || operation.includes("LLM")) {
      return "LLM Operations";
    } else if (operation.includes("fetch") || operation.includes("api")) {
      return "API Calls";
    } else if (operation.includes("analyze") || operation.includes("analysis")) {
      return "Analysis";
    } else {
      return "Other";
    }
  }
}

export const benchmark = new Benchmark();
export function createBenchmark(): Benchmark {
  return new Benchmark();
}
