import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Search, Clock, FilterX, Inbox, AlertOctagon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { getSLAString } from "@/utils/sla";

export function StaffTickets() {
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
            id, title, status, created_at,
            users!tickets_student_id_fkey(name)
          `)
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;
        
        if (data) {
          console.log(`[TEST FLOW: STAFF] Successfully fetched ${data.length} assigned tickets from the database for UUID:`, user.id);
          setTickets(data.map(t => {
            const slaData = getSLAString(t.created_at);
            return {
              id: t.id.split('-')[0].toUpperCase(),
              fullId: t.id,
              student: t.users?.name || "Unknown",
              subject: t.title,
              sla: slaData.text,
              isOverdue: slaData.isOverdue || t.status === 'escalated',
              status: t.status === 'in_progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1),
            };
          }));
        }
      } catch (err) {
        console.error("Error fetching staff tickets:", err);
        setError(err.message || "Failed to load assigned ticket queue.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and resolve tickets assigned to your queue.</p>
      </div>

      {error ? (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
          <ErrorState title="Queue Offline" description={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-sm flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search by ID or Student..." 
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
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <Table className="border-0 min-w-[800px]">
            <TableHeader className="bg-white border-b border-slate-200">
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                     <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-20 rounded-sm bg-slate-100" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    onClick={() => navigate(`/staff/tickets/${ticket.fullId}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">{ticket.id}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{ticket.student}</TableCell>
                    <TableCell className="truncate max-w-[200px] text-slate-700">{ticket.subject}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${ticket.isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                        {ticket.isOverdue ? <AlertOctagon className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {ticket.sla}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status}>{ticket.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                     <EmptyState 
                       icon={Inbox} 
                       title="No assigned tickets" 
                       description={hasActiveFilters ? "Try adjusting your search criteria." : "You have no tickets currently assigned to your queue."} 
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
