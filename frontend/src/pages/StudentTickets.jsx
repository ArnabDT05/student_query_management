import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Search, Plus, FilterX, Ticket } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export function StudentTickets() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from('tickets')
          .select(`
            id, priority, status, created_at,
            categories(name)
          `)
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;

        if (data) {
          setTickets(data.map(t => ({
            id: t.id.split('-')[0].toUpperCase(),
            fullId: t.id,
            category: t.categories?.name || "Uncategorized",
            priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
            status: t.status === 'in_progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1),
            date: new Date(t.created_at).toLocaleDateString()
          })));
        }
      } catch (err) {
         console.error("Error fetching tickets:", err);
         setError(err.message || "Unable to retrieve your tickets at this time.");
      } finally {
         setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.id.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesFilter = filter === "all" || ticket.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const hasActiveFilters = search !== "" || filter !== "all";

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">View and track the status of your submitted queries.</p>
        </div>
        <Button asChild>
          <Link to="/student/new-query">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
          <ErrorState title="Tickets Offline" description={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-sm flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search by Ticket ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {hasActiveFilters && (
              <Button variant="ghost" className="h-9 px-3 text-slate-500 hover:text-slate-900" onClick={clearFilters}>
                <FilterX className="w-4 h-4 mr-2" /> Clear
              </Button>
            )}
            <Select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 w-full sm:w-48"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <Table className="border-0 min-w-[700px]">
            <TableHeader className="bg-white border-b border-slate-200">
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                     <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-16 rounded-sm bg-slate-100" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-20 rounded-sm bg-slate-100" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    onClick={() => navigate(`/student/tickets/${ticket.fullId}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">{ticket.id}</TableCell>
                    <TableCell className="text-slate-600">{ticket.category}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-sm ${
                        ticket.priority === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                        ticket.priority === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{ticket.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                     <EmptyState 
                       icon={Ticket} 
                       title="No tickets found" 
                       description={hasActiveFilters ? "Try adjusting your search or filters." : "You have not submitted any queries yet."} 
                     />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      )}
    </div>
  );
}
