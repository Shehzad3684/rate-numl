import { signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import "./Header.css";

export default function Header({ user, activeView, onViewChange, onLoginRequest }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSignIn = async () => {
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
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <div className="header-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="header-title">Rate NUML</div>
            <div className="header-tagline">Honest Reviews, Anonymous Always</div>
          </div>
        </div>

        <div className="header-actions">
          {user ? (
            <>
              <div className="header-user-info">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="header-user-avatar" referrerPolicy="no-referrer" />
                )}
                <span>{user.email}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="sign-in-btn" onClick={handleSignIn}>SIGN IN</button>
          )}
        </div>
      </div>

      <nav className="header-nav">
        <button className={`nav-link ${activeView === "faculty" ? "active" : ""}`} onClick={() => onViewChange("faculty")}>
          Faculty
        </button>
        <button className={`nav-link ${activeView === "about" ? "active" : ""}`} onClick={() => onViewChange("about")}>
          About
        </button>
      </nav>
    </header>
  );
}
