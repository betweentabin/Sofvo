import React from "react";
import { useLocation } from "react-router-dom";
import { usePost } from "../contexts/PostContext";
import { FloatingPostButton } from "./FloatingPostButton";

// Pages where the floating post button should be shown
// Note: Home page (/ and /home) has its own button, so we exclude it here
const PAGES_WITH_POST_BUTTON = [
  '/mypage',
  '/recommend',
  '/search',
  '/notifications',
  '/ads',
];

export const GlobalFloatingPostButton = () => {
  const location = useLocation();
  const { openComposer } = usePost();

  // Don't show on home page (it has its own button)
  if (location.pathname === '/' || location.pathname === '/home') {
    return null;
  }

  // Check if current page should show the post button
  const shouldShowButton = PAGES_WITH_POST_BUTTON.some(
    (page) => location.pathname === page || location.pathname.startsWith('/mypage/')
  );

  if (!shouldShowButton) {
    return null;
  }

  return <FloatingPostButton onClick={openComposer} />;
};
