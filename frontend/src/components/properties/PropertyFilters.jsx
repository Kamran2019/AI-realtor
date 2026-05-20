const PropertyFilters = ({ filters, isLoading, onChange, onSubmit }) => (
  <form className="property-filters" onSubmit={onSubmit}>
    <label>
      Search
      <input
        name="search"
        onChange={onChange}
        placeholder="Address, listing ID, keyword"
        value={filters.search}
      />
    </label>
    <label>
      Postcode
      <input name="postcode" onChange={onChange} placeholder="SW1A" value={filters.postcode} />
    </label>
    <label>
      Status
      <select name="status" onChange={onChange} value={filters.status}>
        <option value="">Any</option>
        <option value="new">New</option>
        <option value="watching">Watching</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="rejected">Rejected</option>
        <option value="archived">Archived</option>
      </select>
    </label>
    <label>
      Type
      <input name="type" onChange={onChange} placeholder="Flat" value={filters.type} />
    </label>
    <label>
      Tenure
      <input name="tenure" onChange={onChange} placeholder="Leasehold" value={filters.tenure} />
    </label>
    <label>
      Min price
      <input min="0" name="minPrice" onChange={onChange} type="number" value={filters.minPrice} />
    </label>
    <label>
      Max price
      <input min="0" name="maxPrice" onChange={onChange} type="number" value={filters.maxPrice} />
    </label>
    <label>
      Min score
      <input
        max="100"
        min="0"
        name="minScore"
        onChange={onChange}
        type="number"
        value={filters.minScore}
      />
    </label>
    <label>
      Min yield
      <input
        max="100"
        min="0"
        name="minYield"
        onChange={onChange}
        type="number"
        value={filters.minYield}
      />
    </label>
    <label>
      Auction from
      <input name="auctionDateFrom" onChange={onChange} type="date" value={filters.auctionDateFrom} />
    </label>
    <label>
      Auction to
      <input name="auctionDateTo" onChange={onChange} type="date" value={filters.auctionDateTo} />
    </label>
    <label>
      Sort
      <select name="sortBy" onChange={onChange} value={filters.sortBy}>
        <option value="createdAt">Newest</option>
        <option value="auctionDate">Auction date</option>
        <option value="price">Guide price</option>
        <option value="score">Score</option>
        <option value="yield">Yield</option>
        <option value="postcode">Postcode</option>
      </select>
    </label>
    <label>
      Direction
      <select name="sortOrder" onChange={onChange} value={filters.sortOrder}>
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </label>
    <button className="primary-button" disabled={isLoading} type="submit">
      {isLoading ? "Loading..." : "Apply"}
    </button>
  </form>
);

export default PropertyFilters;
