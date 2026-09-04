"use client";
import { usePathname } from "next/navigation";
import React from "react";
import OperatorHeader from "@/components/OperatorHeader";

const OperatorLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const showNav = pathname === "/operator/add-route" || pathname ==="/operator/seats" || pathname ==="/operator/vehicles-edit" || pathname ==="/operator/schedule";
  return (
    <>
      {children}
      {!showNav ? <OperatorHeader /> : null}
    </>
  );
};

export default OperatorLayoutWrapper;
