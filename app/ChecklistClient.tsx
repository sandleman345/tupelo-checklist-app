<div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
  <h1 className="text-3xl font-bold">Tupelo Tea Checklist</h1>
  <p className="text-gray-600">Check tasks and enter initials</p>

  <div className="mt-3">
    <a
      href="/manager"
      className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-base font-medium shadow-sm"
    >
      Manager View
    </a>
  </div>

  <div className="mt-4">
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>Daily Progress</span>
      <span>
        {completedCount} / {totalCount}
      </span>
    </div>

    <div className="w-full bg-gray-200 rounded-full h-4">
      <div
        className="bg-green-500 h-4 rounded-full transition-all"
        style={{ width: `${progressPercent}%` }}
      ></div>
    </div>
  </div>
</div>