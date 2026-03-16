return (
  <section key={section} className="rounded-2xl border bg-white p-5">
    <button
      onClick={() => toggleSection(section)}
      className={`mb-4 flex w-full items-center justify-between text-left text-2xl font-semibold ${getHeaderColor(
        section
      )}`}
    >
      <span>
        {openSections[section] ? "▼" : "▶"} {section}
      </span>

      <span className="text-sm text-gray-500">
        {sectionItems.length} tasks
      </span>
    </button>

    {openSections[section] && (
      <div className="space-y-4">
        {sectionItems.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border bg-gray-50 p-4"
          >
            <div className="text-xl font-semibold">{item.task_name}</div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-lg">
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    updateItem(item.id, "completed", e.target.checked)
                  }
                  className="h-7 w-7"
                />
                Completed
              </label>

              <input
                type="text"
                placeholder="Initials"
                value={item.employee_initials || ""}
                disabled={isReadOnly}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    "employee_initials",
                    e.target.value.toUpperCase()
                  )
                }
                className="w-28 rounded-lg border px-3 py-2 text-lg disabled:bg-gray-100"
                maxLength={5}
              />
            </div>

            <div className="mt-3 text-gray-600">
              Status: {item.completed ? "Completed" : "Not completed"}
            </div>

            {item.completed_at && (
              <div className="text-sm text-gray-500">
                Completed at:{" "}
                {new Date(item.completed_at).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
);