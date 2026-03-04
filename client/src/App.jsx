// App.jsx — defines all routes for the application
// BrowserRouter wraps everything so all pages can use React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";

// Import all pages
import HomePage from "./pages/HomePage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateEventPage from "./pages/CreateEventPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar appears on every page */}
      <Navbar />

      {/* Routes — only one <Route> matches at a time */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />

        {/* Catch-all for unknown routes */}
        <Route path="*" element={
          <main className="page page-narrow">
            <h1>404 – Page not found</h1>
            <a href="/">Go home</a>
          </main>
        } />
      </Routes>
    </BrowserRouter>
  );
}
