import { useState } from "react";
import { getAssetUrl } from "../../services/apiClient.js";
import AIDetectButton from "./AIDetectButton.jsx";
import CameraCapture from "./CameraCapture.jsx";
import DefectList from "./DefectList.jsx";
import ManualDefectForm from "./ManualDefectForm.jsx";

const RoomCapturePanel = ({
  inspectionId,
  isSubmitting = false,
  onAddDefect,
  onAIDetectionComplete,
  onDeleteDefect,
  onImageUpload,
  onUpdateDefect,
  onUpdateRoom,
  room
}) => {
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: room.name || "",
    notes: room.notes || ""
  });

  const roomId = room.id || room._id;
  const defects = room.defects || [];

  const getDefectsForImage = (imageUrl) =>
    defects.filter((defect) => defect.imageUrl === imageUrl);

  const handleRoomChange = (event) => {
    const { name, value } = event.target;

    setRoomForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleRoomSubmit = async (event) => {
    event.preventDefault();
    await onUpdateRoom(roomId, roomForm);
    setIsEditingRoom(false);
  };

  return (
    <article className="room-panel">
      <div className="room-panel-header">
        {isEditingRoom ? (
          <form className="room-edit-form" onSubmit={handleRoomSubmit}>
            <label>
              Room name
              <input
                disabled={isSubmitting}
                maxLength="80"
                name="name"
                onChange={handleRoomChange}
                required
                value={roomForm.name}
              />
            </label>
            <label>
              Notes
              <textarea
                disabled={isSubmitting}
                maxLength="3000"
                name="notes"
                onChange={handleRoomChange}
                rows="2"
                value={roomForm.notes}
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" disabled={isSubmitting} type="submit">
                Save room
              </button>
              <button
                className="secondary-button"
                disabled={isSubmitting}
                onClick={() => setIsEditingRoom(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div>
              <h2>{room.name}</h2>
              {room.notes ? <p>{room.notes}</p> : null}
            </div>
            <button className="secondary-button" onClick={() => setIsEditingRoom(true)} type="button">
              Edit room
            </button>
          </>
        )}
      </div>

      <div className="room-media-section">
        <CameraCapture disabled={isSubmitting} onCapture={(file) => onImageUpload(inspectionId, roomId, file)} />
        {room.mediaUrls?.length ? (
          <div className="room-media-grid">
            {room.mediaUrls.map((url, index) => (
              <article className="room-media-item" key={`${url}-${index}`}>
                <img alt="" src={getAssetUrl(url)} title={`Room image ${index + 1}`} />
                <AIDetectButton
                  disabled={isSubmitting}
                  imageIndex={index}
                  inspectionId={inspectionId}
                  onDetectionComplete={onAIDetectionComplete}
                  roomId={roomId}
                />
                <div className="image-defect-links">
                  <strong>Linked defects</strong>
                  {getDefectsForImage(url).length ? (
                    <ul>
                      {getDefectsForImage(url).map((defect) => (
                        <li key={defect.id || defect._id}>
                          {defect.type} - {defect.severity}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No linked defects.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No room images yet.</p>
        )}
      </div>

      <div className="room-defects-section">
        <h3>Defects</h3>
        <ManualDefectForm
          isSubmitting={isSubmitting}
          mediaUrls={room.mediaUrls || []}
          onSubmit={(payload) => onAddDefect(roomId, payload)}
        />
        <DefectList
          defects={defects}
          isSubmitting={isSubmitting}
          mediaUrls={room.mediaUrls || []}
          onDelete={(defectId) => onDeleteDefect(roomId, defectId)}
          onUpdate={(defectId, payload) => onUpdateDefect(roomId, defectId, payload)}
        />
      </div>
    </article>
  );
};

export default RoomCapturePanel;
