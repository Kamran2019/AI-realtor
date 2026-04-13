import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { currency } from "../../utils/format";

const initialFilters = {
  search: "",
  postcode: "",
  minPrice: "",
  maxPrice: "",
  minScore: "",
  minYield: "",
};

export default function PropertiesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);

  const loadProperties = async (nextFilters = filters) => {
    const { data } = await api.get("/properties", { params: nextFilters });
    setItems(data.items);
  };

  useEffect(() => {
    loadProperties(initialFilters);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    loadProperties(filters);
  };

  const exportCsv = () => {
    api
      .get("/properties/export/csv", {
        params: filters,
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "properties.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analyzer"
        title="Auction property pipeline"
        description="Filter by postcode, price, score, and yield to focus on the highest-potential lots."
        actions={
          <button type="button" className="button-secondary" onClick={exportCsv}>
            Export CSV
          </button>
        }
      />

      <form className="panel grid gap-4 p-6 md:grid-cols-3 xl:grid-cols-6" onSubmit={submit}>
        <input className="field" placeholder="Search address" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <input className="field" placeholder="Postcode" value={filters.postcode} onChange={(e) => setFilters({ ...filters, postcode: e.target.value })} />
        <input className="field" placeholder="Min price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
        <input className="field" placeholder="Max price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        <input className="field" placeholder="Min score" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })} />
        <input className="field" placeholder="Min yield %" value={filters.minYield} onChange={(e) => setFilters({ ...filters, minYield: e.target.value })} />
        <button type="submit" className="button-primary md:col-span-3 xl:col-span-6">
          Apply filters
        </button>
      </form>

      <div className="grid gap-4">
        {items.map((property) => (
          <Link key={property.id} to={`/properties/${property.id}`} className="panel block p-5 transition hover:border-teal-500/40">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-2xl font-semibold text-sand-50">{property.address}</div>
                <div className="mt-2 text-sm text-white/55">{property.postcode || "No postcode"} | {property.sourceKey}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm xl:grid-cols-4">
                <Metric label="Guide price" value={currency(property.guidePrice)} />
                <Metric label="Score" value={`${property.scoring?.score || 0}/100`} />
                <Metric label="Yield" value={`${property.scoring?.yieldPct || 0}%`} />
                <Metric label="ROI" value={`${property.scoring?.roiPct || 0}%`} />
              </div>
            </div>
          </Link>
        ))}
        {!items.length ? <div className="text-sm text-white/50">No properties found with the current filters.</div> : null}
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
