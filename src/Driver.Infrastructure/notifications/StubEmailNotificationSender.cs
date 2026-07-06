using Microsoft.Extensions.Logging;
using DriverDms.Application.Interfaces;

namespace DriverDms.Infrastructure.Notifications;

/// <summary>
/// Deliberate no-op. Registered in DI (Program.cs) so the interface resolves and
/// compiles cleanly, but nothing in the current codebase actually calls SendAsync -
/// see IEmailNotificationSender's own doc comment for why. Swap this registration
/// for a real SMTP/SendGrid/etc implementation once the client confirms a provider;
/// no other code needs to change.
/// </summary>
public class StubEmailNotificationSender : IEmailNotificationSender
{
    private readonly ILogger<StubEmailNotificationSender> _logger;

    public StubEmailNotificationSender(ILogger<StubEmailNotificationSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string body)
    {
        _logger.LogWarning(
            "StubEmailNotificationSender.SendAsync was called but is a no-op - " +
            "no email provider is configured yet. Intended recipient: {ToEmail}, subject: {Subject}",
            toEmail, subject);
        return Task.CompletedTask;
    }
}
