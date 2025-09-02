import React from "react";

export const FloatingPostButton = ({ onClick, title = "投稿" }) => {
  const size = 56;
  const styles = {
    button: {
      position: "fixed",
      right: 16,
      bottom: 88, // keep above footer (~65px)
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: "#0B4F7F",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      border: "none",
      cursor: "pointer",
      zIndex: 1000,
    },
    icon: {
      width: 24,
      height: 24,
    },
    label: {
      position: "fixed",
      right: 16 + size + 8,
      bottom: 88 + (size - 24) / 2,
      background: "rgba(0,0,0,0.6)",
      color: "#fff",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 12,
      pointerEvents: "none",
      userSelect: "none",
      display: "none",
    },
  };

  return (
    <button aria-label={title} style={styles.button} onClick={onClick}>
      {/* simple plus icon */}
      <svg
        style={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
};

