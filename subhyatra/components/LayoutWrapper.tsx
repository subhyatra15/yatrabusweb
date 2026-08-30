"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { Toaster } from "react-hot-toast";
import SiteHeader from "./SiteHeader";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const showNav = pathname === "/" || pathname === "/signup" ||  pathname === "/signin";
  return (
    <>
      {!showNav ? <SiteHeader /> : null}
      {children}
      <Toaster />
    </>
  );
};

export default LayoutWrapper;
