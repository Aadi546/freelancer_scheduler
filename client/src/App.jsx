import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import BookingPage from './pages/BookingPage';
import Auth from './pages/Auth';

const NotFound = () => (
  <>
    <style>{`
      .nf-root { min-height: 100vh; background: #0d0e11; display: flex; align-items: center;
        justify-content: center; flex-direction: column; gap: 16px; font-family: 'Syne', sans-serif; color: #e8eaf0; }
      .nf-code { font-size: 72px; font-weight: 700; color: #2a2e38; font-family: 'DM Mono', monospace; }
      .nf-msg { font-size: 16px; color: #555b6e; }
      .nf-link { padding: 10px 22px; background: #6c8fff; color: #fff; border-radius: 8px;
        text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 8px; }
    `}</style>
    <div className="nf-root">
      <div className="nf-code">404</div>
      <div className="nf-msg">Page not found</div>
      <a href="/auth" className="nf-link">Go to login</a>
    </div>
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/freelancer" element={<FreelancerDashboard />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/book/:freelancerId" element={<BookingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;