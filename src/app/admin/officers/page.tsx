import OfficerGrid from "@/components/officer/OfficerGrid";

export default function AdminOfficersPage() {
  const officers = [
    {
      name: "Det. Ramesh Singh",
      code: "CIS-OFF-101",
      unit: "Cyber Cell Unit 4",
      email: "det.singh@cis.gov.in",
      joined: "10 Mar 2024",
      cases: 2,
      initials: "DR",
      status: "active" as const,
    },
    {
      name: "Det. Priya Mehta",
      code: "CIS-OFF-102",
      unit: "Cyber Cell Unit 2",
      email: "det.mehta@cis.gov.in",
      joined: "5 Apr 2024",
      cases: 1,
      initials: "DP",
      status: "active" as const,
    },
    {
      name: "Det. Arun Kumar",
      code: "CIS-OFF-103",
      unit: "Cyber Cell Unit 1",
      email: "det.kumar@cis.gov.in",
      joined: "12 May 2024",
      cases: 1,
      initials: "DA",
      status: "inactive" as const,
    },
    {
      name: "Det. Kavita Rao",
      code: "CIS-OFF-104",
      unit: "Financial Crimes Unit",
      email: "det.rao@cis.gov.in",
      joined: "22 Jun 2024",
      cases: 0,
      initials: "KR",
      status: "active" as const,
    },
    {
      name: "Det. Farhan Ali",
      code: "CIS-OFF-105",
      unit: "Surveillance Unit",
      email: "det.ali@cis.gov.in",
      joined: "01 Jul 2024",
      cases: 0,
      initials: "FA",
      status: "inactive" as const,
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Officer Management</h1>
          <p className="text-sm text-[#8B949E]">Manage active and inactive officers</p>
        </div>
        <button className="btn-primary text-sm py-2">Add Officer</button>
      </div>

      <OfficerGrid officers={officers} />
    </main>
  );
}
