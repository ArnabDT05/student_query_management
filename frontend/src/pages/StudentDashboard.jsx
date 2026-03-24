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

        // Reduce to latest 5 for the view
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}. Here's an overview of your queries.</p>
        </div>
        <Button asChild>
          <Link to="/student/new-query">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            New Query
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
          <ErrorState title="Dashboard Offline" description={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`stat-${i}`} className="h-[104px] w-full rounded-sm bg-white border border-slate-100" />
          ))
        ) : (
          stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm flex flex-col justify-center">
               <p className="text-sm font-medium text-slate-500">{stat.label}</p>
               <p className="text-3xl font-semibold text-slate-900 mt-2">{stat.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Recent Tickets</h2>
        </div>
        
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`tktskel-${i}`} className="h-12 w-full rounded-sm bg-slate-50" />
            ))}
          </div>
        ) : recentTickets.length > 0 ? (
          <Table className="border-0">
            <TableHeader className="bg-white">
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
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="font-medium text-slate-900">{ticket.id}</TableCell>
                  <TableCell className="text-slate-600">{ticket.category}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.status}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{ticket.date}</TableCell>
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
