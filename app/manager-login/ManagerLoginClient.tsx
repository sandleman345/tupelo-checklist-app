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
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-3xl font-bold text-slate-50">Task Login</h1>
        <p className="mt-2 text-slate-300">
          Enter password to access tasks.
        </p>

        {reasonMessage ? (
          <div className="mt-4 rounded-xl border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            {reasonMessage}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-600 bg-slate-950 px-4 py-4 text-xl text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />

          <button
            onClick={handleLogin}
            className="w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 py-4 text-lg font-semibold text-slate-100 shadow-sm hover:bg-slate-700"
          >
            Log In
          </button>

          {message ? (
            <div className="rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}