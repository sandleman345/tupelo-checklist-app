"use client";

import { useMemo, useState } from "react";

export default function ManagerLoginClient({
  redirectTo,
  reason,
}: {
  redirectTo: string;
  reason: string;
}) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const reasonMessage = useMemo(() => {
    if (reason === "logout") {
      return "You have been logged out.";
    }

    if (reason === "expired") {
      return "Session expired. Please log in again.";
    }

    return "";
  }, [reason]);

  const handleLogin = async () => {
    const response = await fetch("/api/manager-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setMessage("Incorrect password.");
      return;
    }

    window.location.href = redirectTo;
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Task Login</h1>
        <p className="mt-1 text-gray-700">
          Enter password to access tasks.
        </p>

        {reasonMessage ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {reasonMessage}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-gray-900"
          />

          <button
            onClick={handleLogin}
            className="w-full rounded-xl border bg-white px-4 py-3 font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Log In
          </button>

          {message ? (
            <div className="rounded-xl border bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}