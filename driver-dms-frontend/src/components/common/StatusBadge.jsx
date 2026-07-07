import { statusColor } from "../../constants/statusTypes";

export default function StatusBadge({ status }) {
  const color = statusColor(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#fff",
        backgroundColor: color,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
