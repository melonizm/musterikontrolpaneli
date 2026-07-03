"use client";

import { useState, useEffect } from "react";

interface User {
  _id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    password: "",
    role: "user",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Kullanıcılar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({ username: "", displayName: "", password: "", role: "user" });
    setEditingUser(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      displayName: user.displayName,
      password: "",
      role: user.role,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingUser) {
        // Güncelleme
        const updateData: Record<string, string> = {
          username: formData.username,
          displayName: formData.displayName,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const res = await fetch(`/api/users/${editingUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (res.ok) {
          setSuccess("Kullanıcı başarıyla güncellendi!");
          resetForm();
          fetchUsers();
        } else {
          const data = await res.json();
          setError(data.error || "Hata oluştu");
        }
      } else {
        // Yeni oluşturma
        if (!formData.password) {
          setError("Yeni kullanıcı için şifre zorunludur");
          setFormLoading(false);
          return;
        }

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setSuccess("Kullanıcı başarıyla oluşturuldu!");
          resetForm();
          fetchUsers();
        } else {
          const data = await res.json();
          setError(data.error || "Hata oluştu");
        }
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Kullanıcı silindi");
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Silme başarısız");
        setDeleteConfirm(null);
      }
    } catch {
      setError("Bağlantı hatası");
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Kullanıcı Yönetimi</h1>
            <p className="page-subtitle">Sisteme erişimi olan kullanıcıları yönetin</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="btn btn-primary btn-md"
            id="add-user-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Kullanıcı
          </button>
        </div>
      </div>

      {success && (
        <div className="toast toast-success" style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      {showForm && (
        <div className="form-section" style={{ maxWidth: 500, marginBottom: 32 }}>
          <h3 className="form-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            {editingUser ? `Düzenle: ${editingUser.displayName}` : "Yeni Kullanıcı Oluştur"}
          </h3>

          {error && (
            <div className="form-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="new-username" className="form-label">Kullanıcı Adı *</label>
              <input
                id="new-username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="form-input"
                placeholder="ornek: ahmet"
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-displayName" className="form-label">Görünen İsim *</label>
              <input
                id="new-displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                className="form-input"
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-password" className="form-label">
                Şifre {editingUser ? "(boş bırakırsan değişmez)" : "*"}
              </label>
              <input
                id="new-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                className="form-input"
                placeholder={editingUser ? "Değiştirmek için yeni şifre girin" : "Güçlü bir şifre girin"}
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-role" className="form-label">Rol</label>
              <select
                id="new-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="form-select"
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Yönetici (Admin)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button type="submit" disabled={formLoading} className="btn btn-primary btn-md">
                {formLoading ? (
                  <><span className="spinner" /> {editingUser ? "Güncelleniyor..." : "Oluşturuluyor..."}</>
                ) : (
                  editingUser ? "Güncelle" : "Oluştur"
                )}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary btn-md">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Kullanıcılar yükleniyor...</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {users.map((user) => (
            <div key={user._id} className="activity-item activity-blue">
              <div className="activity-icon-wrapper">
                <span className="activity-icon">{user.displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-user">{user.displayName}</span>
                  <span className={`status-badge ${user.role === "admin" ? "status-kapora-odendi" : "status-potansiyel"}`}>
                    {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
                  </span>
                </div>
                <p className="activity-details">@{user.username}</p>
                <span className="activity-time">
                  Oluşturulma: {new Date(user.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="user-actions">
                <button
                  onClick={() => startEdit(user)}
                  className="btn btn-secondary btn-sm"
                  title="Düzenle"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {deleteConfirm === user._id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleDelete(user._id)} className="btn btn-danger btn-sm">Evet</button>
                    <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary btn-sm">Hayır</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    className="btn btn-danger btn-sm"
                    title="Sil"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
