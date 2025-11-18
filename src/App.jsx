import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PostProvider } from "./contexts/PostContext";
import pushNotificationService from "./services/pushNotification";
import { router } from "./routes";
import ErrorBoundary from "./components/ErrorBoundary";

export const App = () => {
  useEffect(() => {
    pushNotificationService.initialize();
  }, []);

  return (
    <AuthProvider>
      <PostProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </PostProvider>
    </AuthProvider>
  );
};

export default App;