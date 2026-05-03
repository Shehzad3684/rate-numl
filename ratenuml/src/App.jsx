import { useState, useEffect, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import ProfessorList from "./components/ProfessorList";
import ReviewBox from "./components/ReviewBox";
import About from "./components/About";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [activeView, setActiveView] = useState("faculty");

  // Auth listener — optional, doesn't block browsing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email?.endsWith("@numls.edu.pk")) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const departments = useMemo(
    () => professors.map((p) => p.department),
    [professors]
  );

  const filteredCount = useMemo(() => {
    return professors.filter((prof) => {
      const matchesSearch = prof.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDept =
        !selectedDepartment || prof.department === selectedDepartment;
      return matchesSearch && matchesDept;
    }).length;
  }, [professors, searchQuery, selectedDepartment]);

  const handleReviewSubmitted = () => {
    setProfessors([]);
    setLoading(true);
  };

  const handleBack = () => setSelectedProfessor(null);

  const handleViewChange = (view) => {
    setActiveView(view);
    setSelectedProfessor(null);
  };

  return (
    <div className="app">
      <Header
        user={user}
        activeView={selectedProfessor ? "" : activeView}
        onViewChange={handleViewChange}
      />

      <main className="main-content">
        <div className="container">
          {selectedProfessor ? (
            <ReviewBox
              professor={selectedProfessor}
              user={user}
              onBack={handleBack}
              onReviewSubmitted={handleReviewSubmitted}
            />
          ) : activeView === "about" ? (
            <About professorCount={professors.length} />
          ) : (
            <>
              <SearchBar
                query={searchQuery}
                onQueryChange={setSearchQuery}
                departments={departments}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
                sortBy={sortBy}
                onSortChange={setSortBy}
                resultCount={filteredCount}
                totalCount={professors.length}
              />
              <ProfessorList
                searchQuery={searchQuery}
                selectedDepartment={selectedDepartment}
                sortBy={sortBy}
                onSelectProfessor={setSelectedProfessor}
                professors={professors}
                setProfessors={setProfessors}
                loading={loading}
                setLoading={setLoading}
              />
            </>
          )}
        </div>
      </main>

      <footer className="app-footer">
        2026 © Rate NUML — Anonymous Professor Reviews
      </footer>
      <Analytics />
    </div>
  );
}
