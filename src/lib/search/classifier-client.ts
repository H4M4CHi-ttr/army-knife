import type { ToolId } from "../catalog";

export interface ClassifierInfo {
  bytes: number;
  features: number;
  weightBytes: number;
  loadingMs: number;
}
type Response =
  | ({ type: "ready" } & ClassifierInfo)
  | { type: "ranked"; id: number; ranks: ToolId[]; inferenceMs: number }
  | { type: "error"; id?: number; message: string };

/** Creates a worker only after a user opts in to enhanced local search. */
export class ClassifierClient {
  private worker: Worker | null = null;
  private initialization: Promise<ClassifierInfo> | null = null;
  private resolveReady: ((value: ClassifierInfo) => void) | null = null;
  private rejectReady: ((error: Error) => void) | null = null;
  private pending = new Map<number, { resolve(value: ToolId[]): void; reject(error: Error): void }>();
  private sequence = 0;

  load(): Promise<ClassifierInfo> {
    if (!this.initialization) {
      this.initialization = new Promise<ClassifierInfo>((resolve, reject) => {
        this.resolveReady = resolve;
        this.rejectReady = reject;
        try {
          const worker = new Worker(new URL("./classifier.worker.ts", import.meta.url), {
            type: "module",
            name: "army-knife-classifier",
          });
          this.worker = worker;
          worker.onmessage = (event: MessageEvent<Response>) => {
            const message = event.data;
            if (message.type === "ready") {
              this.resolveReady?.(message);
              this.resolveReady = null;
              this.rejectReady = null;
            } else if (message.type === "ranked") {
              const job = this.pending.get(message.id);
              this.pending.delete(message.id);
              job?.resolve(message.ranks);
            } else if (message.type === "error") {
              const error = new Error(message.message);
              if (message.id === undefined) this.abort(error);
              else {
                this.pending.get(message.id)?.reject(error);
                this.pending.delete(message.id);
              }
            }
          };
          worker.onerror = () => this.abort(new Error("Classifier Worker failed."));
          worker.postMessage({ type: "init" });
        } catch (error) {
          this.abort(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
    return this.initialization;
  }

  async rank(query: string): Promise<ToolId[]> {
    await this.load();
    if (!this.worker) throw new Error("Classifier has been stopped.");
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      this.pending.set(id, { resolve, reject });
      try {
        this.worker?.postMessage({ type: "rank", id, query: query.slice(0, 150) });
      } catch (error) {
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private abort(error: Error) {
    this.rejectReady?.(error);
    this.resolveReady = null;
    this.rejectReady = null;
    for (const job of this.pending.values()) job.reject(error);
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
    this.initialization = null;
  }

  stop(): void {
    this.abort(new Error("Classifier disabled."));
  }
}
