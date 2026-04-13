import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

export default function InspectionDetailPage() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [roomName, setRoomName] = useState("Living Room");
  const [files, setFiles] = useState([]);
  const [recommendations, setRecommendations] = useState("");

  const loadInspection = () => {
    api.get(`/inspections/${id}`).then((response) => {
      setInspection(response.data.inspection);
      setRecommendations((response.data.inspection.recommendations || []).join("\n"));
    });
  };

  useEffect(() => {
    loadInspection();
  }, [id]);

  const uploadImages = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("roomName", roomName);
    Array.from(files).forEach((file) => formData.append("images", file));
    await api.post(`/inspections/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setFiles([]);
    loadInspection();
  };

  const runAi = async () => {
    await api.post(`/inspections/${id}/ai-detect`);
    loadInspection();
  };

  const finalize = async () => {
    await api.post(`/inspections/${id}/finalize`, {
      recommendations: recommendations
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    loadInspection();
  };

  const generateReport = async () => {
    await api.post(`/inspections/${id}/generate-report`);
    loadInspection();
  };

  if (!inspection) {
    return <div className="text-white/60">Loading inspection...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inspection Detail"
        title={inspection.propertyRef?.address || "Inspection"}
        description={`${inspection.propertyRef?.postcode || "No postcode"} | ${inspection.status}`}
        actions={
          <div className="flex gap-3">
            <button type="button" className="button-secondary" onClick={runAi}>
              Run AI detect
            </button>
            <button type="button" className="button-primary" onClick={generateReport}>
              Generate report
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <div className="space-y-6">
          <form className="panel p-6" onSubmit={uploadImages}>
            <h2 className="font-display text-2xl text-sand-50">Room capture</h2>
            <div className="mt-5 space-y-4">
              <input className="field" placeholder="Room name" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
              <input className="field" type="file" multiple accept="image/*" capture="environment" onChange={(e) => setFiles(e.target.files)} />
              <button type="submit" className="button-primary">
                Upload photos
              </button>
            </div>
          </form>

          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Recommendations</h2>
            <textarea className="field mt-4 min-h-40" value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
            <button type="button" className="button-secondary mt-4" onClick={finalize}>
              Finalize inspection
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/65">
              <Summary value={inspection.summary?.totalDefects || 0} label="Total" />
              <Summary value={inspection.summary?.criticalCount || 0} label="Critical" />
              <Summary value={inspection.summary?.highCount || 0} label="High" />
              <Summary value={inspection.summary?.mediumCount || 0} label="Medium" />
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Rooms and defects</h2>
            <div className="mt-4 space-y-4">
              {(inspection.rooms || []).map((room) => (
                <div key={room.name} className="panel-soft p-4">
                  <div className="text-lg font-semibold text-sand-50">{room.name}</div>
                  <div className="mt-2 text-sm text-white/55">{room.photos?.length || 0} photos</div>
                  <div className="mt-3 space-y-2">
                    {(room.defects || []).map((defect, index) => (
                      <div key={`${room.name}-${index}`} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/65">
                        <div className="font-semibold text-sand-50">{defect.title || defect.type}</div>
                        <div className="mt-1">Severity: {defect.severity}</div>
                        <div>Confidence: {Math.round((defect.confidence || 0) * 100)}%</div>
                        <div className="mt-1">{defect.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!inspection.rooms?.length ? <div className="text-sm text-white/50">Upload room photos to begin detection.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ value, label }) {
  return (
    <div className="panel-soft px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-sand-50">{value}</div>
    </div>
  );
}

