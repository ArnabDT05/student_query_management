import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Search, FilterX, Archive } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export function AdminTickets() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from('tickets')
          .select(`
            id, priority, status, created_at, title,
            categories(name),
            users!tickets_student_id_fkey(name)
          `)
          .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;

        if (data) {
          setTickets(data.map(t => ({
            id: t.id.split('-')[0].toUpperCase(),
            fullId: t.id,
            student: t.users?.name || "Unknown",
            category: t.categories?.name || "Uncategorized",
            subject: t.title,
            priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
            status: t.status === 'in_progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1),
            date: new Date(t.created_at).toLocaleDateString()
          })));
        }
      } catch (err) {
        console.error("Error fetching all tickets:", err);
        setError(err.message || "Failed to load the ticket queue.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const term = debouncedSearch.toLowerCase();
    const matchesSearch = ticket.id.toLowerCase().includes(term) || ticket.student.toLowerCase().includes(term);
    const matchesFilter = filter === "all" || ticket.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const hasActiveFilters = search !== "" || filter !== "all";

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold nm-heading tracking-tight">All Tickets</h1>
        <p className="text-sm nm-muted mt-1">Admin oversight over the entire system's active queue.</p>
      </div>

      {error ? (
        <div className="nm-card p-2">
          <ErrorState title="Queue Offline" description={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <div className="nm-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between" style={{ borderBottom: "1px solid #cdd5e0" }}>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9aaac4" }} />
            <Input 
              placeholder="Search by ID or Student..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {hasActiveFilters && (
              <Button variant="ghost" className="h-9 px-3" onClick={clearFilters}>
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
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <Table className="border-0 min-w-[900px]">
            <TableHeader className="bg-white border-b border-slate-200">
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                     <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-16 rounded-sm bg-slate-100" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-20 rounded-sm bg-slate-100" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">{ticket.id}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{ticket.student}</TableCell>
                    <TableCell className="truncate max-w-[200px] text-slate-700">{ticket.subject}</TableCell>
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
                  <TableCell colSpan={7} className="py-12">
                     <EmptyState 
                       icon={Archive} 
                       title="No tickets found" 
                       description={hasActiveFilters ? "Try adjusting your search criteria." : "There are currently zero tickets in the entire system Database."} 
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
