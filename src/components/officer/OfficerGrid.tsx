"use client";

import OfficerCard, { Officer } from "./OfficerCard";

export default function OfficerGrid({ officers }: { officers: Officer[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {officers.map((officer) => (
        <OfficerCard key={officer.code} officer={officer} />
      ))}
    </div>
  );
}
