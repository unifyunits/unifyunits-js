import { describe, expect, it, vi } from "vitest";
import { UnifyUnits, UnifyUnitsApiError } from "../src/index.js";

describe("UnifyUnits", () => {
  it("sends decimal strings with bearer authentication", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Response(JSON.stringify({ data: { result: { value: "1", unit: "km" } } }), { status: 200 }),
    );
    const client = new UnifyUnits({ apiKey: "test-key", baseUrl: "https://api.test/", fetch: fetcher });
    const result = await client.convert({ value: "1000", from: "m", to: "km" });
    expect(result.data).toBeDefined();
    expect(fetcher.mock.calls[0][0]).toBe("https://api.test/v1/convert");
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer test-key");
    expect(fetcher.mock.calls[0][1]?.body).toBe('{"value":"1000","from":"m","to":"km"}');
  });

  it("rejects empty batches", () => {
    const client = new UnifyUnits();
    expect(() => client.convertBatch([])).toThrow(TypeError);
  });

  it("exposes structured API errors", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: {
      code: "UNKNOWN_UNIT", message: "Unknown unit", request_id: "req-1",
    } }), { status: 400 }));
    const client = new UnifyUnits({ apiKey: "test-key", baseUrl: "https://api.test", fetch: fetcher });
    await expect(client.convert({ value: "1", from: "bad", to: "m" })).rejects.toMatchObject<Partial<UnifyUnitsApiError>>({
      name: "UnifyUnitsApiError", status: 400, errorCode: "UNKNOWN_UNIT", requestId: "req-1",
    });
  });
});
