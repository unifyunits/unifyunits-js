export type ConversionInput = {
  value: string;
  from: string;
  to: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  request_id: string;
  details?: { candidates: string[] };
};

export class UnifyUnitsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly requestId?: string,
    public readonly details?: { candidates: string[] },
  ) {
    super(message);
    this.name = "UnifyUnitsApiError";
  }
}

export type ClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

export class UnifyUnits {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://api.unifyunits.com").replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetcher = options.fetch ?? fetch;
  }

  convert(input: ConversionInput): Promise<Record<string, unknown>> {
    return this.request("/v1/convert", { method: "POST", body: JSON.stringify(input), auth: true });
  }

  convertBatch(conversions: ConversionInput[]): Promise<Record<string, unknown>> {
    if (conversions.length === 0) throw new TypeError("At least one conversion is required");
    return this.request("/v1/batch", { method: "POST", body: JSON.stringify({ conversions }), auth: true });
  }

  categories(): Promise<Record<string, unknown>> { return this.request("/v1/categories"); }
  category(category: string): Promise<Record<string, unknown>> { return this.request(`/v1/categories/${encodeURIComponent(category)}`); }
  units(category?: string): Promise<Record<string, unknown>> {
    const query = category === undefined ? "" : `?category=${encodeURIComponent(category)}`;
    return this.request(`/v1/units${query}`);
  }
  unit(unit: string): Promise<Record<string, unknown>> { return this.request(`/v1/units/${encodeURIComponent(unit)}`); }
  health(): Promise<Record<string, unknown>> { return this.request("/v1/health"); }

  private async request(
    path: string,
    options: { method?: string; body?: string; auth?: boolean } = {},
  ): Promise<Record<string, unknown>> {
    const headers = new Headers({ Accept: "application/json" });
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    if (options.auth && this.apiKey) headers.set("Authorization", `Bearer ${this.apiKey}`);
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      const error = (payload.error ?? {}) as ApiErrorBody;
      throw new UnifyUnitsApiError(
        error.message ?? `UnifyUnits API returned HTTP ${response.status}`,
        response.status,
        error.code,
        error.request_id ?? response.headers.get("X-Request-Id") ?? undefined,
        error.details,
      );
    }
    return payload;
  }
}
