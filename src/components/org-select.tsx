"use client";

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
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.tradeName ?? org.name}
        </option>
      ))}
    </select>
  );
}
