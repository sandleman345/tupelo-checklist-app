"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/manager-logout", {
      method: "POST",
    });

    window.location.href = "/manager-login";
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100"
    >
      Log Out
    </button>
  );
}