// src/AdminRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { ready, isAuthenticated, isAdmin } = useAuth();
  const loc = useLocation();

  if (!ready) return null;                       // o un loader
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
