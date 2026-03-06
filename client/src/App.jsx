// App.jsx — defines all routes and wraps the app in AuthProvider
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateEventPage from "./pages/CreateEventPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";

export default function App() {
  return (
    // AuthProvider wraps everything — any component below can call useAuth()
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-event" element={<CreateEventPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />

          <Route path="*" element={
            <main className="page page-narrow">
              <h1>404 – Page not found</h1>
              <a href="/">Go home</a>
            </main>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
