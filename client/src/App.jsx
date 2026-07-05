import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;


import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import CreateEventPage from "./pages/CreateEventPage.jsx";
import EditEventPage from "./pages/EditEventPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PublicProfilePage from "./pages/PublicProfilePage.jsx";
import DiscoveryPage from "./pages/DiscoveryPage.jsx";
import AuthCallbackPage from "./pages/AuthCallbackPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import Footer from "./components/Footer.jsx";

function AppRoutes() {
  const { bootstrapping } = useAuth();

  if (bootstrapping) {
    return <main className="page page-narrow"><p className="state-msg">Loading…</p></main>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:id" element={<Elements stripe={stripePromise}><EventDetailPage /></Elements>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Elements stripe={stripePromise}><ProfilePage /></Elements></ProtectedRoute>} />
      <Route path="/create-event" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
      <Route path="/events/:id/edit" element={<ProtectedRoute><EditEventPage /></ProtectedRoute>} />
      <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />

      <Route path="/discover" element={<DiscoveryPage />} />
      <Route path="/users/:id" element={<PublicProfilePage />} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="*" element={
        <main className="page page-narrow">
          <h1>404 – Page not found</h1>
          <a href="/">Go home</a>
        </main>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
