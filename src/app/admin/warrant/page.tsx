export default function AdminWarrantPage() {
  const warrants = [
    {
      id: "W-2024-001",
      caseId: "CIS-002",
      type: "Search",
      status: "Pending",
      requestedBy: "Det. Priya Mehta",
    },
    {
      id: "W-2024-002",
      caseId: "CIS-004",
      type: "Arrest",
      status: "Approved",
      requestedBy: "Det. Arun Kumar",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Warrant Approval</h1>
          <p className="text-sm text-[#8B949E]">Review and process warrants</p>
        </div>
        <button className="btn-primary text-sm py-2">Request Warrant</button>
      </div>

      <div className="glass-card-static overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr className="text-xs text-[#8B949E] uppercase tracking-wider">
              <th className="text-left px-6 py-3">Warrant ID</th>
              <th className="text-left px-4 py-3">Case</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Requested By</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {warrants.map((w) => (
              <tr key={w.id} className="table-row">
                <td className="px-6 py-3 text-[#E1E4E8]">{w.id}</td>
                <td className="px-4 py-3 text-white">{w.caseId}</td>
                <td className="px-4 py-3 text-[#E1E4E8]">{w.type}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-[#E1E4E8]">
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#E1E4E8]">{w.requestedBy}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs py-1">Approve</button>
                    <button className="btn-secondary text-xs py-1">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
