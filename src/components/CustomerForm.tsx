"use client";

import { useState } from "react";
import PersonalityTags from "./PersonalityTags";

interface CustomerFormProps {
  initialData?: {
    fullName: string;
    phone: string;
    email: string;
    status: string;
    shouldCallback: boolean;
    callbackDate: string;
    callbackNote: string;
    personality: string[];
    interests: string[];
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isEdit?: boolean;
}

// Yerel saat diliminde datetime-local formatı (YYYY-MM-DDTHH:MM)
function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CustomerForm({
  initialData,
  onSubmit,
  isEdit = false,
}: CustomerFormProps) {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    status: initialData?.status || "potansiyel",
    shouldCallback: initialData?.shouldCallback || false,
    callbackDate: initialData?.callbackDate
      ? toLocalDatetimeString(new Date(initialData.callbackDate))
      : "",
    callbackNote: initialData?.callbackNote || "",
    personality: initialData?.personality || [],
    interests: initialData?.interests || [],
  });

  const [interestInput, setInterestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      // Geri aranacak işaretlendiğinde otomatik şu anki tarih/saat doldur
      if (name === "shouldCallback" && newValue === true && !prev.callbackDate) {
        updated.callbackDate = toLocalDatetimeString(new Date());
      }

      return updated;
    });
  };

  const addInterest = () => {
    const interest = interestInput.trim();
    if (interest && !formData.interests.includes(interest)) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, interest],
      }));
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submitData: Record<string, unknown> = { ...formData };
      if (!formData.shouldCallback) {
        submitData.callbackDate = null;
        submitData.callbackNote = "";
      }
      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form">
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

      <div className="form-grid">
        {/* Temel Bilgiler */}
        <div className="form-section">
          <h3 className="form-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Temel Bilgiler
          </h3>

          <div className="form-field">
            <label htmlFor="fullName" className="form-label">Ad Soyad *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Müşteri adı soyadı"
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone" className="form-label">Telefon Numarası *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="05XX XXX XX XX"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email" className="form-label">E-posta</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="ornek@mail.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="status" className="form-label">Durum</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              <option value="potansiyel">Potansiyel</option>
              <option value="kapora_odeyecek">Kapora Ödeyecek</option>
              <option value="kapora_odendi">Kapora Ödendi (Kalanı Bekleniyor)</option>
              <option value="basarisiz">Başarısız</option>
            </select>
          </div>
        </div>

        {/* Geri Arama */}
        <div className="form-section">
          <h3 className="form-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Geri Arama
          </h3>

          <div className="form-field">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="shouldCallback"
                checked={formData.shouldCallback}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span className="checkbox-custom" />
              Geri aranacak
            </label>
          </div>

          {formData.shouldCallback && (
            <>
              <div className="form-field">
                <label htmlFor="callbackDate" className="form-label">Arama Tarihi ve Saati</label>
                <input
                  id="callbackDate"
                  name="callbackDate"
                  type="datetime-local"
                  value={formData.callbackDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="callbackNote" className="form-label">Arama Notu</label>
                <textarea
                  id="callbackNote"
                  name="callbackNote"
                  value={formData.callbackNote}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={2}
                  placeholder="Bu aramada neler konuşulacak..."
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kişilik Etiketleri */}
      <PersonalityTags
        selected={formData.personality}
        onChange={(tags) => setFormData((prev) => ({ ...prev, personality: tags }))}
      />

      {/* İlgi Alanları */}
      <div className="interests-section">
        <label className="form-label">İlgi Alanları</label>
        <div className="interest-tags">
          {formData.interests.map((interest) => (
            <span key={interest} className="interest-tag">
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="interest-remove"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="custom-tag-input">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addInterest();
              }
            }}
            placeholder="İlgi alanı ekle..."
            className="form-input custom-tag-field"
          />
          <button
            type="button"
            onClick={addInterest}
            className="btn btn-sm btn-secondary"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg"
          id="submit-customer"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isEdit ? "Güncelle" : "Müşteri Ekle"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
