import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import QuizBookingScreen from "./screens/BookingScreens/QuizBookingScreen";
//import QuizBookingScreen from "./screens/BookingScreens/QuizBookingScreenTEMP";
import AdminDashboardScreen from "./screens/AdminScreens/AdminDashboardScreen";
//import AdminDashboardScreen from "./screens/AdminScreens/AdminDashboardScreenOLD";

import ManageBookingScreen from './screens/BookingScreens/ManageBookingScreen';
import ContactDetailScreen from './screens/ContactScreens/ContactDetailScreen';
import TableManagerScreen from './screens/AdminScreens/TableManagerScreen';
import QuizGenerator from './screens/AdminScreens/QuizGenerator';
import AdminLayout from './components/AdminLayout';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Booking Routes --- */}
        <Route path="/" element={<QuizBookingScreen />} />
        <Route path="/manage/:bookingId" element={<ManageBookingScreen />} />
        <Route path="/contact/:contactEmail" element={<ContactDetailScreen />} />

        {/* --- Admin Routes with Shared Layout --- */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Default admin route redirects to dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardScreen />} />
          <Route path="tables" element={<TableManagerScreen />} />
          <Route path="quiz-generator" element={<QuizGenerator />} />
        </Route>

        {/* Fallback route (optional) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
