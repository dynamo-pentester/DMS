import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, UserCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import AppTable from "@/components/common/AppTable";
import Pagination from "@/components/common/Pagination";
import AppModal from "@/components/common/AppModal";
import DeleteDialog from "@/components/common/DeleteDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { api } from "@/api/axiosInstance";
import type { AppUser, CreateUserRequest, UpdateUserRequest } from "@/types/user";

const AVAILABLE_ROLES = [
  "SystemAdministrator",
  "Employee",
  "SafetyOfficer",
  "GateSecurity",
  "TransportCoordinator",
  "Manager",
];

const roleColors: Record<string, string> = {
  SystemAdministrator:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Employee:             "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  SafetyOfficer:        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  GateSecurity:         "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  TransportCoordinator: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  Manager:              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function UsersList() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [formData, setFormData] = useState<any>({
    firstName: "", lastName: "", email: "", userName: "", password: "", confirmPassword: "",
    phoneNumber: "", role: "", isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users", { params: { page, pageSize: PAGE_SIZE } });
      setUsers(res.data.items || res.data || []);
      setTotalCount(res.data.totalCount || res.data.length || 0);
    } catch { toast.error("Failed to load users"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ firstName: "", lastName: "", email: "", userName: "", password: "", confirmPassword: "", phoneNumber: "", role: "", isActive: true });
    setFormOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, userName: user.userName, password: "", confirmPassword: "", phoneNumber: user.phoneNumber || "", role: user.roles?.[0] || "", isActive: user.isActive });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match"); return;
    }
    try {
      setSubmitting(true);
      if (editingUser) {
        const payload: UpdateUserRequest = { firstName: formData.firstName, lastName: formData.lastName, phoneNumber: formData.phoneNumber, role: formData.role, isActive: formData.isActive };
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success("User updated");
      } else {
        const payload: CreateUserRequest = { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, userName: formData.userName, password: formData.password, phoneNumber: formData.phoneNumber, role: formData.role };
        await api.post("/users", payload);
        toast.success("User created");
      }
      setFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save user");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteOpen) return;
    try {
      setDeleting(true);
      await api.delete(`/users/${deleteOpen.id}`);
      toast.success("User removed");
      setDeleteOpen(null);
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || "Delete failed"); } finally { setDeleting(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPwOpen) return;
    try {
      setResetSubmitting(true);
      await api.post(`/users/${resetPwOpen.id}/reset-password`, { newPassword });
      toast.success("Password reset successfully");
      setResetPwOpen(null);
      setNewPassword("");
    } catch (err: any) { toast.error(err.response?.data?.message || "Password reset failed"); } finally { setResetSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system user accounts, role assignments, and access permissions. Restricted to System Administrators."
        actions={
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
            <Plus size={18} /> Add User
          </button>
        }
      />

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_ROLES.map(r => (
          <span key={r} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleColors[r] || "bg-slate-100 text-slate-600"}`}>
            {r.replace(/([A-Z])/g, " $1").trim()}
          </span>
        ))}
      </div>

      <AppTable
        loading={loading} data={users}
        emptyTitle="No users found"
        emptyDescription="Create user accounts to grant access to the DMS system."
        columns={[
          {
            key: "name", header: "User",
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                  {(row.firstName?.[0] || "") + (row.lastName?.[0] || "")}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</p>
                  <p className="text-xs text-slate-500">{row.email}</p>
                </div>
              </div>
            )
          },
          { key: "userName", header: "Username" },
          {
            key: "roles", header: "Role",
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {(row.roles || []).map((r: string) => (
                  <span key={r} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleColors[r] || "bg-slate-100 text-slate-600"}`}>
                    {r.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ))}
              </div>
            )
          },
          { key: "phoneNumber", header: "Phone", render: (row) => row.phoneNumber || "—" },
          {
            key: "isActive", header: "Status",
            render: (row) => <StatusBadge status={row.isActive ? "Active" : "Inactive"} />
          },
          {
            key: "actions", header: "",
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setResetPwOpen(row)} title="Reset Password"
                  className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500">
                  <UserCheck size={14} />
                </button>
                <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500"><PencilIcon /></button>
                <button onClick={() => setDeleteOpen(row)} className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"><TrashIcon /></button>
              </div>
            )
          },
        ]}
      />

      <Pagination currentPage={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />

      {/* User Form Modal */}
      <AppModal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingUser ? "Edit User" : "Create New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">First Name *</label>
              <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Last Name *</label>
              <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          {!editingUser && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Email *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Username *</label>
                  <input type="text" required value={formData.userName} onChange={e => setFormData({ ...formData, userName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Password *</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Confirm Password *</label>
                  <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500">Phone</label>
              <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500">Role *</label>
              <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="">Select Role</option>
                {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r.replace(/([A-Z])/g, " $1").trim()}</option>)}
              </select>
            </div>
          </div>
          {editingUser && (
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
              Account Active
            </label>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {editingUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Reset Password Modal */}
      <AppModal isOpen={!!resetPwOpen} onClose={() => { setResetPwOpen(null); setNewPassword(""); }} title="Reset Password">
        <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Resetting password for <strong>{resetPwOpen?.firstName} {resetPwOpen?.lastName}</strong>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">New Password *</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => { setResetPwOpen(null); setNewPassword(""); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800">Cancel</button>
            <button type="submit" disabled={resetSubmitting} className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Reset Password</button>
          </div>
        </form>
      </AppModal>

      <DeleteDialog isOpen={!!deleteOpen} onClose={() => setDeleteOpen(null)} onConfirm={handleDelete} loading={deleting}
        message={`Remove user account for ${deleteOpen?.firstName} ${deleteOpen?.lastName}? They will lose all access to the system.`} />
    </div>
  );
}

const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default UsersList;
