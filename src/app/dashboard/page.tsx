"use client";

import OfficerGrid from "@/components/officer/OfficerGrid";
import { logout } from "@/lib/auth-actions";
import {
    AlertTriangle,
    BarChart3,
    Briefcase,
    Calendar,
    FileIcon,
    FolderIcon,
    LogOut,
    Mail,
    Menu,
    MoreVertical,
    Plus,
    Search,
    Settings,
    Shield,
    UserCheck,
    UserX,
    UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: "admin" | "officer";
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [caseSearch, setCaseSearch] = useState("");
  const [caseStatus, setCaseStatus] = useState("all");
  const [officerSearch, setOfficerSearch] = useState("");

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

  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(caseSearch.toLowerCase()) ||
      item.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
      item.assignedTo.toLowerCase().includes(caseSearch.toLowerCase());
    const matchesStatus =
      caseStatus === "all" || item.status.toLowerCase() === caseStatus;
    return matchesSearch && matchesStatus;
  });

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

  const filteredOfficers = officers.filter((officer) => {
    const q = officerSearch.toLowerCase();
    return (
      officer.name.toLowerCase().includes(q) ||
      officer.code.toLowerCase().includes(q) ||
      officer.unit.toLowerCase().includes(q) ||
      officer.email.toLowerCase().includes(q)
    );
  });

  const totalOfficers = officers.length;
  const activeOfficers = officers.filter((o) => o.status === "active").length;
  const inactiveOfficers = officers.filter((o) => o.status === "inactive").length;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUser({
          id: "user-id",
          email: "user@example.com",
          role: "admin",
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result?.success) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "cases", label: "Case Management", icon: FolderIcon },
    { id: "officers", label: "Officer Management", icon: UsersIcon },
    { id: "warrants", label: "Warrant Approval", icon: FileIcon },
    { id: "audit", label: "Audit Logs", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#0f172a] border-b border-[#1e293b] sticky top-0 z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">CIS Admin Portal</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 mx-8">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search cases, officers, warrants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded bg-[#1e293b] text-white placeholder-gray-500 border border-[#334155] focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-[#0f172a] border-r border-[#1e293b] p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${
                      activeTab === item.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-[#1e293b]"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 w-full">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Overview</h2>

              {/* Dashboard Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Cases Card */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#1e293b] hover:border-blue-500 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Cases</p>
                      <h3 className="text-3xl font-bold text-white">5</h3>
                    </div>
                    <FolderIcon size={32} className="text-blue-500" />
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Active: </span>
                      <span className="text-green-400 font-semibold">3</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Closed: </span>
                      <span className="text-gray-400 font-semibold">2</span>
                    </div>
                  </div>
                </div>

                {/* Rendering Warrants Card */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#1e293b] hover:border-yellow-500 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Rendering Warrants</p>
                      <h3 className="text-3xl font-bold text-white">1</h3>
                    </div>
                    <FileIcon size={32} className="text-yellow-500" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Review: </span>
                    <span className="text-yellow-400 font-semibold">1</span>
                  </div>
                </div>

                {/* Active Officers Card */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#1e293b] hover:border-purple-500 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Active Officers</p>
                      <h3 className="text-3xl font-bold text-white">3</h3>
                    </div>
                    <UsersIcon size={32} className="text-purple-500" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Inactive: </span>
                    <span className="text-gray-400 font-semibold">2</span>
                  </div>
                </div>

                {/* Unassigned Cases Card */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#1e293b] hover:border-red-500 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Unassigned Cases</p>
                      <h3 className="text-3xl font-bold text-white">1</h3>
                    </div>
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Assigned: </span>
                    <span className="text-green-400 font-semibold">4</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cases" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white">Case Management</h2>
                <p className="text-gray-400">
                  Create, assign, and manage investigations
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition">
                    <Plus size={18} />
                    New Case
                  </button>
                </div>

                <div className="flex flex-1 gap-3 max-w-2xl w-full">
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Search by case ID, title, officer..."
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded bg-[#1e293b] text-white placeholder-gray-500 border border-[#334155] focus:border-blue-500 transition"
                    />
                  </div>

                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value)}
                    className="bg-[#1e293b] text-white border border-[#334155] rounded px-3 py-2 min-w-[140px] focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="review">Review</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCases.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 space-y-4 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Case ID</p>
                        <p className="text-sm font-semibold text-white">{item.id}</p>
                      </div>
                      <button className="text-gray-500 hover:text-white">
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Title</p>
                      <p className="text-white font-medium">{item.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Priority</p>
                        <span className="inline-block px-2 py-1 rounded bg-blue-900 text-blue-200 text-xs">
                          {item.priority}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Status</p>
                        <span className="inline-block px-2 py-1 rounded bg-green-900 text-green-200 text-xs capitalize">
                          {item.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Assigned To</p>
                        <p>{item.assignedTo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Warrant</p>
                        <p>{item.warrant}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Shield size={16} />
                      <Mail size={16} />
                      <Calendar size={16} />
                      <Briefcase size={16} />
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition">
                        Assign
                      </button>
                      <button className="flex-1 bg-[#1e293b] hover:bg-[#243049] text-white py-2 rounded text-sm font-medium border border-[#334155] transition">
                        View
                      </button>
                    </div>
                  </div>
                ))}

                {filteredCases.length === 0 && (
                  <div className="col-span-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 text-center text-gray-400">
                    No cases match your filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "officers" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white">Officers Management</h2>
                <p className="text-gray-400">
                  Central Investigation System - Active Detectives
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0f172a] rounded-lg p-5 border border-[#1e293b] flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Officers</p>
                    <p className="text-3xl font-bold text-white">{totalOfficers}</p>
                  </div>
                  <UsersIcon size={32} className="text-blue-500" />
                </div>

                <div className="bg-[#0f172a] rounded-lg p-5 border border-[#1e293b] flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Officers</p>
                    <p className="text-3xl font-bold text-white">{activeOfficers}</p>
                  </div>
                  <UserCheck size={32} className="text-green-500" />
                </div>

                <div className="bg-[#0f172a] rounded-lg p-5 border border-[#1e293b] flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Inactive Officers</p>
                    <p className="text-3xl font-bold text-white">{inactiveOfficers}</p>
                  </div>
                  <UserX size={32} className="text-red-500" />
                </div>
              </div>

              <div className="relative max-w-xl">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search officers by name, code, unit, or email..."
                  value={officerSearch}
                  onChange={(e) => setOfficerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded bg-[#1e293b] text-white placeholder-gray-500 border border-[#334155] focus:border-blue-500 transition"
                />
              </div>

              <OfficerGrid officers={filteredOfficers} />
            </div>
          )}

          {/* Other Tabs Placeholder */}
          {activeTab !== "overview" && activeTab !== "cases" && activeTab !== "officers" && (
            <div className="bg-[#0f172a] rounded-lg p-8 border border-[#1e293b]">
              <h2 className="text-2xl font-bold text-white">
                {menuItems.find((m) => m.id === activeTab)?.label}
              </h2>
              <p className="text-gray-400 mt-4">
                This section is coming soon. Feature details will be added here.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
