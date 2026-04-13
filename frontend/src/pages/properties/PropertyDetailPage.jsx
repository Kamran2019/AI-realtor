import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { currency, shortDate } from "../../utils/format";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [noteText, setNoteText] = useState("");

  const loadProperty = () => {
    api.get(`/properties/${id}`).then((response) => setData(response.data));
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  const toggleBookmark = async () => {
    await api.post("/bookmarks/toggle", { propertyId: id });
    loadProperty();
  };

  const addNote = async (event) => {
    event.preventDefault();
    await api.post("/notes", {
      propertyId: id,
      text: noteText,
    });
    setNoteText("");
    loadProperty();
  };

  const generatePdf = async () => {
    await api.post(`/properties/${id}/generate-pdf`);
    loadProperty();
  };

  if (!data) {
    return <div className="text-white/60">Loading property...</div>;
  }

  const property = data.property;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Property Detail"
        title={property.address}
        description={`${property.postcode || "Unknown postcode"} | ${property.sourceKey}`}
        actions={
          <div className="flex gap-3">
            <button type="button" className="button-secondary" onClick={toggleBookmark}>
              {data.bookmarked ? "Remove bookmark" : "Save listing"}
            </button>
            <button type="button" className="button-primary" onClick={generatePdf}>
              Generate PDF
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <div className="space-y-6">
          <div className="panel grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Guide price" value={currency(property.guidePrice)} />
            <Metric label="Auction date" value={shortDate(property.auctionDate)} />
            <Metric label="Yield" value={`${property.scoring?.yieldPct || 0}%`} />
            <Metric label="ROI" value={`${property.scoring?.roiPct || 0}%`} />
          </div>

          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Risk flags</h2>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              {(property.risks?.redFlags?.length ? property.risks.redFlags : ["No explicit v1 flags yet"]).map((flag) => (
                <div key={flag} className="panel-soft px-4 py-3">
                  {flag}
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Notes</h2>
            <form className="mt-4 space-y-4" onSubmit={addNote}>
              <textarea className="field min-h-28" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add investment notes, comparable evidence, or legal pack comments" />
              <button type="submit" className="button-primary">
                Save note
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {(data.notes || []).map((note) => (
                <div key={note.id} className="panel-soft px-4 py-3 text-sm text-white/65">
                  {note.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Scoring</h2>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <div>Score: {property.scoring?.score || 0}/100</div>
              <div>Confidence: {Math.round((property.scoring?.confidence || 0) * 100)}%</div>
              <div>Model version: {property.scoring?.modelVersion || "deal-v1"}</div>
              <div>Computed: {shortDate(property.scoring?.computedAt)}</div>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-display text-2xl text-sand-50">Reports</h2>
            <div className="mt-4 space-y-3">
              {(data.reports || []).map((report) => (
                <a key={report.id} href={report.storage?.url} className="panel-soft block px-4 py-3 text-sm text-teal-500 hover:text-sand-50">
                  {report.storage?.fileName || report.id}
                </a>
              ))}
              {!data.reports?.length ? <div className="text-sm text-white/50">No generated reports yet.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="panel-soft px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</div>
      <div className="mt-2 text-base font-semibold text-sand-50">{value}</div>
    </div>
  );
}

