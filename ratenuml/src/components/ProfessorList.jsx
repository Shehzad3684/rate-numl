import { useEffect, useState, useMemo } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebaseConfig";
import "./ProfessorList.css";

const ITEMS_PER_PAGE = 10;

function StarDisplay({ rating }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="card-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`card-star ${i <= rounded ? "filled" : ""}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function SkeletonCards() {
  return Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="skeleton-card">
      <div className="skeleton-bar skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-bar skeleton-text" style={{ width: "60%" }} />
        <div className="skeleton-bar skeleton-text" style={{ width: "35%" }} />
        <div className="skeleton-bar skeleton-text" style={{ width: "45%" }} />
      </div>
    </div>
  ));
}

export default function ProfessorList({
  searchQuery,
  selectedDepartment,
  sortBy,
  onSelectProfessor,
  professors,
  setProfessors,
  loading,
  setLoading,
}) {
  const [page, setPage] = useState(1);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const snapshot = await get(ref(db, "professors"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.entries(data).map(([id, val]) => ({
            id,
            ...val,
          }));
          setProfessors(list);
        }
      } catch (err) {
        console.error("Failed to fetch professors:", err);
      } finally {
        setLoading(false);
      }
    };

    if (professors.length === 0 && loading) {
      fetchProfessors();
    }
  }, [professors.length, loading, setProfessors, setLoading]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedDepartment, sortBy]);

  // Filter and sort
  const filtered = useMemo(() => {
    let results = professors.filter((prof) => {
      const matchesSearch = prof.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDept =
        !selectedDepartment || prof.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });

    switch (sortBy) {
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating-high":
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "rating-low":
        results.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
        break;
      case "most-reviewed":
        results.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
        break;
      default:
        break;
    }

    return results;
  }, [professors, searchQuery, selectedDepartment, sortBy]);

  // Paginate
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="professor-list">
        <SkeletonCards />
      </div>
    );
  }

  return (
    <>
      <div className="professor-list">
        {paginated.length === 0 ? (
          <div className="empty-state">
            <h3>No professors found</h3>
            <p>Try adjusting your search or department filter.</p>
          </div>
        ) : (
          paginated.map((prof) => (
            <div key={prof.id} className="professor-card" id={`prof-${prof.id}`}>
              {prof.imageUrl && !imgErrors[prof.id] ? (
                <img
                  src={prof.imageUrl}
                  alt={prof.name}
                  className="card-avatar"
                  loading="lazy"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [prof.id]: true }))
                  }
                />
              ) : (
                <div className="card-avatar-placeholder">
                  {getInitials(prof.name)}
                </div>
              )}

              <div className="card-info">
                <h3 className="card-name">{prof.name}</h3>
                <p className="card-department">{prof.department}</p>
                <div className="card-rating-row">
                  <StarDisplay rating={prof.averageRating || 0} />
                  <span className="card-rating-number">
                    {(prof.averageRating || 0).toFixed(1)}/5.0
                  </span>
                  <span className="card-review-count">
                    ({prof.totalReviews || 0} reviews)
                  </span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="card-btn card-btn-reviews"
                  onClick={() => onSelectProfessor(prof)}
                  aria-label={`View reviews for ${prof.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Reviews
                </button>
                {prof.profileUrl && (
                  <a
                    className="card-btn card-btn-profile"
                    href={prof.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View NUML profile of ${prof.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Profile
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            return (
              <button
                key={pageNum}
                className={`page-btn ${page === pageNum ? "active" : ""}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
