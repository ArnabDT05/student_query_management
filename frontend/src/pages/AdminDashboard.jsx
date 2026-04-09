import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Ticket, Clock, CheckCircle, BarChart3, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from "recharts";

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    avgResolutionHrs: 0,
  });

  const [categoryData, setCategoryData] = useState([]);
  const [staffData, setStaffData] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ticketsResponse, usersResponse] = await Promise.all([
          supabase.from("tickets").select("id, status, created_at, updated_at, category_id, assigned_to, categories(name), users!tickets_assigned_to_fkey(name)"),
          supabase.from("users").select("id, name").eq("role", "staff")
        ]);

        if (ticketsResponse.error) throw ticketsResponse.error;
        if (usersResponse.error) throw usersResponse.error;

        const tickets = ticketsResponse.data;
        const total = tickets.length;
        let openCount = 0;
        let closedCount = 0;
        let totalResolutionMs = 0;
        let resolvedCount = 0;

        const catMap = {};
        const staffMap = {};

        tickets.forEach(ticket => {
          if (ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "escalated") {
            openCount++;
          } else {
            closedCount++;
          }

          if (ticket.status === "resolved" || ticket.status === "closed") {
            resolvedCount++;
            const created = new Date(ticket.created_at).getTime();
            const updated = new Date(ticket.updated_at).getTime();
            totalResolutionMs += (updated - created);
          }

          const catName = ticket.categories?.name || "Uncategorized";
          catMap[catName] = (catMap[catName] || 0) + 1;

          if (ticket.assigned_to && ticket.users) {
            const staffName = ticket.users.name;
            if (!staffMap[staffName]) staffMap[staffName] = { name: staffName, open: 0, resolved: 0 };
            if (ticket.status === "resolved" || ticket.status === "closed") {
              staffMap[staffName].resolved++;
            } else {
              staffMap[staffName].open++;
            }
          }
        });

        const avgHrs = resolvedCount > 0 ? (totalResolutionMs / resolvedCount) / (1000 * 60 * 60) : 0;

        setMetrics({
          totalTickets: total,
          openTickets: openCount,
          closedTickets: closedCount,
          avgResolutionHrs: avgHrs.toFixed(1)
        });

        setCategoryData(Object.entries(catMap).map(([name, count]) => ({ name, tickets: count })).sort((a, b) => b.tickets - a.tickets).slice(0, 6));
        setStaffData(Object.values(staffMap).sort((a, b) => (b.open + b.resolved) - (a.open + a.resolved)).slice(0, 5));
      } catch (err) {
        console.error("Aggregation Failure:", err);
        setError(err.message || "Failed to load global system metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const stats = [
    { label: "Total Tickets", value: metrics.totalTickets, icon: Ticket },
    { label: "Avg Resolution", value: `${metrics.avgResolutionHrs} hrs`, icon: Clock },
    { label: "Open / Closed", value: `${metrics.openTickets} / ${metrics.closedTickets}`, icon: CheckCircle },
  ];

  if (error) {
    return (
      <div className="pt-12">
        <ErrorState title="Metrics Offline" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    background: "#e0e5ec",
    border: "none",
    borderRadius: "12px",
    boxShadow: "4px 4px 10px #a3b1c6, -4px -4px 10px #ffffff",
    color: "#4a4a6a",
    fontSize: "12px"
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold nm-heading tracking-tight">Admin Reports &amp; Overview</h1>
        <p className="text-sm nm-muted mt-1">Live system-wide metrics, aggregations, and performance indicators.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="nm-card px-6 py-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold nm-muted">{stat.label}</p>
              <div
                className="p-2 rounded-[10px]"
                style={{ background: "#6c63ff18", boxShadow: "2px 2px 6px #a3b1c644" }}
              >
                <stat.icon className="w-4 h-4" style={{ color: "#6c63ff" }} />
              </div>
            </div>
            <p className="nm-stat-number mt-3">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Volume */}
        <div className="nm-card p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: "#6c63ff18", boxShadow: "2px 2px 6px #a3b1c644" }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: "#6c63ff" }} />
            </div>
            <h3 className="text-base font-bold nm-heading">Ticket Volume by Category</h3>
          </div>
          <div className="flex-1 w-full relative">
            {categoryData.length > 0 ? (
              <div className="w-full h-full ml-[-15px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cdd5e0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7c8db5" }} dy={10} interval={0} angle={-30} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#7c8db5" }} />
                    <Tooltip cursor={{ fill: "#d8dde855" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="tickets" fill="#6c63ff" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center nm-muted text-sm">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="w-8 h-8 nm-muted" style={{ color: "#b0bfcf" }} />
                  <span>Not enough ticket data</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Staff Workload */}
        <div className="nm-card p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: "#00b89418", boxShadow: "2px 2px 6px #a3b1c644" }}
            >
              <Users className="w-4 h-4" style={{ color: "#00b894" }} />
            </div>
            <h3 className="text-base font-bold nm-heading">Top Staff Workload Output</h3>
          </div>
          <div className="flex-1 w-full relative">
            {staffData.length > 0 ? (
              <div className="w-full h-full ml-[-15px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#cdd5e0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#7c8db5" }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4a4a6a", fontWeight: 600 }} dx={-10} />
                    <Tooltip cursor={{ fill: "#d8dde855" }} contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px", color: "#7c8db5" }} />
                    <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#00b894" radius={[0, 0, 0, 0]} barSize={28} />
                    <Bar dataKey="open" name="Open" stackId="a" fill="#6c63ff" radius={[0, 4, 4, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center nm-muted text-sm">
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-8 h-8" style={{ color: "#b0bfcf" }} />
                  <span>No assigned staff tickets found</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
