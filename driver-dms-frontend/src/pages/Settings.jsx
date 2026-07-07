import { useAuthStore } from "../store/authStore";

export default function Settings() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1>Settings</h1>
      <div className="driver-summary-grid">
        <div>
          <strong>Full Name:</strong> {user?.fullName}
        </div>
        <div>
          <strong>Email:</strong> {user?.email}
        </div>
        <div>
          <strong>Roles:</strong> {user?.roles?.join(", ")}
        </div>
        <div>
          <strong>Session Expires:</strong>{" "}
          {user?.expiresAt ? new Date(user.expiresAt).toLocaleString() : "—"}
        </div>
      </div>
      <p className="text-muted">
        User management (create/edit users, assign roles) is a System Administrator function
        handled via the backend Identity tables — not yet exposed here.
      </p>
    </div>
  );
}
