/**
 * US7 - Enhanced Notification Service
 * Centralizes triggered alerts and error logging
 */
import { supabase } from "./supabaseClient";

/**
 * Sends an internal notification to a user.
 * Logs failures for future audit.
 */
export async function sendNotification(userId, message) {
  if (!userId || !message) {
    console.error("[NOTIF SERVICE] Missing userId or message for notification");
    return;
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        message: message,
        is_read: false
      }]);

    if (error) throw error;
    
    console.log(`[NOTIF SERVICE] Sent to ${userId}: ${message.slice(0, 30)}...`);
  } catch (err) {
    console.error(`[NOTIF SERVICE] CRITICAL FAILURE: Failed to deliver notification to ${userId}.`, err);
    // In a real app, you might log this to an external service like Sentry or Loggly here.
  }
}

/**
 * Placeholder for Email/SMS integration logic
 */
export async function sendExternalNotification(email, message) {
  console.log(`[EXTERNAL NOTIF] Mock Email sent to ${email}: ${message}`);
  // Integration with SendGrid/Twilio would happen here.
}
