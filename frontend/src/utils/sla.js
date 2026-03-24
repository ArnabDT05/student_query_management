import { supabase } from "@/services/supabaseClient";

export async function checkAndEscalateTickets() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find tickets older than 24h that are not closed, resolved, or already escalated
    const { data: overdueTickets, error } = await supabase
      .from('tickets')
      .select('id, student_id')
      .lt('created_at', twentyFourHoursAgo)
      .not('status', 'in', '("closed","resolved","escalated")');

    if (error) {
      console.error("SLA Check Error:", error);
      return;
    }

    if (!overdueTickets || overdueTickets.length === 0) {
      return; // No breached tickets
    }

    const ticketIds = overdueTickets.map(t => t.id);

    // Update them to escalated
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'escalated' })
      .in('id', ticketIds);

    if (updateError) {
      console.error("Failed to escalate tickets:", updateError);
      return;
    }

    // Optionally notify admins and students
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
    const adminId = admins?.[0]?.id;

    const notifications = [];
    overdueTickets.forEach(t => {
      const shortId = t.id.split('-')[0].toUpperCase();
      notifications.push({
        user_id: t.student_id,
        message: `Your ticket ${shortId} has breached the 24h SLA and has been automatically Escalated to Admin oversight.`
      });
      if (adminId) {
        notifications.push({
          user_id: adminId,
          message: `SLA Breach: Ticket ${shortId} has breached the 24h SLA and has been automatically Escalated!`
        });
      }
    });

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
    
    console.log(`Successfully escalated ${overdueTickets.length} SLA-breached tickets.`);
  } catch (err) {
    console.error("Critical SLA Engine Failure:", err);
  }
}

export function getSLAString(createdAt) {
  const created = new Date(createdAt).getTime();
  const deadline = created + 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  if (now > deadline) return { text: "SLA Breached", isOverdue: true };
  
  const diffHours = Math.floor((deadline - now) / (1000 * 60 * 60));
  const diffMinutes = Math.floor(((deadline - now) % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return { text: `${diffHours}h ${diffMinutes}m remaining`, isOverdue: false };
  }
  return { text: `${diffMinutes}m remaining`, isOverdue: false };
}
