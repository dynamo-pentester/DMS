export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <input
      type="text"
      className="search-bar"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
