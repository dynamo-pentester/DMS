import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { ALL_ROLES } from "../constants/roles";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: ALL_ROLES[0],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await registerUser(form);
      setSuccess("Account created. You can now log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || (data?.errors ? data.errors.join(", ") : "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Driver DMS — Register</h2>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        <label>
          Full Name
          <input value={form.fullName} onChange={update("fullName")} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update("email")} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={update("password")} required />
        </label>
        <label>
          Role
          <select value={form.role} onChange={update("role")}>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
