import React from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
};

export default function AppShell({
  title,
  subtitle,
  rightSlot,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-700 sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </main>
  );
}