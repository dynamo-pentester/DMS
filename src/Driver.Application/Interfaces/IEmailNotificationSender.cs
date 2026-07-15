namespace DriverDms.Application.Interfaces;

/// <summary>
/// INTENTIONALLY NOT WIRED UP YET. This is the seam for when the client confirms
/// an SMTP/email provider (design doc §4.8 - "Notifications" only covers the
/// in-app record today; actual email/SMS delivery was never in the Excel or the
/// covering email, so it isn't built into the active flow).
///
/// NotificationService does not call this. Nothing calls this. It exists so that
/// wiring in real delivery later is a matter of implementing this interface and
/// registering it in Program.cs - not a schema or service-layer change.
/// </summary>
public interface IEmailNotificationSender
{
    Task SendAsync(string toEmail, string subject, string body);
}
