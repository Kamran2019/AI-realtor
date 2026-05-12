import { useState } from "react";
import { getAssetUrl } from "../../services/apiClient.js";
import ManualDefectForm from "./ManualDefectForm.jsx";

const typeLabels = {
  crack: "Crack",
  damp: "Damp",
  manual_other: "Other",
  mould: "Mould",
  peeling_paint: "Peeling paint",
  poor_finish: "Poor finish",
  stain: "Stain",
  structural_issue: "Structural issue",
  tile_damage: "Tile damage",
  wall_hole: "Wall hole",
  water_seepage: "Water seepage"
};

const DefectList = ({ defects = [], isSubmitting = false, mediaUrls = [], onDelete, onUpdate }) => {
  const [editingDefectId, setEditingDefectId] = useState(null);

  if (!defects.length) {
    return <p className="empty-state">No defects logged for this room.</p>;
  }

  return (
    <div className="defect-list">
      {defects.map((defect) => (
        <article className="defect-item" key={defect.id || defect._id}>
          {editingDefectId === (defect.id || defect._id) ? (
            <ManualDefectForm
              defect={defect}
              isSubmitting={isSubmitting}
              mediaUrls={mediaUrls}
              onCancel={() => setEditingDefectId(null)}
              onSubmit={async (payload) => {
                await onUpdate(defect.id || defect._id, payload);
                setEditingDefectId(null);
              }}
              submitLabel="Save defect"
            />
          ) : (
            <>
              <div className="defect-item-header">
                <div>
                  <strong>{typeLabels[defect.type] || defect.type}</strong>
                  <span className={`status-pill severity-${defect.severity}`}>{defect.severity}</span>
                </div>
                <div className="table-actions">
                  <button
                    className="text-button"
                    disabled={isSubmitting}
                    onClick={() => setEditingDefectId(defect.id || defect._id)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="text-button danger"
                    disabled={isSubmitting}
                    onClick={() => onDelete(defect.id || defect._id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {defect.imageUrl ? (
                <img alt="" className="defect-thumb" src={getAssetUrl(defect.imageUrl)} />
              ) : null}
              {defect.notes ? <p className="defect-notes">{defect.notes}</p> : null}
            </>
          )}
        </article>
      ))}
    </div>
  );
};

export default DefectList;
