import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Download, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("id, status, priority, created_at, updated_at, title, categories(name)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTickets(data || []);

        let openCount = 0;
        let closedCount = 0;
        let totalResMs = 0;
        let resCount = 0;

        data.forEach(t => {
          if (["open", "in_progress", "escalated"].includes(t.status)) openCount++;
          else closedCount++;

          if (["resolved", "closed"].includes(t.status)) {
            resCount++;
            totalResMs += new Date(t.updated_at).getTime() - new Date(t.created_at).getTime();
          }
        });

        setMetrics({
          total: data.length,
          open: openCount,
          closed: closedCount,
          avgHrs: resCount > 0 ? (totalResMs / resCount / (1000 * 60 * 60)).toFixed(1) : 0,
        });

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const exportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      
      const dateStr = new Date().toLocaleString();
      
      // Header
      doc.setFontSize(20);
      doc.text("System Audit Report", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${dateStr}`, 14, 30);
      
      // Metrics Section
      doc.setFontSize(12);
      doc.setTextColor(20);
      doc.text("High-Level Metrics", 14, 45);
      
      doc.setFontSize(10);
      doc.text(`Total Tickets: ${metrics.total}`, 14, 55);
      doc.text(`Open Tickets: ${metrics.open}`, 14, 62);
      doc.text(`Closed/Resolved: ${metrics.closed}`, 80, 55);
      doc.text(`Avg Resolution Time: ${metrics.avgHrs} hrs`, 80, 62);
      
      // Line break
      doc.line(14, 70, 196, 70);
      
      // Table Data
      const tableData = tickets.map(t => [
        t.id.slice(0, 8),
        t.title?.slice(0, 30) + (t.title?.length > 30 ? '...' : ''),
        t.status,
        t.priority,
        t.categories?.name || "None",
        new Date(t.created_at).toLocaleDateString()
      ]);
      
      autoTable(doc, {
        startY: 75,
        head: [['ID', 'Subject', 'Status', 'Priority', 'Category', 'Created At']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
        margin: { top: 75 }
      });
      
      doc.save(`System_Report_${new Date().getTime()}.pdf`);
      toast.success("PDF Report generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (error) return <div className="pt-12"><ErrorState title="Report Error" description={error} /></div>;
  if (loading) return <div className="space-y-6 max-w-5xl mx-auto"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and view detailed system analytics.</p>
        </div>
        <button 
          onClick={exportPDF} 
          disabled={isExporting || !metrics}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          {isExporting ? <AlertCircle className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: metrics?.total, icon: FileText, color: "text-blue-600" },
          { label: "Active/Open", value: metrics?.open, icon: AlertCircle, color: "text-amber-600" },
          { label: "Resolved", value: metrics?.closed, icon: CheckCircle, color: "text-green-600" },
          { label: "Avg Resolution", value: `${metrics?.avgHrs}h`, icon: Clock, color: "text-purple-600" }
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <h3 className="text-sm font-medium text-slate-600">{stat.label}</h3>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">Complete Ticket Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 max-w-[250px] truncate">{t.title}</td>
                  <td className="px-6 py-4">{t.categories?.name || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize">{t.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {tickets.length > 10 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-slate-500 italic">
                    Showing top 10 recent tickets. Export to PDF to view full history ({tickets.length} tickets).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
