import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App.jsx";

vi.mock("../services/authApi.js", () => ({
  forgotPassword: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  logoutSession: vi.fn(),
  refreshSession: vi.fn(() => Promise.reject(new Error("No active session"))),
  resendVerification: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  signup: vi.fn()
}));

const renderWithRoute = (initialEntry = "/") => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );
};

describe("app routing", () => {
  it("renders the app name", async () => {
    renderWithRoute();

    expect((await screen.findAllByText("AI Realtor"))[0]).toBeInTheDocument();
  });

  it("renders the not found page for unknown routes", async () => {
    renderWithRoute("/missing-page");

    expect(await screen.findByText("Page not found")).toBeInTheDocument();
  });

  it("renders the login page", async () => {
    renderWithRoute("/login");

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("renders the forgot password page", async () => {
    renderWithRoute("/forgot-password");

    expect(await screen.findByRole("heading", { name: "Forgot password" })).toBeInTheDocument();
  });
});
