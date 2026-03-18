"use client";

import { useEffect, useRef } from "react";

const AUTO_LOGOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export default function AutoLogout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch("/api/manager-logout", {
          method: "POST",
          cache: "no-store",
        });
      } finally {
        window.location.href = "/manager-login?reason=expired";
      }
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        logout();
      }, AUTO_LOGOUT_MS);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null;
}