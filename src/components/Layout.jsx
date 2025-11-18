import React from "react";
import { Outlet } from "react-router-dom";
import { GlobalFloatingPostButton } from "./GlobalFloatingPostButton";

export const Layout = () => {
  return (
    <>
      <Outlet />
      <GlobalFloatingPostButton />
    </>
  );
};
