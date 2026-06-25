"use client";

import { useEffect } from "react";
import { useUser } from "@/context/UserContext";

export function HersThemeApplier() {
  const { activeUser } = useUser();

  useEffect(() => {
    if (activeUser?.isHers) {
      document.body.setAttribute("data-hers", "true");
    } else {
      document.body.removeAttribute("data-hers");
    }
  }, [activeUser?.isHers]);

  return null;
}
