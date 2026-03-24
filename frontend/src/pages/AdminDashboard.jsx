import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Ticket, Clock, CheckCircle, BarChart3, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { 
  BarChart, Bar, 
  LineChart, Line, 
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
        console.log(`[TEST FLOW: ADMIN] Booting Admin Dashboard. Fetching system-wide analytics data from tickets...`);
        
        // Parallel fetch for tickets and users
        const [ticketsResponse, usersResponse] = await Promise.all([
          supabase.from('tickets').select('id, status, created_at, updated_at, category_id, assigned_to, categories(name), users!tickets_assigned_to_fkey(name)'),
          supabase.from('users').select('id, name').eq('role', 'staff')
        ]);

        if (ticketsResponse.error) {
           console.error(`[TEST FLOW: ADMIN] Error fetching global tickets data:`, ticketsResponse.error);
           throw ticketsResponse.error;
        }
        if (usersResponse.error) {
           console.error(`[TEST FLOW: ADMIN] Error fetching staff users data:`, usersResponse.error);
           throw usersResponse.error;
        }

        const tickets = ticketsResponse.data;
        
        console.log(`[TEST FLOW: ADMIN] Metrics loaded successfully! Analyzed Volume: ${tickets.length} total tickets.`);
        const total = tickets.length;
        let openCount = 0;
        let closedCount = 0;
        let totalResolutionMs = 0;
        let resolvedCount = 0;
        
        const catMap = {};
        const staffMap = {};

        tickets.forEach(ticket => {
          // Status Metrics
          if (ticket.status === 'open' || ticket.status === 'in_progress' || ticket.status === 'escalated') {
            openCount++;
          } else {
            closedCount++;
          }
          
          // Resolution Mechanics
          if (ticket.status === 'resolved' || ticket.status === 'closed') {
             resolvedCount++;
             const created = new Date(ticket.created_at).getTime();
             const updated = new Date(ticket.updated_at).getTime();
             totalResolutionMs += (updated - created);
          }
          
          // Category Mapping
          const catName = ticket.categories?.name || "Uncategorized";
          catMap[catName] = (catMap[catName] || 0) + 1;
          
          // Staff Mapping
          if (ticket.assigned_to && ticket.users) {
            const staffName = ticket.users.name;
            if (!staffMap[staffName]) staffMap[staffName] = { name: staffName, open: 0, resolved: 0 };
            
            if (ticket.status === 'resolved' || ticket.status === 'closed') {
               staffMap[staffName].resolved++;
            } else {
               staffMap[staffName].open++;
            }
          }
        });

        // Resolve Final Metrics
        const avgHrs = resolvedCount > 0 ? (totalResolutionMs / resolvedCount) / (1000 * 60 * 60) : 0;
        
        setMetrics({
          totalTickets: total,
          openTickets: openCount,
          closedTickets: closedCount,
          avgResolutionHrs: avgHrs.toFixed(1)
        });
        
        // Resolve Charts
        setCategoryData(Object.entries(catMap).map(([name, count]) => ({ name, tickets: count })).sort((a,b) => b.tickets - a.tickets).slice(0, 6)); // Top 6
        setStaffData(Object.values(staffMap).sort((a,b) => (b.open + b.resolved) - (a.open + a.resolved)).slice(0, 5)); // Top 5
        
      } catch (err) {
        console.error("Aggregation Failure:", err);
        setError(err.message || "Failed to load global system metrics. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  const stats = [
    { label: "Total Tickets", value: metrics.totalTickets, icon: Ticket },
    { label: "Avg Resolution", value: `${metrics.avgResolutionHrs} hrs`, icon: Clock },
    { label: "Open vs Closed", value: `${metrics.openTickets} / ${metrics.closedTickets}`, icon: CheckCircle },
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
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
         </div>
       </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Reports & Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Live System-wide metrics, aggregations, and performance indicators.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <stat.icon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Volume */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col p-6 h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Ticket Volume by Category</h3>
          </div>
          <div className="flex-1 w-full relative">
            {categoryData.length > 0 ? (
              <div className="w-full h-full ml-[-15px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={0} angle={-30} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                    />
                    <Bar dataKey="tickets" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                <div className="flex flex-col items-center">
                  <BarChart3 className="w-8 h-8 text-slate-200 mb-2" />
                  <span>Not enough ticket data</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Staff Workload Distribution */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col p-6 h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Top Staff Workload Output</h3>
          </div>
          <div className="flex-1 w-full relative">
            {staffData.length > 0 ? (
              <div className="w-full h-full ml-[-15px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} dx={-10} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Bar dataKey="resolved" name="Resolved Tickets" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={28} />
                    <Bar dataKey="open" name="Open Tickets" stackId="a" fill="#3b82f6" radius={[0, 2, 2, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                <div className="flex flex-col items-center">
                  <Users className="w-8 h-8 text-slate-200 mb-2" />
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
