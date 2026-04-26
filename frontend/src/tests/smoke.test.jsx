import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App.jsx";

const renderWithRoute = (initialEntry = "/") => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );
};

describe("app routing", () => {
  it("renders the app name", () => {
    renderWithRoute();

    expect(screen.getAllByText("AI Realtor")[0]).toBeInTheDocument();
  });

  it("renders the not found page for unknown routes", () => {
    renderWithRoute("/missing-page");

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});
