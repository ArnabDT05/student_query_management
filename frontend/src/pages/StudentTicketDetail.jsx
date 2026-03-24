import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Paperclip, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

export function StudentTicketDetail() {
  const { id: shortId } = useParams();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchThread = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        // Since we are using standard UUIDs, textSearch isn't perfect for UUID prefix
        // Instead, grab all for this student and filter locally for the short URL match to be ultra safe
        const { data: allTickets } = await supabase
          .from('tickets')
          .select('*, categories(name)')
          .eq('student_id', user.id);
          
        const matchedTicket = allTickets?.find(t => t.id.startsWith(shortId.toLowerCase()));
        
        if (!matchedTicket) throw new Error("Ticket not found.");
        setTicket(matchedTicket);

        // Fetch Responses
        const { data: responsesData, error: responsesErr } = await supabase
          .from('responses')
          .select('*, users(name, role)')
          .eq('ticket_id', matchedTicket.id)
          .order('created_at', { ascending: true });

        if (responsesErr) throw responsesErr;

        setMessages(responsesData || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load ticket details.");
      } finally {
        setLoading(false);
      }
    };
    fetchThread();
  }, [user, shortId]);

  const handleReply = async () => {
    if (!replyText.trim() || !ticket) return;
    setIsSubmitting(true);
    
    try {
      const { data: newResponse, error } = await supabase
        .from('responses')
        .insert([{
          ticket_id: ticket.id,
          sender_id: user.id,
          message: replyText.trim()
        }])
        .select('*, users(name, role)')
        .single();
        
      if (error) throw error;
      
      setMessages([...messages, newResponse]);
      setReplyText("");
      
      if (ticket.assigned_to) {
        await supabase.from('notifications').insert({
          user_id: ticket.assigned_to,
          message: `Student replied to Ticket ${ticket.id.split('-')[0].toUpperCase()}`
        });
      }
    } catch (err) {
      toast.error("Failed to send message.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-12 text-center text-slate-500">Ticket not found.</div>;
  }

  const statusDisplay = ticket.status === 'in_progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="-ml-4 mb-2 text-slate-500 hover:text-slate-900">
          <Link to="/student/tickets">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ticket {shortId}</h1>
          <Badge variant={statusDisplay}>{statusDisplay}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Query Info & Responses */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 leading-tight">{ticket.title}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {ticket.categories?.name || "Uncategorized"} • {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority • Submitted {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Description</h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-[500px]">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Conversation</h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-slate-400 mt-10">No messages yet.</div>
              ) : (
                messages.map((msg) => {
                  const isStaff = msg.users?.role !== "student";
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col w-full max-w-[80%]",
                        isStaff ? "self-start" : "self-end items-end"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {isStaff ? msg.users?.name : "You"}
                        </span>
                        <span className="text-xs text-slate-400">
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div 
                        className={cn(
                          "px-4 py-3 rounded-sm text-sm border shadow-sm whitespace-pre-wrap",
                          isStaff 
                            ? "bg-white border-slate-200 text-slate-800"
                            : "bg-primary-600 border-primary-700 text-white"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSubmitting || ticket.status === 'closed' || ticket.status === 'resolved'}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
                  className="flex-1 h-10 px-3 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  placeholder={ticket.status === 'closed' || ticket.status === 'resolved' ? "Ticket closed. Replies disabled." : "Type a reply..."}
                />
                <Button 
                  onClick={handleReply} 
                  disabled={!replyText.trim() || isSubmitting || ticket.status === 'closed' || ticket.status === 'resolved'}
                  isLoading={isSubmitting}
                >
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Reply</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline (Simplified for DB) */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm h-fit">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Timeline</h2>
          </div>
          <div className="p-6">
            <div className="relative border-l border-slate-200 ml-3 space-y-8">
                <div className="relative pl-6">
                  <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full ring-4 ring-white bg-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Created</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="relative pl-6">
                  <span className={cn("absolute -left-[5px] top-1 h-2 w-2 rounded-full ring-4 ring-white", ticket.status !== 'open' ? "bg-primary-600" : "bg-slate-200")} />
                  <div>
                    <p className={cn("text-sm font-medium", ticket.status !== 'open' ? "text-slate-900" : "text-slate-500")}>In Progress</p>
                    {ticket.status !== 'open' && <p className="text-xs text-slate-500 mt-1">{new Date(ticket.updated_at).toLocaleString()}</p>}
                  </div>
                </div>
                <div className="relative pl-6">
                  <span className={cn("absolute -left-[5px] top-1 h-2 w-2 rounded-full ring-4 ring-white", (ticket.status === 'resolved' || ticket.status === 'closed') ? "bg-primary-600" : "bg-slate-200")} />
                  <div>
                    <p className={cn("text-sm font-medium", (ticket.status === 'resolved' || ticket.status === 'closed') ? "text-slate-900" : "text-slate-500")}>Resolved</p>
                  </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
