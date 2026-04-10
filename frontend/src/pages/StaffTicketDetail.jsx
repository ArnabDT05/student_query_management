import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Send, Clock, AlertTriangle, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { getSLAString } from "@/utils/sla";
import { sendNotification } from "@/services/notificationService";

export function StaffTicketDetail() {
  const { id: shortId } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [slaData, setSlaData] = useState({ text: "Checking SLA...", isOverdue: false });
  const [status, setStatus] = useState("open");
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Confirm Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    const fetchThread = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const { data: allTickets } = await supabase
          .from('tickets')
          .select('*, categories(name), users!tickets_student_id_fkey(name, department)')
          .eq('assigned_to', user.id);
          
        const matchedTicket = allTickets?.find(t => t.id.startsWith(shortId.toLowerCase()));
        
        if (!matchedTicket) {
             // Let's try grabbing without staff filter just in case
             const { data: loose } = await supabase.from('tickets').select('*, categories(name), users!tickets_student_id_fkey(name, department)');
             const looseMatched = loose?.find(t => t.id.startsWith(shortId.toLowerCase()));
             if (!looseMatched) throw new Error("Ticket not found.");
             
             // Check permission explicitly here if needed
             setTicket(looseMatched);
             setStatus(looseMatched.status);
             setSlaData(getSLAString(looseMatched.created_at));
        } else {
             setTicket(matchedTicket);
             setStatus(matchedTicket.status);
             setSlaData(getSLAString(matchedTicket.created_at));
        }

        const exactTicketId = matchedTicket ? matchedTicket.id : (await supabase.from('tickets').select('id').then(res => res.data?.find(t => t.id.startsWith(shortId.toLowerCase()))?.id));

        if (!exactTicketId) throw new Error("Could not parse explicit ID constraint.");

        // Fetch Responses
        const { data: responsesData, error: responsesErr } = await supabase
          .from('responses')
          .select('*, users(name, role)')
          .eq('ticket_id', exactTicketId)
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

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === "resolved" || newStatus === "closed") {
      setPendingStatus(newStatus);
      setConfirmModalOpen(true);
    } else {
      // Immediate database update
      const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', ticket.id);
      if (error) {
         toast.error("Failed to update status.");
      } else {
         setStatus(newStatus);
         setTicket({...ticket, status: newStatus});
         toast.success(`Status updated to ${newStatus}`);
         
         if (ticket.student_id) {
           await sendNotification(
             ticket.student_id,
             `Your ticket ${ticket.id.split('-')[0].toUpperCase()} has been updated to ${newStatus}`
           );
         }
         
         if (newStatus === 'escalated') {
           const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
           if (admins && admins.length > 0) {
             await sendNotification(
               admins[0].id,
               `Ticket ${ticket.id.split('-')[0].toUpperCase()} has been urgently Escalated!`
             );
           }
         }
      }
    }
  };

  const confirmStatusChange = async () => {
    console.log(`[TEST FLOW: STAFF] Confirming Ticket Status Change -> Ticket ID:`, ticket.id, `| New Status:`, pendingStatus);
    const { error } = await supabase.from('tickets').update({ status: pendingStatus }).eq('id', ticket.id);
    if (error) {
       console.error(`[TEST FLOW: STAFF] Failed to update ticket status!`, error);
       toast.error("Failed to update status.");
    } else {
       console.log(`[TEST FLOW: STAFF] Ticket status mutated successfully to:`, pendingStatus);
       setStatus(pendingStatus);
       setTicket({...ticket, status: pendingStatus});
       setConfirmModalOpen(false);
       toast.success(`Ticket marked as ${pendingStatus}`);
       
       if (ticket.student_id) {
           await sendNotification(
             ticket.student_id,
             `Your ticket ${ticket.id.split('-')[0].toUpperCase()} has been marked as ${pendingStatus}`
           );
       }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !ticket) return;
    setIsSubmitting(true);
    
    try {
      console.log(`[TEST FLOW: STAFF] Submitting Response -> Ticket ID:`, ticket.id, `| Message:`, replyText);
      // Insert new message
      const { data: newResponse, error } = await supabase
        .from('responses')
        .insert([{
          ticket_id: ticket.id,
          sender_id: user.id,
          message: replyText.trim()
        }])
        .select('*, users(name, role)')
        .single();
        
      if (error) {
        console.error(`[TEST FLOW: STAFF] Failed to insert response!`, error);
        throw error;
      }
      console.log(`[TEST FLOW: STAFF] Response inserted successfully!`);
      setMessages([...messages, newResponse]);
      setReplyText("");
      
      // Notify the student about the staff reply
      if (ticket.student_id) {
         await sendNotification(
           ticket.student_id,
           `Staff replied to your ticket ${ticket.id.split('-')[0].toUpperCase()}`
         );
      }
      
      // Optionally update status to In Progress
      if (status === "open") {
        const { error: updErr } = await supabase.from('tickets').update({ status: 'in_progress' }).eq('id', ticket.id);
        if (!updErr) {
           setStatus("in_progress");
           setTicket({...ticket, status: "in_progress"});
           toast.info("Status automatically updated to In Progress");
           
           // Notify student of status change
           await sendNotification(
             ticket.student_id,
             `Your ticket ${ticket.id.split('-')[0].toUpperCase()} has been marked as In Progress`
           );
        }
      }
    } catch (err) {
      toast.error("Failed to send message.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const statusDisplay = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="-ml-4 mb-2 text-slate-500 hover:text-slate-900 focus:ring-primary-600">
            <Link to="/staff/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ticket {shortId}</h1>
            <Badge variant={statusDisplay}>{statusDisplay}</Badge>
            <span className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-1 rounded-sm border ${slaData.isOverdue || status === 'escalated' ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
              {slaData.isOverdue || status === 'escalated' ? <AlertOctagon className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              SLA: {status === 'escalated' ? 'Escalated' : slaData.text}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={status} onChange={handleStatusChange} className="bg-white capitalize">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Query Info & Responses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 leading-tight">{ticket.title}</h2>
                <p className="text-sm text-slate-500 mt-1">From: {ticket.users?.name} • {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority • Submitted {new Date(ticket.created_at).toLocaleDateString()}</p>
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
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900">Conversation</h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col bg-slate-50/50">
              {messages.length === 0 ? (
                 <div className="text-center text-sm text-slate-400 mt-10">No messages yet. Reply below to interface with the student.</div>
              ) : (
                messages.map((msg) => {
                  const isStaff = msg.users?.role !== "student";
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col w-full max-w-[80%]",
                        isStaff ? "self-end items-end" : "self-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {isStaff ? "You" : msg.users?.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div 
                        className={cn(
                          "px-4 py-3 rounded-sm text-sm border shadow-sm whitespace-pre-wrap",
                          isStaff 
                            ? "bg-primary-600 border-primary-700 text-white"
                            : "bg-white border-slate-200 text-slate-800"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              <Textarea 
                placeholder="Type your reply to the student..." 
                className="min-h-[80px]"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={status === "closed" || status === "resolved" || isSubmitting}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleReply} 
                  disabled={!replyText.trim() || isSubmitting || status === "closed" || status === "resolved"} 
                  isLoading={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Reply to Student
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Student Details */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm h-fit">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Student Info</h2>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <span className="font-medium text-slate-900">{ticket.users?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account ID</span>
                <span className="font-medium text-slate-900 truncate max-w-[120px]" title={ticket.student_id}>{ticket.student_id}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Modal 
        isOpen={confirmModalOpen} 
        onClose={() => setConfirmModalOpen(false)} 
        title={`Confirm ${pendingStatus === 'resolved' ? 'Resolved' : 'Closed'}`}
      >
        <div className="p-2 space-y-6">
          <div className="flex flex-col items-center justify-center text-center px-4">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 border border-amber-100">
               <AlertTriangle className="w-6 h-6" />
             </div>
             <p className="text-slate-600 text-sm">
               Are you sure you want to change the status of this ticket to <strong>{pendingStatus}</strong>?
               {pendingStatus === "closed" && " The student will no longer be able to reply to this conversation. You will not be able to send any further messages."}
             </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmStatusChange} className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600" disabled={isSubmitting}>
              Confirm {pendingStatus}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
