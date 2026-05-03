import { useMemo } from "react";
import "./SearchBar.css";

export default function SearchBar({
  query,
  onQueryChange,
  departments,
  selectedDepartment,
  onDepartmentChange,
  sortBy,
  onSortChange,
  resultCount,
  totalCount,
}) {
  const uniqueDepts = useMemo(() => {
    return [...new Set(departments)].sort();
  }, [departments]);

  return (
    <section className="search-section">
      <div className="search-row">
        {/* Name search */}
        <div className="search-field">
          <label htmlFor="search-input">Search Professors</label>
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Name"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              id="search-input"
              aria-label="Search professors by name"
            />
          </div>
        </div>

        {/* Department filter */}
        <div className="filter-field">
          <label htmlFor="dept-filter">Department</label>
          <select
            className="filter-select"
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            id="dept-filter"
          >
            <option value="">All Departments</option>
            {uniqueDepts.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="filter-field">
          <label htmlFor="sort-select">Sort By</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            id="sort-select"
          >
            <option value="recent">Recent</option>
            <option value="name">Name A-Z</option>
            <option value="rating-high">Rating: High to Low</option>
            <option value="rating-low">Rating: Low to High</option>
            <option value="most-reviewed">Most Reviewed</option>
          </select>
        </div>
      </div>

      <p className="results-count">
        Showing {resultCount} of {totalCount} faculty members
      </p>
    </section>
  );
}
