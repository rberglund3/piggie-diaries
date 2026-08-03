import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PigDetail from './pages/PigDetail';
import Overview from './pages/Overview';
import FoodSearch from './pages/FoodSearch';
import Dashboard from './components/Dashboard';
import CreatePet from './components/CreatePet';
import AddMetric from './components/AddMetric';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import GuineaPigIcon from './components/icons/GuineaPigIcon';
import { useAuth } from './context/AuthContext';

function NavLinks() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
      {isAuthenticated && <Link to="/overview">Overview</Link>}
      <Link to="/food">Food Safety</Link>
      {isAuthenticated ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Sign Up</Link>
        </>
      )}
    </>
  );
}

function App() {
  const currentYear = new Date().getFullYear();
  const authorName = "Rita Ando Berglund";

  return (
    <Router>
      <header>
        <div className="header-title">
          <GuineaPigIcon size={44} className="header-icon" />
          <h1>Piggie Diaries</h1>
        </div>
        <p>Keep track of your guinea pigs' health over time.</p>
      </header>

      <nav>
        <NavLinks />
      </nav>

      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/food" element={<FoodSearch />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pigs/:name" element={<ProtectedRoute><PigDetail /></ProtectedRoute>} />
          <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
          <Route path="/create-pet" element={<ProtectedRoute><CreatePet /></ProtectedRoute>} />
          <Route path="/add-metric" element={<ProtectedRoute><AddMetric /></ProtectedRoute>} />
        </Routes>
      </main>

      <footer>
        <p>&copy; {currentYear} {authorName}</p>
      </footer>
    </Router>
  );
}

export default App;
