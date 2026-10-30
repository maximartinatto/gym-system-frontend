import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, setApiToken } from "./api";

describe("API client", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    setApiToken(null);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());
  it("transmits the bearer and JSON body to the configured local API", async () => {
    setApiToken("signed-token");
    fetchMock.mockResolvedValue(new Response('{"id":7}', { status: 200 }));
    expect(
      await api("/users", { method: "POST", body: '{"name":"Ana"}' }),
    ).toEqual({ id: 7 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/users");
    expect(options.headers.get("Authorization")).toBe("Bearer signed-token");
    expect(options.headers.get("Content-Type")).toBe("application/json");
  });
  it("accepts empty successful deletion responses", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await api("/users/7", { method: "DELETE" })).toBeUndefined();
  });
  it("expires an authenticated session on 401", async () => {
    const event = vi.fn();
    window.addEventListener("gym:unauthorized", event);
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(api("/users/me")).rejects.toMatchObject({ status: 401 });
    expect(event).toHaveBeenCalledOnce();
    window.removeEventListener("gym:unauthorized", event);
  });
  it("does not expire a session on bad login credentials or a forbidden resource", async () => {
    const event = vi.fn();
    window.addEventListener("gym:unauthorized", event);
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 403 }));
    await expect(api("/auth/login", { method: "POST" })).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(api("/payments")).rejects.toMatchObject({ status: 403 });
    expect(event).not.toHaveBeenCalled();
    window.removeEventListener("gym:unauthorized", event);
  });
  it("preserves business validation messages and hides proxy HTML", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('{"message":"La membresía no pertenece al usuario"}', {
          status: 400,
        }),
      )
      .mockResolvedValueOnce(
        new Response("<html>internal proxy error</html>", { status: 503 }),
      );
    await expect(api("/payments")).rejects.toThrow(
      "La membresía no pertenece al usuario",
    );
    await expect(api("/routines")).rejects.toThrow(
      "El servicio no está disponible",
    );
  });
  it("supports aborted searches without showing a connection error", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    await expect(api("/users/search")).rejects.toMatchObject({
      name: "AbortError",
    });
  });
  it("reports lost connections as a recoverable application error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api("/users")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("No pudimos conectar"),
    });
  });
});
