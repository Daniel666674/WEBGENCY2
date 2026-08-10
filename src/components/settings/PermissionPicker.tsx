"use client";

import { PERMISSION_SECTIONS } from "@/lib/permissions";

/**
 * Per-page permission checkboxes, grouped by Sidebar section.
 *
 * Each section header doubles as a select-all for its pages (indeterminate
 * when only some are on), so granting a whole area is still one click while
 * the actual stored unit stays the individual page.
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
    onChange(value.includes(key) ? value.filter((p) => p !== key) : [...value, key]);
  }

  function toggleSection(pageKeys: string[], allOn: boolean) {
    onChange(allOn ? value.filter((p) => !pageKeys.includes(p)) : [...new Set([...value, ...pageKeys])]);
  }

  return (
    <div className="space-y-3">
      {PERMISSION_SECTIONS.map((section) => {
        const pageKeys = section.pages.map((p) => p.key);
        const onCount = pageKeys.filter((k) => value.includes(k)).length;
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
              {section.pages.map((page) => (
                <label key={page.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.includes(page.key)}
                    disabled={disabled}
                    onChange={() => togglePage(page.key)}
                  />
                  {page.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
