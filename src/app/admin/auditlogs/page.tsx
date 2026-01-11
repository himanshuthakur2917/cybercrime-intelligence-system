export default function AdminAuditLogsPage() {
  const logs = [
    {
      id: 1,
      time: "2024-07-01 10:22",
      actor: "admin@cis.gov.in",
      action: "Approved warrant for CIS-002",
      severity: "info",
    },
    {
      id: 2,
      time: "2024-07-02 14:05",
      actor: "det.singh@cis.gov.in",
      action: "Updated case CIS-001 status to Active",
      severity: "low",
    },
    {
      id: 3,
      time: "2024-07-03 09:41",
      actor: "det.mehta@cis.gov.in",
      action: "Exported suspects list",
      severity: "low",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-[#8B949E]">System actions and administrative events</p>
      </div>

      <div className="glass-card-static overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr className="text-xs text-[#8B949E] uppercase tracking-wider">
              <th className="text-left px-6 py-3">Time</th>
              <th className="text-left px-4 py-3">Actor</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {logs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="px-6 py-3 text-[#E1E4E8]">{log.time}</td>
                <td className="px-4 py-3 text-[#E1E4E8]">{log.actor}</td>
                <td className="px-4 py-3 text-white">{log.action}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-[#E1E4E8]">
                    {log.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
