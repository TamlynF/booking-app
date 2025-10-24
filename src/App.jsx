import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import QuizBookingScreen from "./screens/BookingScreens/QuizBookingScreen"
import AdminDashboardScreen from "./screens/AdminScreens/AdminDashboardScreen"
import ManageBookingScreen from './screens/BookingScreens/ManageBookingScreen';
import ContactDetailScreen from './screens/ContactScreens/ContactDetailScreen';
import 'bootstrap/dist/css/bootstrap.min.css';

function Navigation() {
    return (
        <nav style={{ background: '#333', padding: '1rem', textAlign: 'center' }}>
            <Link to="/" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>Booking Page</Link>
            <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin Dashboard</Link>
        </nav>
    );
}

function App() {
  // const [currentView, setCurrentView] = useState('booking');

  // const renderCurrentView = () => {
  //   switch (currentView) {
  //     case 'admin':
  //       return <AdminDashboardScreen />;
  //     case 'booking':
  //     default:
  //       return <QuizBookingScreen />;
  //   }
  // };

  return (
    <BrowserRouter>
      {/* The Navigation is optional but helpful for moving between pages during development */}
      <Navigation />
      
      <Routes>
        {/* Route for the main booking page */}
        <Route path="/" element={<QuizBookingScreen />} />
        
        {/* Route for the admin dashboard */}
        <Route path="/admin" element={<AdminDashboardScreen />} />

        <Route path="/contact/:contactEmail" element={<ContactDetailScreen />} />
        
        {/* Route for the manage booking page. 
          The ManageBookingScreen component is already set up to read the bookingId from the URL's query string (e.g., ?bookingId=123),
          so we just need to direct the /manage path to it.
        */}
        <Route path="/manage" element={<ManageBookingScreen />} />
      </Routes>
    </BrowserRouter>
    // <>
    //   {/* --- Navigation Bar --- */}
    //   <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    //     <div className="container-fluid">
    //       <a className="navbar-brand" href="#" onClick={() => setCurrentView('booking')}>
    //         Quiz Night Booker
    //       </a>
    //       <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
    //         <span className="navbar-toggler-icon"></span>
    //       </button>
    //       <div className="collapse navbar-collapse" id="navbarNav">
    //         <ul className="navbar-nav ms-auto">
    //           <li className="nav-item">
    //             <a 
    //               className={`nav-link ${currentView === 'booking' ? 'active' : ''}`} 
    //               href="#" 
    //               onClick={(e) => { e.preventDefault(); setCurrentView('booking'); }}
    //             >
    //               Booking Page
    //             </a>
    //           </li>
    //           <li className="nav-item">
    //             <a 
    //               className={`nav-link ${currentView === 'admin' ? 'active' : ''}`} 
    //               href="#" 
    //               onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }}
    //             >
    //               Admin Dashboard
    //             </a>
    //           </li>
    //         </ul>
    //       </div>
    //     </div>
    //   </nav>

    //   {/* --- Main Content Area --- */}
    //   <main className="container-fluid">
    //     {renderCurrentView()}
    //   </main>
    // </>
  );
}

export default App
