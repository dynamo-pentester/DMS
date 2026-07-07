import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/drivers", label: "Drivers" },
  { to: "/licenses", label: "Licenses" },
  { to: "/medical-records", label: "Medical Records" },
  { to: "/trainings", label: "Trainings" },
  { to: "/incidents", label: "Incidents" },
  { to: "/plant-movements", label: "Plant Movements" },
  { to: "/transporters", label: "Transporters" },
  { to: "/notifications", label: "Notifications" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">DriverDMS</div>
      <nav>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
