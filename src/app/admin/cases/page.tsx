export default function AdminCasesPage() {
  const cases = [
    {
      id: "CIS-001",
      title: "Dark Web Fraud Ring",
      priority: "High",
      status: "Active",
      assignedTo: "Det. Ramesh Singh",
      warrant: "Pending",
    },
    {
      id: "CIS-002",
      title: "Ransomware Variant X",
      priority: "Critical",
      status: "Active",
      assignedTo: "Det. Priya Mehta",
      warrant: "Approved",
    },
    {
      id: "CIS-003",
      title: "Insider Data Leak",
      priority: "Medium",
      status: "Review",
      assignedTo: "Unassigned",
      warrant: "Not Required",
    },
    {
      id: "CIS-004",
      title: "Crypto Laundering",
      priority: "High",
      status: "Closed",
      assignedTo: "Det. Arun Kumar",
      warrant: "Executed",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Management</h1>
          <p className="text-sm text-[#8B949E]">Create, assign, and manage investigations</p>
        </div>
        <button className="btn-primary text-sm py-2">New Case</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cases.map((item) => (
          <div key={item.id} className="glass-card-static overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.1)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#6E7681]">{item.id}</p>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-[#E1E4E8]">
                  {item.priority}
                </span>
              </div>
            </div>
            <div className="p-5 text-sm text-[#E1E4E8] space-y-2">
              <p>
                <span className="text-[#6E7681]">Status:</span> {item.status}
              </p>
              <p>
                <span className="text-[#6E7681]">Assigned To:</span> {item.assignedTo}
              </p>
              <p>
                <span className="text-[#6E7681]">Warrant:</span> {item.warrant}
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button className="btn-secondary text-sm py-2">View Details</button>
              <button className="btn-secondary text-sm py-2">Assign</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
