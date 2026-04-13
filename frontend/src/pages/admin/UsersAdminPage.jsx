import { useEffect, useState } from "react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const loadUsers = () => {
    api.get("/users").then((response) => setUsers(response.data.items));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post("/users", form);
    setForm(initialForm);
    loadUsers();
  };

  const toggleActive = async (user) => {
    await api.put(`/users/${user.id}`, {
      isActive: !user.isActive,
      role: user.role === "admin" ? undefined : user.role,
    });
    loadUsers();
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="User management" description="Create sub-admin and user accounts within the same owner-scoped workspace." />

      <div className="grid gap-6 xl:grid-cols-[1fr,1.25fr]">
        <form className="panel p-6" onSubmit={submit}>
          <h2 className="font-display text-2xl text-sand-50">Invite user</h2>
          <div className="mt-5 space-y-4">
            <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" placeholder="Temporary password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="sub_admin">Sub admin</option>
            </select>
            <button type="submit" className="button-primary">
              Create user
            </button>
          </div>
        </form>

        <div className="panel p-6">
          <h2 className="font-display text-2xl text-sand-50">Account users</h2>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="panel-soft flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-semibold text-sand-50">{user.name}</div>
                  <div className="text-sm text-white/55">
                    {user.email} | {user.role}
                  </div>
                </div>
                {user.role !== "admin" ? (
                  <button type="button" className="button-secondary" onClick={() => toggleActive(user)}>
                    {user.isActive ? "Disable" : "Enable"}
                  </button>
                ) : (
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">Owner</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

