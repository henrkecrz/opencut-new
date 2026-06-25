import type {
  AIBackendStatus,
  AIErrorType,
  CommandRequest,
  CommandResult,
  ServicesHealth,
  TranscriptionResult,
} from "@opencut-studio/ai-types";

export interface AIClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  healthTimeoutMs?: number;
  requestTimeoutMs?: number;
  llmTimeoutMs?: number;
}

export class AIClientError extends Error {
  readonly errorType: AIErrorType;
  readonly statusCode?: number;

  constructor(message: string, errorType: AIErrorType, statusCode?: number) {
    super(message);
    this.name = "AIClientError";
    this.errorType = errorType;
    this.statusCode = statusCode;
  }
}

const DEFAULT_BASE_URL = "http://localhost:8420";
const DEFAULT_HEALTH_TIMEOUT_MS = 5_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_LLM_TIMEOUT_MS = 600_000;

function getViteEnvBaseUrl(): string | undefined {
  try {
    const meta = import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    };
    return meta.env?.VITE_AI_BACKEND_URL;
  } catch {
    return undefined;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function classifyError(error: unknown): { message: string; errorType: AIErrorType } {
  if (error instanceof AIClientError) {
    return { message: error.message, errorType: error.errorType };
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      message: "Request timed out. The AI backend may be overloaded or starting up.",
      errorType: "timeout",
    };
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      message: "Cannot connect to AI backend. Make sure it is running.",
      errorType: "connection_refused",
    };
  }

  const message = error instanceof Error ? error.message : "An unknown error occurred";

  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("ERR_CONNECTION_REFUSED") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND")
  ) {
    return {
      message: "Cannot connect to AI backend. Make sure it is running on the correct port.",
      errorType: "connection_refused",
    };
  }

  return { message, errorType: "unknown" };
}

export class AIClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly healthTimeoutMs: number;
  private readonly requestTimeoutMs: number;
  private readonly llmTimeoutMs: number;

  constructor(options: AIClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl || getViteEnvBaseUrl() || DEFAULT_BASE_URL,
    );
    this.fetcher = options.fetcher || fetch;
    this.healthTimeoutMs = options.healthTimeoutMs || DEFAULT_HEALTH_TIMEOUT_MS;
    this.requestTimeoutMs = options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
    this.llmTimeoutMs = options.llmTimeoutMs || DEFAULT_LLM_TIMEOUT_MS;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async health(): Promise<AIBackendStatus> {
    return this.request<AIBackendStatus>("/health", {}, this.healthTimeoutMs);
  }

  async servicesHealth(): Promise<ServicesHealth> {
    return this.request<ServicesHealth>("/services/health", {}, this.healthTimeoutMs);
  }

  async transcribe(file: File, language?: string): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append("file", file);

    if (language) {
      formData.append("language", language);
    }

    return this.requestFormData<TranscriptionResult>("/api/transcribe", formData);
  }

  async command(request: CommandRequest): Promise<CommandResult> {
    return this.requestWithKeepalive<CommandResult>(
      "/api/llm/command",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      this.llmTimeoutMs,
    );
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = this.requestTimeoutMs,
  ): Promise<T> {
    const response = await this.fetchWithTimeout(endpoint, options, timeoutMs, true);
    return response.json() as Promise<T>;
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData,
    timeoutMs: number = this.requestTimeoutMs,
  ): Promise<T> {
    const response = await this.fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        body: formData,
      },
      timeoutMs,
      false,
    );

    return response.json() as Promise<T>;
  }

  private async requestWithKeepalive<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = this.requestTimeoutMs,
  ): Promise<T> {
    const response = await this.fetchWithTimeout(endpoint, options, timeoutMs, true);

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    if (!response.body) {
      throw new AIClientError("Empty response body", "backend_error");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as {
              ping?: boolean;
              result?: T;
              error?: string;
            };

            if (data.ping) continue;

            if (data.error) {
              throw new AIClientError(data.error, "backend_error");
            }

            if (data.result !== undefined) {
              return data.result;
            }
          } catch (error) {
            if (error instanceof AIClientError) throw error;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    throw new AIClientError("Stream ended without result", "backend_error");
  }

  private async fetchWithTimeout(
    endpoint: string,
    options: RequestInit,
    timeoutMs: number,
    includeJsonHeader: boolean,
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = new Headers(options.headers);

      if (includeJsonHeader && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await this.fetcher(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new AIClientError(
          `AI Backend error (${response.status}): ${errorBody}`,
          response.status >= 500 ? "backend_error" : "network_error",
          response.status,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof AIClientError) throw error;
      const classified = classifyError(error);
      throw new AIClientError(classified.message, classified.errorType);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function createAIClient(options: AIClientOptions = {}): AIClient {
  return new AIClient(options);
}

export const aiClient = createAIClient();
