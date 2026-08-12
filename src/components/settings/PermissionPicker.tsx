"use client";

import { ALWAYS_GRANTED, PERMISSION_SECTIONS } from "@/lib/permissions";

/**
 * Per-page permission checkboxes, grouped by Sidebar section.
 *
 * Each section header doubles as a select-all for its pages (indeterminate
 * when only some are on), so granting a whole area is still one click while
 * the actual stored unit stays the individual page.
 *
 * Always-granted pages render checked and locked. Showing them as a live
 * checkbox would be a lie: unticking it would save, reload as unticked, and
 * change nothing about what the user can actually open.
 */
export function PermissionPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  function togglePage(key: string) {
    if (ALWAYS_GRANTED.includes(key)) return;
    onChange(value.includes(key) ? value.filter((p) => p !== key) : [...value, key]);
  }

  function toggleSection(pageKeys: string[], allOn: boolean) {
    const togglable = pageKeys.filter((k) => !ALWAYS_GRANTED.includes(k));
    onChange(allOn ? value.filter((p) => !togglable.includes(p)) : [...new Set([...value, ...togglable])]);
  }

  return (
    <div className="space-y-3">
      {PERMISSION_SECTIONS.map((section) => {
        const pageKeys = section.pages.map((p) => p.key);
        const granted = (k: string) => value.includes(k) || ALWAYS_GRANTED.includes(k);
        const onCount = pageKeys.filter(granted).length;
        const allOn = onCount === pageKeys.length;

        return (
          <div key={section.key} className="rounded-lg border p-2.5">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={allOn}
                disabled={disabled}
                ref={(el) => {
                  // Partial selection reads as "some of this section", not "none".
                  if (el) el.indeterminate = onCount > 0 && !allOn;
                }}
                onChange={() => toggleSection(pageKeys, allOn)}
              />
              {section.label}
              <span className="font-normal text-muted-foreground">
                ({onCount}/{pageKeys.length})
              </span>
            </label>

            <div className="mt-2 grid grid-cols-2 gap-1.5 pl-5">
              {section.pages.map((page) => {
                const always = ALWAYS_GRANTED.includes(page.key);
                return (
                  <label
                    key={page.key}
                    className={`flex items-center gap-1.5 text-xs ${always ? "cursor-default" : "cursor-pointer"}`}
                    title={always ? "Disponible para todo el equipo" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={granted(page.key)}
                      disabled={disabled || always}
                      onChange={() => togglePage(page.key)}
                    />
                    {page.label}
                    {always && <span className="text-[10px] text-muted-foreground">(todos)</span>}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
