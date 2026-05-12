import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InspectionCreatePage from "../pages/inspections/InspectionCreatePage.jsx";
import InspectionDetailPage from "../pages/inspections/InspectionDetailPage.jsx";
import InspectionListPage from "../pages/inspections/InspectionListPage.jsx";
import {
  addInspectionRoom,
  addManualDefect,
  changeInspectionStatus,
  createInspection,
  deleteManualDefect,
  getInspection,
  listInspections,
  updateInspectionRoom,
  updateManualDefect,
  uploadInspectionRoomImage
} from "../services/inspectionApi.js";
import { listUsers } from "../services/userApi.js";

const mockAuth = vi.hoisted(() => ({
  user: {
    id: "user-1",
    name: "Inspector",
    role: "user"
  }
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: mockAuth.user
  })
}));

vi.mock("../services/inspectionApi.js", () => ({
  addInspectionRoom: vi.fn(),
  addManualDefect: vi.fn(),
  changeInspectionStatus: vi.fn(),
  createInspection: vi.fn(),
  deleteManualDefect: vi.fn(),
  getInspection: vi.fn(),
  listInspections: vi.fn(),
  updateInspectionRoom: vi.fn(),
  updateManualDefect: vi.fn(),
  uploadInspectionRoomImage: vi.fn()
}));

vi.mock("../services/userApi.js", () => ({
  listUsers: vi.fn()
}));

const inspection = {
  id: "inspection-1",
  assignedToUserId: {
    email: "alex@example.com",
    id: "user-2",
    name: "Alex Inspector"
  },
  client: {
    email: "client@example.com",
    name: "Client Name",
    phone: "0161 000 0000"
  },
  createdAt: "2026-05-12T10:00:00.000Z",
  propertyRef: {
    address: "12 Castle Road",
    postcode: "M1 1AA"
  },
  rooms: [
    {
      id: "room-1",
      defects: [
        {
          id: "defect-1",
          imageUrl: "/uploads/inspections/inspection-1.png",
          notes: "Ceiling crack",
          severity: "high",
          type: "crack"
        }
      ],
      mediaUrls: ["/uploads/inspections/inspection-1.png"],
      name: "Kitchen",
      notes: "Check sink wall."
    }
  ],
  status: "draft",
  summary: {
    high: 1,
    low: 0,
    medium: 0,
    totalDefects: 1
  }
};

const listResponse = {
  data: {
    data: {
      inspections: [inspection],
      pagination: {
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1
      }
    }
  }
};

const inspectionResponse = (nextInspection = inspection) => ({
  data: {
    data: {
      inspection: nextInspection
    }
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.user = {
    id: "user-1",
    name: "Inspector",
    role: "user"
  };
  listInspections.mockResolvedValue(listResponse);
  listUsers.mockResolvedValue({ data: { data: { users: [] } } });
});

describe("inspection frontend pages", () => {
  it("renders the inspection list and applies filters", async () => {
    render(
      <MemoryRouter>
        <InspectionListPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("12 Castle Road")).toBeInTheDocument();
    expect(screen.getByText("Alex Inspector")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "M1" }
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "draft" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(listInspections).toHaveBeenLastCalledWith({
        limit: 20,
        page: 1,
        search: "M1",
        status: "draft"
      });
    });
  });

  it("submits a user inspection create form without assignment fields", async () => {
    createInspection.mockResolvedValue(inspectionResponse());

    render(
      <MemoryRouter>
        <InspectionCreatePage />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText("Assigned user")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: "44 Market Street" }
    });
    fireEvent.change(screen.getByLabelText("Postcode"), {
      target: { value: "M2 2AA" }
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "buyer@example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create inspection" }));

    await waitFor(() => {
      expect(createInspection).toHaveBeenCalledWith({
        client: {
          email: "buyer@example.com"
        },
        propertyRef: {
          address: "44 Market Street",
          postcode: "M2 2AA"
        }
      });
    });
  });

  it("renders inspection detail rooms, media, defects, and status transition", async () => {
    getInspection.mockResolvedValue(inspectionResponse());
    changeInspectionStatus.mockResolvedValue(
      inspectionResponse({
        ...inspection,
        status: "in_progress"
      })
    );

    render(
      <MemoryRouter initialEntries={["/inspections/inspection-1"]}>
        <Routes>
          <Route path="/inspections/:id" element={<InspectionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "12 Castle Road" })).toBeInTheDocument();
    expect(screen.getByText("Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Ceiling crack")).toBeInTheDocument();
    expect(screen.getByTitle("Room image 1")).toHaveAttribute(
      "src",
      "http://localhost:5001/uploads/inspections/inspection-1.png"
    );

    fireEvent.click(screen.getByRole("button", { name: "Change status" }));

    await waitFor(() => {
      expect(changeInspectionStatus).toHaveBeenCalledWith("inspection-1", {
        status: "in_progress"
      });
    });
  });
});
