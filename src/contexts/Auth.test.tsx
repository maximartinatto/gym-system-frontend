import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "./Auth";
import { useAuth } from "./auth-context";
import { api, ApiError } from "../api";

vi.mock("../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api")>()),
  api: vi.fn(),
  setApiToken: vi.fn(),
}));
const mockApi = vi.mocked(api);
const token = () =>
  `a.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.c`;
const profile = {
  id: 1,
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@gym.test",
  role: "MEMBER",
  active: true,
};
const session = () => ({
  token: token(),
  userId: 1,
  email: profile.email,
  tokenType: "Bearer",
  role: "MEMBER",
});
function Probe() {
  const auth = useAuth();
  return (
    <>
      <div data-testid="state">
        {auth.restoring
          ? "restoring"
          : auth.restoreError
            ? "error"
            : auth.user
              ? `${auth.user.firstName}:${auth.user.role}`
              : "anonymous"}
      </div>
      <button
        onClick={() => void auth.login(profile.email, "test-only-password")}
      >
        login
      </button>
      <button onClick={auth.logout}>logout</button>
      <button onClick={auth.retryRestore}>retry</button>
    </>
  );
}
describe("session lifecycle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockApi.mockReset();
  });
  it("signs in and clears tab storage when signing out", async () => {
    mockApi.mockResolvedValueOnce(session()).mockResolvedValueOnce(profile);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByText("login"));
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ana:MEMBER"),
    );
    expect(sessionStorage.getItem("gymsistem.session")).not.toBeNull();
    fireEvent.click(screen.getByText("logout"));
    expect(screen.getByTestId("state")).toHaveTextContent("anonymous");
    expect(sessionStorage.getItem("gymsistem.session")).toBeNull();
  });
  it("restores the profile and uses its current role for navigation", async () => {
    sessionStorage.setItem("gymsistem.session", JSON.stringify(session()));
    mockApi.mockResolvedValue({ ...profile, role: "TRAINER" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ana:TRAINER"),
    );
  });
  it("retains a session after a service outage and can retry restoration", async () => {
    sessionStorage.setItem("gymsistem.session", JSON.stringify(session()));
    mockApi
      .mockRejectedValueOnce(new ApiError(503, "Unavailable"))
      .mockResolvedValueOnce(profile);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("error"),
    );
    expect(sessionStorage.getItem("gymsistem.session")).not.toBeNull();
    fireEvent.click(screen.getByText("retry"));
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ana:MEMBER"),
    );
  });
  it("discards invalid persisted tokens without calling private endpoints", () => {
    sessionStorage.setItem("gymsistem.session", '{"token":"malformed"}');
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId("state")).toHaveTextContent("anonymous");
    expect(mockApi).not.toHaveBeenCalled();
  });
});
