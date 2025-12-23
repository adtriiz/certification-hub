import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, user } = useAuth();

  // Detect if we're in an OAuth callback (access_token in hash)
  const isOAuthCallback = window.location.hash.includes('access_token') ||
    window.location.search.includes('code=');

  useEffect(() => {
    // If auth loaded and we have a user, redirect to home
    if (!loading && user) {
      navigate('/home', { replace: true });
      return;
    }

    // If auth loaded, no user, and not OAuth callback, redirect to login
    if (!loading && !user && !isOAuthCallback) {
      navigate('/', { replace: true });
      return;
    }

    // Only log 404 if we're truly on a bad route
    if (!loading && !isOAuthCallback) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [loading, user, navigate, location.pathname, isOAuthCallback]);

  // Show loading while auth is processing or during OAuth callback
  if (loading || isOAuthCallback) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

