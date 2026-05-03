import { useState, useEffect, useCallback } from "react";
import {
  ref,
  push,
  get,
  query,
  orderByChild,
  equalTo,
  runTransaction,
} from "firebase/database";
import { signInWithPopup, signOut } from "firebase/auth";
import { db, auth, googleProvider } from "../firebaseConfig";
import "./ReviewBox.css";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function ReviewBox({ professor, user, onBack, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [imgError, setImgError] = useState(false);

  const MAX_CHARS = 500;

  // Fetch existing reviews for this professor
  const fetchReviews = useCallback(async () => {
    try {
      const reviewsRef = ref(db, "reviews");
      const reviewsQuery = query(
        reviewsRef,
        orderByChild("professorId"),
        equalTo(professor.id)
      );
      const snapshot = await get(reviewsQuery);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setReviews(list);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [professor.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);

    try {
      // ──── ANONYMITY GUARANTEE ────
      // ONLY these fields are sent. No user UID, email, or identifying data.
      const reviewData = {
        professorId: professor.id,
        rating: rating,
        comment: comment.trim(),
        createdAt: Date.now(),
      };

      // Push review
      const reviewsRef = ref(db, "reviews");
      await push(reviewsRef, reviewData);

      // Update professor's average rating via transaction
      const profRef = ref(db, `professors/${professor.id}`);
      await runTransaction(profRef, (currentData) => {
        if (currentData) {
          const oldTotal = currentData.totalReviews || 0;
          const oldAvg = currentData.averageRating || 0;
          const newTotal = oldTotal + 1;
          const newAvg = (oldAvg * oldTotal + rating) / newTotal;
          currentData.averageRating = Math.round(newAvg * 100) / 100;
          currentData.totalReviews = newTotal;
        }
        return currentData;
      });

      setSubmitted(true);
      setRating(0);
      setComment("");
      fetchReviews();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <div className="review-page">
      {/* Back button */}
      <button className="back-link" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Faculty Search
      </button>

      {/* Professor header */}
      <div className="prof-header">
        {professor.imageUrl && !imgError ? (
          <img
            src={professor.imageUrl}
            alt={professor.name}
            className="prof-avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="prof-avatar-placeholder">
            {getInitials(professor.name)}
          </div>
        )}

        <div className="prof-details">
          <h1 className="prof-name">{professor.name}</h1>
          <p className="prof-dept">{professor.department}</p>
          {professor.designation && (
            <p className="prof-designation">{professor.designation}</p>
          )}
          <div className="prof-rating-row">
            <div className="prof-stars">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`prof-star ${
                    i <= Math.round(professor.averageRating || 0) ? "filled" : ""
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="prof-rating-number">
              {(professor.averageRating || 0).toFixed(1)} / 5.0
            </span>
            <span className="prof-review-count">
              ({professor.totalReviews || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Review form OR sign-in prompt */}
      {user ? (
        submitted ? (
          <div className="submit-success-msg">
            <h3>✓ Review Submitted!</h3>
            <p>Your anonymous review has been recorded. Thank you for your feedback.</p>
          </div>
        ) : (
          <div className="review-form-section">
            <h2 className="form-title">Leave a Review</h2>

            <div className="form-row">
              <label className="form-label">Rating</label>
              <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-input-btn ${
                      star <= rating ? "selected" : ""
                    } ${star <= hoveredStar ? "hovered" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {(hoveredStar || rating) > 0 && (
                <p className="rating-label-text">
                  {RATING_LABELS[hoveredStar || rating]}
                </p>
              )}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="review-comment">
                Comment (Optional)
              </label>
              <textarea
                id="review-comment"
                className="review-textarea"
                placeholder="Share your experience with this professor..."
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, MAX_CHARS))}
                maxLength={MAX_CHARS}
              />
              <p className="char-count">
                {comment.length}/{MAX_CHARS}
              </p>
            </div>

            <div className="anonymity-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Your identity is completely hidden. No personal data is stored with reviews.
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              id="submit-review-btn"
            >
              {submitting ? (
                <>
                  <div className="submit-spinner" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        )
      ) : (
        <div className="sign-in-prompt">
          <p>Please sign in with your @numls.edu.pk email to leave a review</p>
          <button className="sign-in-prompt-btn" onClick={async () => {
            try {
              const result = await signInWithPopup(auth, googleProvider);
              if (!result.user.email.endsWith("@numls.edu.pk")) {
                await signOut(auth);
                alert("Access Denied: Only @numls.edu.pk emails are accepted.");
              }
            } catch (err) {
              if (err.code !== "auth/popup-closed-by-user") {
                console.error("Sign-in failed:", err);
              }
            }
          }}>
            SIGN IN
          </button>
        </div>
      )}

      {/* Existing reviews */}
      <div className="reviews-list-section">
        <h2 className="reviews-list-title">Reviews</h2>

        {loadingReviews ? (
          <p className="reviews-loading">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            No reviews yet. Be the first to review this professor!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-item-header">
                <div>
                  <span className="review-author">Anonymous</span>
                  <div className="review-date">{formatDate(review.createdAt)}</div>
                </div>
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`review-star ${s <= review.rating ? "filled" : ""}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
