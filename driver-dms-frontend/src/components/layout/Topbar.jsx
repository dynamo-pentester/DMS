import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div />
      <div className="topbar-user">
        <span className="topbar-name">{user?.fullName}</span>
        <span className="topbar-roles">{user?.roles?.join(", ")}</span>
        <button className="btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
