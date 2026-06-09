"use client";

import { inputClass } from "@/lib/ui-classes";

export function OrgSelect({
  organizations,
  defaultValue,
}: {
  organizations: { id: string; name: string; tradeName: string | null }[];
  defaultValue: string;
}) {
  return (
    <select
      name="organizationId"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={`${inputClass} min-w-[180px] py-2`}
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.tradeName ?? org.name}
        </option>
      ))}
    </select>
  );
}
