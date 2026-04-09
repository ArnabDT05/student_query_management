import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { MessageSquarePlus, Ticket } from "lucide-react";

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([
    { label: "Open Queries", value: 0 },
    { label: "In Progress", value: 0 },
    { label: "Closed", value: 0 },
  ]);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("id, status, created_at, categories(name)")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        let openCount = 0;
        let inProgressCount = 0;
        let closedCount = 0;

        const recent = data.slice(0, 5).map(t => ({
          rawId: t.id,
          id: `T-${t.id.slice(0, 4).toUpperCase()}`,
          category: t.categories?.name || "Unknown",
          status: t.status === "in_progress" ? "In Progress" :
                  t.status === "open" ? "Open" :
                  t.status === "escalated" ? "Escalated" : "Closed",
          date: new Date(t.created_at).toLocaleDateString()
        }));

        data.forEach(t => {
          if (t.status === "open") openCount++;
          else if (t.status === "in_progress" || t.status === "escalated") inProgressCount++;
          else closedCount++;
        });

        setStats([
          { label: "Open Queries", value: openCount },
          { label: "In Progress", value: inProgressCount },
          { label: "Closed", value: closedCount },
        ]);
        setRecentTickets(recent);
      } catch (err) {
        console.error("Error fetching student dashboard metrics:", err);
        setError(err.message || "Failed to load dashboard metrics. Reconnecting...");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold nm-heading tracking-tight">Dashboard</h1>
          <p className="text-sm nm-muted mt-1">Welcome back, {user?.name}. Here's an overview of your queries.</p>
        </div>
        <Button asChild>
          <Link to="/student/new-query">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            New Query
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="nm-card p-2">
          <ErrorState title="Dashboard Offline" description={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`stat-${i}`} className="h-[110px] w-full" />
                ))
              : stats.map((stat) => (
                  <div key={stat.label} className="nm-card px-6 py-5 flex flex-col justify-center">
                    <p className="text-sm font-semibold nm-muted">{stat.label}</p>
                    <p className="nm-stat-number mt-2">{stat.value}</p>
                  </div>
                ))
            }
          </div>

          {/* Recent Tickets */}
          <div className="nm-card overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: "1px solid #cdd5e0" }}>
              <h2 className="text-base font-bold nm-heading">Recent Tickets</h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`tktskel-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : recentTickets.length > 0 ? (
              <Table className="border-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTickets.map((ticket) => (
                    <TableRow
                      key={ticket.rawId}
                      onClick={() => navigate(`/student/tickets/${ticket.rawId}`)}
                    >
                      <TableCell className="font-semibold nm-heading">{ticket.id}</TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell>
                        <Badge variant={ticket.status}>{ticket.status}</Badge>
                      </TableCell>
                      <TableCell className="nm-muted">{ticket.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={Ticket}
                  title="No recent tickets"
                  description="When you submit new queries, they will appear here."
                  action={
                    <Button variant="secondary" asChild className="mt-4">
                      <Link to="/student/new-query">Create a Query</Link>
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
