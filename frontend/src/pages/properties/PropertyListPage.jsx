import { useEffect, useMemo, useState } from "react";
import PropertyCard from "../../components/properties/PropertyCard.jsx";
import PropertyFilters from "../../components/properties/PropertyFilters.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { listBookmarks } from "../../services/bookmarkApi.js";
import { listProperties } from "../../services/propertyApi.js";

const emptyFilters = {
  auctionDateFrom: "",
  auctionDateTo: "",
  maxPrice: "",
  minPrice: "",
  minScore: "",
  minYield: "",
  postcode: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  status: "",
  tenure: "",
  type: ""
};

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const cleanParams = (params) =>
  Object.entries(params).reduce((cleaned, [key, value]) => {
    if (value !== "") {
      cleaned[key] = value;
    }

    return cleaned;
  }, {});

const getBookmarkPropertyId = (bookmark) =>
  typeof bookmark.propertyId === "string" ? bookmark.propertyId : bookmark.property?.id;

const PropertyListPage = () => {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [properties, setProperties] = useState([]);
  const [bookmarkedPropertyIds, setBookmarkedPropertyIds] = useState(new Set());
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () =>
      cleanParams({
        ...appliedFilters,
        limit: pagination.limit,
        page: pagination.page
      }),
    [appliedFilters, pagination.limit, pagination.page]
  );

  useEffect(() => {
    let isMounted = true;

    const loadProperties = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [propertiesResponse, bookmarksResponse] = await Promise.all([
          listProperties(queryParams),
          listBookmarks()
        ]);

        if (isMounted) {
          setProperties(propertiesResponse.data.data.properties);
          setPagination(propertiesResponse.data.data.pagination);
          setBookmarkedPropertyIds(
            new Set(bookmarksResponse.data.data.bookmarks.map(getBookmarkPropertyId).filter(Boolean))
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Properties could not be loaded."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
    setAppliedFilters(filters);
  };

  const goToPage = (page) => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page
    }));
  };

  const handleBookmarkChange = (propertyId, isBookmarked) => {
    setBookmarkedPropertyIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isBookmarked) {
        nextIds.add(propertyId);
      } else {
        nextIds.delete(propertyId);
      }

      return nextIds;
    });
  };

  return (
    <section className="properties-page" aria-labelledby="properties-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Properties</p>
          <h1 id="properties-title">Auction listings</h1>
          <p>Browse scraped properties by location, price, scoring, and auction timing.</p>
        </div>
      </div>

      <PropertyFilters
        filters={filters}
        isLoading={isLoading}
        onChange={handleFilterChange}
        onSubmit={handleSubmit}
      />

      <FormError>{error}</FormError>

      <div className="property-results-meta">
        <strong>{pagination.total}</strong>
        <span>{pagination.total === 1 ? "property" : "properties"}</span>
      </div>

      {isLoading ? (
        <p>Loading properties...</p>
      ) : properties.length ? (
        <div className="property-grid">
          {properties.map((property) => (
            <PropertyCard
              isBookmarked={bookmarkedPropertyIds.has(property.id)}
              key={property.id}
              onBookmarkChange={handleBookmarkChange}
              property={property}
            />
          ))}
        </div>
      ) : (
        <p>No properties match these filters.</p>
      )}

      <div className="pagination-bar" aria-label="Pagination">
        <button
          className="secondary-button"
          disabled={pagination.page <= 1}
          onClick={() => goToPage(pagination.page - 1)}
          type="button"
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          className="secondary-button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => goToPage(pagination.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default PropertyListPage;
