import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

const RiderApp = React.lazy(() => import('rider_app/App').catch(() => {
  return { default: () => <div>Failed to load Rider App</div> };
}));

const DriverApp = React.lazy(() => import('driver_app/App').catch(() => {
  return { default: () => <div>Failed to load Driver App</div> };
}));

const App = () => {
  return (
    <Router>
      <div>
        <nav style={{ padding: '1rem', background: '#282c34', color: 'white' }}>
          <h2>Ride-Hailing OS (Host)</h2>
          <Link to="/rider" style={{ color: 'lightblue', marginRight: '1rem' }}>Rider Portal</Link>
          <Link to="/driver" style={{ color: 'lightblue' }}>Driver Portal</Link>
        </nav>
        <div style={{ padding: '2rem' }}>
          <Suspense fallback={<div>Loading Micro-Frontend...</div>}>
            <Routes>
              <Route path="/rider" element={<RiderApp />} />
              <Route path="/driver" element={<DriverApp />} />
              <Route path="/" element={<h3>Select a portal to continue</h3>} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
};

export default App;
