import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Admin/User.css";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { getUserList, updateUserStatus, resetUserPassword, createManagedUser, updateManagedUser } from "../../api/userManagement";


const ROLES = ["All Roles", "Officer", "Citizen", "Admin"];

// ── Create User Modal ──────────────────────────────────────
function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "officer",
    district: "",
    badgeNumber: "",
    division: "",
    status: "Active",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }

    if (form.password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setCreating(true);
      await onCreate({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        district: form.district.trim(),
        badgeNumber: form.badgeNumber.trim(),
        division: form.division.trim(),
        isActive: form.status === "Active",
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user account.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Create New User</h3>
          <button className="um-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="um-modal-form" onSubmit={submit}>
          {error && (
            <div style={{ color: "#b91c1c", fontSize: "12px", fontWeight: 600 }}>
              {error}
            </div>
          )}
          <div className="um-field">
            <label>Full Name</label>
            <input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="e.g. Kasun Silva" required/>
          </div>
          <div className="um-field">
            <label>Email / ID</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="user@crimson.gov.lk" required/>
          </div>
          <div className="um-field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 8 characters" required/>
          </div>
          <div className="um-field-row">
            <div className="um-field">
              <label>Role</label>
              <select value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="officer">Officer</option>
                <option value="citizen">Citizen</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="um-field">
              <label>District</label>
              <input value={form.district} onChange={e => set("district", e.target.value)} placeholder="e.g. Colombo"/>
            </div>
          </div>
          {form.role === "officer" && (
            <div className="um-field-row">
              <div className="um-field">
                <label>Badge Number</label>
                <input value={form.badgeNumber} onChange={e => set("badgeNumber", e.target.value)} placeholder="e.g. SLC-8821"/>
              </div>
              <div className="um-field">
                <label>Division</label>
                <input value={form.division} onChange={e => set("division", e.target.value)} placeholder="e.g. Western Province"/>
              </div>
            </div>
          )}
          <div className="um-field">
            <label>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </div>
          <div className="um-modal-actions">
            <button type="button" className="um-cancel" onClick={onClose} disabled={creating}>Cancel</button>
            <button type="submit" className="um-submit" disabled={creating}>{creating ? "Creating..." : "Create User"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View User Modal ───────────────────────────────────────
function ViewUserModal({ user, onClose }) {
  const field = (label, value) => (
    <div className="um-field">
      <label>{label}</label>
      <div style={{ padding: "8px 10px", background: "#f4f5f7", borderRadius: 6, fontSize: 13, color: "#333" }}>{value || "—"}</div>
    </div>
  );
  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>User Details</h3>
          <button className="um-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="um-modal-form">
          {field("Full Name", user.fullName || user.name)}
          {field("Email", user.email)}
          <div className="um-field-row">
            {field("Role", user.role)}
            {field("District", user.district)}
          </div>
          {(user.role === "officer" || user.badgeNumber) && (
            <div className="um-field-row">
              {field("Badge Number", user.badgeNumber)}
              {field("Division", user.division)}
            </div>
          )}
          <div className="um-field-row">
            {field("Status", user.status)}
            {field("Last Login", user.lastLogin)}
          </div>
          {field("User ID", user.displayId)}
          <div className="um-modal-actions">
            <button type="button" className="um-submit" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit User Modal ────────────────────────────────────────
function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: user.fullName || user.name || "",
    email: user.email || "",
    role: (user.role || "citizen").toLowerCase(),
    district: user.district || "",
    badgeNumber: user.badgeNumber || "",
    division: user.division || "",
    status: user.status || "Active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    try {
      setSaving(true);
      await onSave(user._id || user.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        district: form.district.trim(),
        badgeNumber: form.badgeNumber.trim(),
        division: form.division.trim(),
        isActive: form.status === "Active",
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <h3>Edit User</h3>
          <button className="um-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="um-modal-form" onSubmit={submit}>
          {error && <div style={{ color: "#b91c1c", fontSize: "12px", fontWeight: 600 }}>{error}</div>}
          <div className="um-field">
            <label>Full Name</label>
            <input value={form.fullName} onChange={e => set("fullName", e.target.value)} required/>
          </div>
          <div className="um-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required/>
          </div>
          <div className="um-field-row">
            <div className="um-field">
              <label>Role</label>
              <select value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="officer">Officer</option>
                <option value="citizen">Citizen</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="um-field">
              <label>District</label>
              <input value={form.district} onChange={e => set("district", e.target.value)} placeholder="e.g. Colombo"/>
            </div>
          </div>
          {form.role === "officer" && (
            <div className="um-field-row">
              <div className="um-field">
                <label>Badge Number</label>
                <input value={form.badgeNumber} onChange={e => set("badgeNumber", e.target.value)}/>
              </div>
              <div className="um-field">
                <label>Division</label>
                <input value={form.division} onChange={e => set("division", e.target.value)}/>
              </div>
            </div>
          )}
          <div className="um-field">
            <label>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </div>
          <div className="um-modal-actions">
            <button type="button" className="um-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="um-submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Role Badge ─────────────────────────────────────────────
function RoleBadge({ role }) {
  const icons = {
    Officer: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      </svg>
    ),
    Citizen: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    Admin: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20 12h-2M6 12H4M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 20v-2M12 6V4"/>
      </svg>
    ),
  };
  return (
    <span className={`role-badge rb-${role.toLowerCase()}`}>
      {icons[role]}
      {role}
    </span>
  );
}

// ── Action Buttons ─────────────────────────────────────────
function ActionBtns({ user, onView, onEdit, onReset, onToggle }) {
  const isSuspended = (user.status || (user.isActive ? "Active" : "Suspended")) === "Suspended";

  return (
    <div className="action-btns">
      {/* View */}
      <button className="act-btn" title="View" onClick={() => onView(user)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      {/* Edit */}
      <button className="act-btn" title="Edit" onClick={() => onEdit(user)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      {/* Reset */}
      <button className="act-btn" title="Reset Password" onClick={() => onReset(user)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
      {/* Suspend/Activate toggle */}
      <button
        className={`act-btn ${isSuspended ? "act-activate" : "act-suspend"}`}
        title={isSuspended ? "Activate" : "Suspend"}
        onClick={() => onToggle(user)}
      >
        {isSuspended ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [totalUsers,    setTotalUsers]    = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [showCreate, setShowCreate] = useState(false);
  const [viewUser,   setViewUser]   = useState(null);
  const [editUser,   setEditUser]   = useState(null);
  const [page,       setPage]       = useState(1);
  const [toast,      setToast]      = useState(null);

  const fetchUsers = async (targetPage = page, targetRole = roleFilter, targetSearch = search) => {
    setLoading(true);
    try {
      const res = await getUserList(targetPage, targetRole, targetSearch || null);
      const responseData = res.data.data || res.data;
      setUsers(responseData.users || []);
      setTotalUsers(responseData.pagination?.total || 0);
      setTotalPages(responseData.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      handleAdminAuthFailure(err, "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from backend
  useEffect(() => {
    fetchUsers(page, roleFilter, search);
  }, [page, roleFilter, search]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdminAuthFailure = (err, fallbackMessage) => {
    const statusCode = err?.response?.status;

    if (statusCode === 401 || statusCode === 403) {
      showToast("Admin session expired. Please log in again.");
      navigate("/admin/login", { replace: true });
      return;
    }

    showToast(fallbackMessage);
  };

  const createUser = async (payload) => {
    try {
      const res = await createManagedUser(payload);
      const createdUser = res.data?.data?.user;

      if (!createdUser) {
        throw new Error("Invalid create-user response");
      }

      if (page !== 1 || roleFilter !== "All Roles" || search) {
        setPage(1);
        setRoleFilter("All Roles");
        setSearch("");
      } else {
        await fetchUsers(1, "All Roles", "");
      }

      showToast(`${createdUser.role} account created: ${createdUser.email}`);
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to create user account");
      throw err;
    }
  };

  const toggleStatus = async (user) => {
    try {
      const currentlyActive = typeof user.isActive === "boolean"
        ? user.isActive
        : (user.status || "Active") !== "Suspended";
      const nextIsActive = !currentlyActive;
      const targetId = user._id || user.id;

      await updateUserStatus(targetId, nextIsActive);
      setUsers(prev => prev.map(u => {
        const rowId = u._id || u.id;
        return rowId === targetId
          ? { ...u, status: nextIsActive ? "Active" : "Suspended", isActive: nextIsActive }
          : u;
      }));

      showToast(`${user.fullName || user.name} has been ${nextIsActive ? "activated" : "suspended"}.`);
    } catch (err) {
      console.error("Failed to update user status:", err);
      handleAdminAuthFailure(err, "Failed to update user status");
    }
  };

  const handleEdit = async (userId, payload) => {
    try {
      const res = await updateManagedUser(userId, payload);
      const updated = res.data?.data?.user;
      setUsers(prev => prev.map(u => {
        const rowId = u._id || u.id;
        return rowId === userId
          ? { ...u, ...updated, status: updated.isActive ? "Active" : "Suspended", lastLogin: u.lastLogin }
          : u;
      }));
      showToast("User updated successfully.");
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to update user");
      throw err;
    }
  };

  const handleResetPassword = async (user) => {
    try {
      await resetUserPassword(user._id || user.id);
      showToast(`Password reset email sent to ${user.email}`);
    } catch (err) {
      console.error("Failed to reset password:", err);
      handleAdminAuthFailure(err, "Failed to send password reset");
    }
  };

  // Users already filtered from backend, no local filtering needed


  return (
    <div className="um-page admin-with-sidebar">
      <AdminSidebar />

      {/* ── Header ── */}
      <div className="um-header">
        <div>
          <h1 className="um-title">User Management</h1>
          <p className="um-subtitle">Manage, filter, and audit all system user accounts.</p>
        </div>
        <button className="um-create-btn" onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New User
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="um-filter-bar">
        <div className="um-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="um-search"
            placeholder="Search by name, email or user ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="um-filter-right">
          <span className="um-role-label">ROLE:</span>
          <div className="um-role-select-wrap">
            <select
              className="um-role-select"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            >
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="role-arrow">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          <button className="um-icon-btn" title="Export">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button className="um-icon-btn" title="Filters">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>USER ID</th>
              <th>NAME &amp; EMAIL</th>
              <th>ROLE</th>
              <th>DISTRICT</th>
              <th>STATUS</th>
              <th>LAST LOGIN</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#999" }}>Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="um-empty">No users match your search.</td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} style={{"--ri": `${i * 0.05}s`}}>
                  <td className="um-td-id">{u.displayId || `USR-${String(u.id || '').slice(-4).toUpperCase()}`}</td>
                  <td className="um-td-name">
                    <p className="um-name">{u.fullName || u.name}</p>
                    <p className="um-email">{u.email}</p>
                  </td>
                  <td><RoleBadge role={u.role}/></td>
                  <td className="um-td-district">{u.district}</td>
                  <td>
                    <span className={`status-pill sp-${(u.status || (u.isActive ? "Active" : "Suspended")).toLowerCase()}`}>
                      <span className="sp-dot"/>
                      {u.status || (u.isActive ? "Active" : "Suspended")}
                    </span>
                  </td>
                  <td className="um-td-login">{u.lastLogin}</td>
                  <td>
                    <ActionBtns
                      user={u}
                      onView={u => setViewUser(u)}
                      onEdit={u => setEditUser(u)}
                      onReset={handleResetPassword}
                      onToggle={toggleStatus}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="um-table-footer">
          <span className="um-count">Showing page {page} of {totalPages || 1} ({totalUsers} total users)</span>
          <div className="um-pagination">
            <button
              className="pg-nav"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >‹</button>

            {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`pg-btn ${page === p ? "pg-active" : ""}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              );
            })}
            <span className="pg-ellipsis">…</span>
            <button
              className={`pg-btn ${page === totalPages ? "pg-active" : ""}`}
              onClick={() => setPage(totalPages)}
            >{totalPages}</button>

            <button
              className="pg-nav"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >›</button>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="um-footer-note">
        © 2024 CRIMSON National Security Systems. All activities are logged for auditing purposes.
      </p>

      {/* Create Modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreate={createUser}
        />
      )}

      {/* View Modal */}
      {viewUser && (
        <ViewUserModal
          user={viewUser}
          onClose={() => setViewUser(null)}
        />
      )}

      {/* Edit Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleEdit}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="um-toast">{toast}</div>
      )}
    </div>
  );
}