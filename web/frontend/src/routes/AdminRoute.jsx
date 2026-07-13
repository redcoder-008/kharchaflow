import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      // Redirect non-admins to dashboard
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // While loading or checking, render nothing or a spinner
  if (loading || !user) return null;
  return children;
}
