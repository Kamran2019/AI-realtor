import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RoomCapturePanel from "../../components/inspections/RoomCapturePanel.jsx";
import FormError from "../../components/ui/FormError.jsx";
import {
  addInspectionRoom,
  addManualDefect,
  changeInspectionStatus,
  deleteManualDefect,
  getInspection,
  updateInspectionRoom,
  updateManualDefect,
  uploadInspectionRoomImage
} from "../../services/inspectionApi.js";

const nextStatusesByStatus = {
  archived: [],
  completed: ["archived"],
  draft: ["in_progress", "archived"],
  in_progress: ["completed", "archived"]
};

const statusLabels = {
  archived: "Archived",
  completed: "Completed",
  draft: "Draft",
  in_progress: "In progress"
};

const formatAssignedUser = (inspection) => {
  const assignedUser = inspection?.assignedToUserId;

  if (!assignedUser) {
    return "Unassigned";
  }

  return typeof assignedUser === "string" ? assignedUser : assignedUser.name || assignedUser.email || assignedUser.id;
};

const InspectionDetailPage = () => {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: "", notes: "" });
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const nextStatuses = useMemo(
    () => nextStatusesByStatus[inspection?.status] || [],
    [inspection?.status]
  );

  useEffect(() => {
    let isMounted = true;

    const loadInspection = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getInspection(id);

        if (isMounted) {
          const loadedInspection = response.data.data.inspection;

          setInspection(loadedInspection);
          setSelectedStatus((nextStatusesByStatus[loadedInspection.status] || [])[0] || "");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || "Inspection could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInspection();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    setSelectedStatus(nextStatuses[0] || "");
  }, [nextStatuses]);

  const setInspectionFromResponse = (response) => {
    setInspection(response.data.data.inspection);
    setStatusMessage("Inspection updated.");
  };

  const runMutation = async (mutation, fallbackMessage) => {
    setError("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      await mutation();
    } catch (mutationError) {
      setError(mutationError.response?.data?.message || fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoomFormChange = (event) => {
    const { name, value } = event.target;

    setRoomForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleAddRoom = (event) => {
    event.preventDefault();

    runMutation(async () => {
      const response = await addInspectionRoom(id, {
        name: roomForm.name,
        notes: roomForm.notes
      });

      setInspectionFromResponse(response);
      setRoomForm({ name: "", notes: "" });
    }, "Room could not be added.");
  };

  const handleUpdateRoom = (roomId, payload) =>
    runMutation(async () => {
      const response = await updateInspectionRoom(id, roomId, payload);

      setInspectionFromResponse(response);
    }, "Room could not be updated.");

  const handleImageUpload = (inspectionId, roomId, file) =>
    runMutation(async () => {
      const response = await uploadInspectionRoomImage(inspectionId, roomId, file);

      setInspection(response.data.data.inspection);
      setStatusMessage("Image uploaded.");
    }, "Image could not be uploaded.");

  const handleAddDefect = (roomId, payload) =>
    runMutation(async () => {
      const response = await addManualDefect(id, roomId, payload);

      setInspectionFromResponse(response);
    }, "Manual defect could not be added.");

  const handleUpdateDefect = (roomId, defectId, payload) =>
    runMutation(async () => {
      const response = await updateManualDefect(id, roomId, defectId, payload);

      setInspectionFromResponse(response);
    }, "Manual defect could not be updated.");

  const handleDeleteDefect = (roomId, defectId) =>
    runMutation(async () => {
      const response = await deleteManualDefect(id, roomId, defectId);

      setInspectionFromResponse(response);
    }, "Manual defect could not be deleted.");

  const handleAIDetectionComplete = (result) => {
    if (result.inspection) {
      setInspection(result.inspection);
    }

    setStatusMessage("AI detection completed.");
  };

  const handleStatusSubmit = (event) => {
    event.preventDefault();

    if (!selectedStatus) {
      return;
    }

    runMutation(async () => {
      const response = await changeInspectionStatus(id, { status: selectedStatus });

      setInspectionFromResponse(response);
    }, "Inspection status could not be updated.");
  };

  if (isLoading) {
    return <p>Loading inspection...</p>;
  }

  if (!inspection) {
    return (
      <section className="inspection-detail-page">
        <FormError>{error}</FormError>
        <Link to="/inspections">Back to inspections</Link>
      </section>
    );
  }

  return (
    <section className="inspection-detail-page" aria-labelledby="inspection-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Inspection</p>
          <h1 id="inspection-title">{inspection.propertyRef?.address || "Inspection detail"}</h1>
          <p>{inspection.propertyRef?.postcode || "No postcode recorded"}</p>
        </div>
        <Link to="/inspections">Back to inspections</Link>
      </div>

      <div className="inspection-summary-grid">
        <div className="metric-card">
          <h2>Status</h2>
          <strong>{statusLabels[inspection.status] || inspection.status}</strong>
        </div>
        <div className="metric-card">
          <h2>Total defects</h2>
          <strong>{inspection.summary?.totalDefects || 0}</strong>
        </div>
        <div className="metric-card severity-card high">
          <h2>High</h2>
          <strong>{inspection.summary?.high || 0}</strong>
        </div>
        <div className="metric-card severity-card medium">
          <h2>Medium</h2>
          <strong>{inspection.summary?.medium || 0}</strong>
        </div>
        <div className="metric-card severity-card low">
          <h2>Low</h2>
          <strong>{inspection.summary?.low || 0}</strong>
        </div>
      </div>

      <div className="inspection-meta-grid">
        <section>
          <h2>Property</h2>
          <dl>
            <dt>Address</dt>
            <dd>{inspection.propertyRef?.address || "Not recorded"}</dd>
            <dt>Postcode</dt>
            <dd>{inspection.propertyRef?.postcode || "Not recorded"}</dd>
            <dt>Assigned</dt>
            <dd>{formatAssignedUser(inspection)}</dd>
          </dl>
        </section>
        <section>
          <h2>Client</h2>
          <dl>
            <dt>Name</dt>
            <dd>{inspection.client?.name || "Not recorded"}</dd>
            <dt>Email</dt>
            <dd>{inspection.client?.email || "Not recorded"}</dd>
            <dt>Phone</dt>
            <dd>{inspection.client?.phone || "Not recorded"}</dd>
          </dl>
        </section>
        <section>
          <h2>Status</h2>
          <form className="status-form" onSubmit={handleStatusSubmit}>
            <select disabled={isSubmitting || !nextStatuses.length} onChange={(event) => setSelectedStatus(event.target.value)} value={selectedStatus}>
              {nextStatuses.length ? (
                nextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status] || status}
                  </option>
                ))
              ) : (
                <option value="">No transitions</option>
              )}
            </select>
            <button className="primary-button" disabled={isSubmitting || !selectedStatus} type="submit">
              Change status
            </button>
          </form>
        </section>
      </div>

      <FormError>{error}</FormError>
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

      <form className="add-room-form" onSubmit={handleAddRoom}>
        <h2>Add room</h2>
        <label>
          Room name
          <input disabled={isSubmitting} maxLength="80" name="name" onChange={handleRoomFormChange} required value={roomForm.name} />
        </label>
        <label>
          Notes
          <textarea disabled={isSubmitting} maxLength="3000" name="notes" onChange={handleRoomFormChange} rows="2" value={roomForm.notes} />
        </label>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          Add room
        </button>
      </form>

      <div className="rooms-stack">
        {inspection.rooms?.length ? (
          inspection.rooms.map((room) => (
            <RoomCapturePanel
              inspectionId={inspection.id}
              isSubmitting={isSubmitting}
              key={room.id || room._id}
              onAddDefect={handleAddDefect}
              onAIDetectionComplete={handleAIDetectionComplete}
              onDeleteDefect={handleDeleteDefect}
              onImageUpload={handleImageUpload}
              onUpdateDefect={handleUpdateDefect}
              onUpdateRoom={handleUpdateRoom}
              room={room}
            />
          ))
        ) : (
          <p className="empty-state">No rooms added yet.</p>
        )}
      </div>
    </section>
  );
};

export default InspectionDetailPage;
