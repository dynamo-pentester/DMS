/**
 * columns: [{ key, label, render?: (row) => node }]
 * rows: array of data objects (each needs an `id`)
 * onRowClick?: (row) => void
 */
export default function DataTable({ columns, rows, onRowClick, emptyMessage = "No records found." }) {
  if (!rows || rows.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "clickable-row" : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
