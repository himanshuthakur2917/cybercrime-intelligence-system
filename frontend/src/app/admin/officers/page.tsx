import OfficerCard from "@/components/admin/officer/OfficerCard";


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

const page = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-5">
          <div className="w-full grid grid-cols-3 gap-4 lg:px-5 md:grid-cols-3 @[1200px]:grid-cols-4">
            {officers.map((officer) => (
              <OfficerCard officer={officer} key={officer.code} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
