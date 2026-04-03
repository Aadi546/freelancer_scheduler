import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Auth from './pages/Auth'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Make the login page the default landing route */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        <Route path="/auth" element={<Auth />} />
        <Route path="/freelancer" element={<FreelancerDashboard />} />
        <Route path="/book/:freelancerId" element={<ClientDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;