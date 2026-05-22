"use client";

export type FrequencyOption = "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY";

interface Props {
  value: FrequencyOption;
  onChange: (v: FrequencyOption) => void;
}

const options: { value: FrequencyOption; label: string }[] = [
  { value: "NONE", label: "Does not repeat" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export default function RecurrenceSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Repeat
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FrequencyOption)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
