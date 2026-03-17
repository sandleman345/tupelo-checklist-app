"use client";

import { useState } from "react";

export default function ManagerLoginClient({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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
        <h1 className="text-2xl font-bold text-gray-900">Manager Login</h1>
        <p className="mt-1 text-gray-700">
          Enter the manager password to continue.
        </p>

        <div className="mt-4 space-y-4">
          <input
            type="password"
            placeholder="Manager password"
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