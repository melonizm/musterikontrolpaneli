"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CustomerForm from "@/components/CustomerForm";
import NotesList from "@/components/NotesList";

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  status: string;
  shouldCallback: boolean;
  callbackDate: string;
  callbackNote: string;
  personality: string[];
  interests: string[];
  notes: { _id?: string; content: string; createdAt: string }[];
  lastCalledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      } else if (res.status === 404) {
        router.push("/");
      }
    } catch (error) {
      console.error("Müşteri yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleUpdate = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Güncelleme sırasında hata oluştu");
    }

    const updated = await res.json();
    setCustomer(updated);
    showToast("success", "Müşteri bilgileri güncellendi");
  };

  const handleAddNote = async (content: string) => {
    if (!customer) return;

    const newNote = {
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...customer.notes, newNote];

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCustomer(updated);
        showToast("success", "Not eklendi");
      }
    } catch (error) {
      console.error("Not eklenemedi:", error);
      showToast("error", "Not eklenirken hata oluştu");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      } else {
        showToast("error", "Silme işlemi başarısız oldu");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
      showToast("error", "Bir hata oluştu");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleMarkCalled = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastCalledAt: new Date().toISOString(),
          shouldCallback: false,
          callbackDate: null,
          callbackNote: "",
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCustomer(updated);
        showToast("success", "Müşteri arandı olarak işaretlendi");
      }
    } catch (error) {
      console.error("İşaretleme hatası:", error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Müşteri bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="empty-state">
        <p>Müşteri bulunamadı</p>
        <Link href="/" className="btn btn-primary btn-md" style={{ marginTop: 16 }}>
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Ana Sayfaya Dön
      </Link>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{customer.fullName}</h1>
          <p className="page-subtitle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {customer.phone}
            {customer.lastCalledAt && (
              <span style={{ marginLeft: 16, color: "var(--text-muted)" }}>
                Son arama: {new Date(customer.lastCalledAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>

        <div className="detail-actions">
          {customer.shouldCallback && (
            <button
              onClick={handleMarkCalled}
              className="btn btn-secondary btn-md"
              id="mark-called-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Arandı İşaretle
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger btn-md"
            id="delete-customer-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Sil
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-full">
          <CustomerForm
            initialData={customer}
            onSubmit={handleUpdate}
            isEdit
          />
        </div>

        <div className="detail-full">
          <NotesList notes={customer.notes} onAddNote={handleAddNote} />
        </div>
      </div>

      {/* Silme Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Müşteriyi Sil</h3>
            <p className="modal-text">
              <strong>{customer.fullName}</strong> adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary btn-md"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger btn-md"
                id="confirm-delete-btn"
              >
                {deleting ? (
                  <>
                    <span className="spinner" />
                    Siliniyor...
                  </>
                ) : (
                  "Evet, Sil"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "success" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}
