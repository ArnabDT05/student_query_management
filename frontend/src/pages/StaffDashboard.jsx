import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { getSLAString } from "@/utils/sla";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertCircle, Clock, Ticket } from "lucide-react";

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Pending Tickets", value: 0, icon: Clock, iconColor: "#fdcb6e", iconBg: "#fffbeb" },
    { label: "Escalated Tickets", value: 0, icon: AlertCircle, iconColor: "#e17055", iconBg: "#fdeae8" },
  ]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("id, status, created_at, title, users!tickets_student_id_fkey(name)")
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        let pendingCount = 0;
        let escalatedCount = 0;

        const recent = data.slice(0, 5).map(t => {
          const slaData = getSLAString(t.created_at);
          return {
            rawId: t.id,
            id: `T-${t.id.slice(0, 4).toUpperCase()}`,
            student: t.users?.name || "Unknown",
            subject: t.title,
            sla: slaData.text,
            isOverdue: slaData.isOverdue || t.status === "escalated",
            status: t.status === "in_progress" ? "In Progress" :
                    t.status === "open" ? "Open" :
                    t.status === "escalated" ? "Escalated" : "Closed",
          };
        });

        data.forEach(t => {
          if (t.status === "open" || t.status === "in_progress") pendingCount++;
          if (t.status === "escalated") escalatedCount++;
        });

        setStats([
          { label: "Pending Tickets", value: pendingCount, icon: Clock, iconColor: "#fdcb6e", iconBg: "#fffbeb" },
          { label: "Escalated Tickets", value: escalatedCount, icon: AlertCircle, iconColor: "#e17055", iconBg: "#fdeae8" },
        ]);
        setTickets(recent);
      } catch (error) {
        console.error("Error fetching staff dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold nm-heading tracking-tight">Staff Dashboard</h1>
        <p className="text-sm nm-muted mt-1">Overview of your assigned tickets and SLA performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={`stat-${i}`} className="h-[110px] w-full" />
            ))
          : stats.map((stat) => (
              <div key={stat.label} className="nm-card px-6 py-5 flex items-center gap-5">
                <div
                  className="p-3 rounded-[12px] flex items-center justify-center"
                  style={{ background: stat.iconBg, boxShadow: "3px 3px 8px #a3b1c644, -3px -3px 8px #ffffff88" }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.iconColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold nm-muted">{stat.label}</p>
                  <p className="nm-stat-number mt-1">{stat.value}</p>
                </div>
              </div>
            ))
        }
      </div>

      {/* Table */}
      <div className="nm-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #cdd5e0" }}>
          <h2 className="text-base font-bold nm-heading">Recent Assigned Tickets</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`t-skel-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <Table className="border-0">
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.rawId}
                  onClick={() => navigate(`/staff/tickets/${ticket.rawId}`)}
                >
                  <TableCell className="font-semibold nm-heading">{ticket.id}</TableCell>
                  <TableCell>{ticket.student}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{ticket.subject}</TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-semibold flex items-center gap-1.5"
                      style={{ color: ticket.isOverdue ? "#e17055" : "#7c8db5" }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {ticket.sla}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.status}>{ticket.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={Ticket}
              title="No pending tickets"
              description="You have no tickets assigned to your queue at this moment."
            />
          </div>
        )}
      </div>
    </div>
  );
}
