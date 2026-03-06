// ProtectedRoute — redirects to /login if the user is not authenticated.
// Wrap any route that requires login with this component in App.jsx.
//
// Usage:
//   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        // Replace = true so clicking Back after redirect doesn't loop back to the
        // protected page again.
        return <Navigate to="/login" replace />;
    }

    return children;
}
