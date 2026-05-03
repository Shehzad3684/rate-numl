import "./About.css";

export default function About({ professorCount }) {
  return (
    <div className="about-page">
      <div className="about-card">
        <h2>About Rate NUML</h2>
        <p>
          Rate NUML is an anonymous professor review platform built for students of the
          National University of Modern Languages (NUML). Our mission is simple:
          provide honest, transparent feedback about teaching quality so students
          can make informed decisions.
        </p>
        <p>
          Every review is completely anonymous. We never store your name, email, or any
          identifying information alongside your reviews. Your privacy is guaranteed
          at both the application level and the database level.
        </p>

        <h3>How It Works</h3>
        <ul>
          <li>Sign in with your official @numl.edu.pk Google account</li>
          <li>Search for any professor by name or department</li>
          <li>Leave an anonymous star rating and optional comment</li>
          <li>Read reviews from fellow students</li>
        </ul>

        <h3>Privacy & Anonymity</h3>
        <ul>
          <li>No user data is ever stored with reviews</li>
          <li>Database security rules reject any identifying fields</li>
          <li>Reviews cannot be traced back to individual students</li>
          <li>Sign-in is only used to verify you are a NUML student</li>
        </ul>

        <div className="about-stats">
          <div className="about-stat">
            <div className="about-stat-number">{professorCount}</div>
            <div className="about-stat-label">Professors</div>
          </div>
          <div className="about-stat">
            <div className="about-stat-number">32</div>
            <div className="about-stat-label">Departments</div>
          </div>
          <div className="about-stat">
            <div className="about-stat-number">5</div>
            <div className="about-stat-label">Faculties</div>
          </div>
        </div>
      </div>
    </div>
  );
}
