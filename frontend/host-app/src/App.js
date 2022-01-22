import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';

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
            <Switch>
              <Route path="/rider" component={RiderApp} />
              <Route path="/driver" component={DriverApp} />
              <Route path="/" exact render={() => <h3>Select a portal to continue</h3>} />
            </Switch>
          </Suspense>
        </div>
      </div>
    </Router>
  );
};

export default App;
