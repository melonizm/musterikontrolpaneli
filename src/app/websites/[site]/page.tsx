"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ImagePickerModal from "@/components/ImagePickerModal";

interface ImageField {
  key: string;
  label: string;
  category: string;
}

interface TextField {
  key: string;
  label: string;
  placeholder: string;
}

interface PackageInfo {
  id: string;
  slug: string;
  isletmeAdi: string;
  orderIndex: number;
}

const SITE_NAMES: Record<string, string> = {
  disklinigi: "Diş Kliniği",
  guzelliksalonu: "Güzellik Salonu",
};

export default function SiteImagesPage() {
  const params = useParams();
  const site = params.site as string;
  const siteName = SITE_NAMES[site] || site;

  // Paket listesi
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("new");
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Form verileri (local state - DB'ye gitmeden)
  const [images, setImages] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<ImageField[]>([]);
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [textValues, setTextValues] = useState<Record<string, string>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<ImageField | null>(null);

  // Paket listesini ve field tanımlarını çek
  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch(`/api/websites/${site}/images`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
        setFields(data.fields || []);
        setTextFields(data.textFields || []);
      } else {
        setError("Veriler yüklenemedi");
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      setError("Bağlantı hatası");
    }
    setLoading(false);
  }, [site]);

  // Belirli bir paketi yükle
  const loadPackage = useCallback(async (packageId: string) => {
    if (packageId === "new") {
      try {
        const listRes = await fetch(`/api/websites/${site}/images`);
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.packages && listData.packages.length > 0) {
            const templateId = listData.packages[0].id;
            const res = await fetch(`/api/websites/${site}/images?id=${templateId}`);
            if (res.ok) {
              const data = await res.json();
              const imgData = data.images || {};
              setImages(imgData);

              const tv: Record<string, string> = {};
              for (const tf of (listData.textFields || textFields)) {
                if (["isletmeAdi", "slug", "telefon", "eposta", "adres"].includes(tf.key)) {
                  tv[tf.key] = "";
                } else {
                  tv[tf.key] = imgData[tf.key] || "";
                }
              }
              setTextValues(tv);
              setHasChanges(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load template:", err);
      }
      
      // Fallback
      setImages({});
      setTextValues({});
      setHasChanges(false);
      return;
    }

    try {
      const res = await fetch(`/api/websites/${site}/images?id=${packageId}`);
      if (res.ok) {
        const data = await res.json();
        const imgData = data.images || {};
        setImages(imgData);

        // Text alanlarını doldur
        const tv: Record<string, string> = {};
        for (const tf of textFields) {
          tv[tf.key] = imgData[tf.key] || "";
        }
        setTextValues(tv);
        setHasChanges(false);
      }
    } catch (err) {
      console.error("Failed to load package:", err);
    }
  }, [site, textFields]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // İlk paket yüklemesi: paketler yüklendiğinde ilk paketi seç
  useEffect(() => {
    if (packages.length > 0 && !initialLoaded) {
      const firstPkg = packages[0];
      setSelectedPackageId(firstPkg.id);
      setInitialLoaded(true);
    }
  }, [packages, initialLoaded]);

  // Paket değiştiğinde verileri yükle
  useEffect(() => {
    if (selectedPackageId && textFields.length > 0) {
      loadPackage(selectedPackageId);
    }
  }, [selectedPackageId, loadPackage, textFields.length]);

  const handleImageClick = (field: ImageField) => {
    setSelectedField(field);
    setModalOpen(true);
  };

  const handleImageSelected = (field: string, url: string) => {
    setImages((prev) => ({ ...prev, [field]: url }));
    setHasChanges(true);
  };

  const handleTextChange = (key: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleDropdownChange = (value: string) => {
    if (hasChanges) {
      const confirmed = confirm("Kaydedilmemiş değişiklikleriniz var. Devam etmek istiyor musunuz?");
      if (!confirmed) return;
    }
    setSelectedPackageId(value);
  };

  // Toplu kaydet
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    // Tüm verileri birleştir
    const allData: Record<string, string> = { ...images };
    for (const tf of textFields) {
      allData[tf.key] = textValues[tf.key] || "";
    }

    try {
      if (selectedPackageId === "new") {
        // Yeni paket oluştur
        if (!allData.isletmeAdi) {
          setSaveError("İşletme adı zorunludur!");
          setSaving(false);
          return;
        }

        const res = await fetch(`/api/websites/${site}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: allData }),
        });

        if (res.ok) {
          const result = await res.json();
          setSaveSuccess(true);
          setHasChanges(false);
          // Paket listesini yenile
          await fetchPackages();
          // Yeni oluşturulan paketi seç
          setSelectedPackageId(result.id);
        } else {
          const errData = await res.json();
          setSaveError(errData.error || "Kayıt oluşturulamadı");
        }
      } else {
        // Mevcut paketi güncelle
        const res = await fetch(`/api/websites/${site}/images`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedPackageId, data: allData }),
        });

        if (res.ok) {
          setSaveSuccess(true);
          setHasChanges(false);
          // Paket listesini yenile (isletmeAdi değişmiş olabilir)
          await fetchPackages();
        } else {
          const errData = await res.json();
          setSaveError(errData.error || "Güncelleme başarısız");
        }
      }

      if (saveSuccess) {
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError("Bağlantı hatası");
    }

    setSaving(false);
    if (!saveError) {
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // İşletme paketini sil
  const handleDeletePackage = async () => {
    if (selectedPackageId === "new") return;

    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    const pkgName = selectedPkg?.isletmeAdi || "Bu paket";

    const confirmed = confirm(
      `"${pkgName}" işletme paketini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/websites/${site}/images?id=${selectedPackageId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // Paket listesini yenile ve yeni kayıt moduna geç
        await fetchPackages();
        setSelectedPackageId("new");
        setImages({});
        setTextValues({});
        setHasChanges(false);
      } else {
        const errData = await res.json();
        alert(errData.error || "Silme işlemi başarısız");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Bağlantı hatası");
    }
    setDeleting(false);
  };

  // Group fields by category
  const groupedFields: Record<string, ImageField[]> = {};
  fields.forEach((f) => {
    if (!groupedFields[f.category]) groupedFields[f.category] = [];
    groupedFields[f.category].push(f);
  });

  const sortedCategories = Object.keys(groupedFields).sort((a, b) => {
    if (a.includes("Logo")) return -1;
    if (b.includes("Logo")) return 1;
    if (a.includes("İşletme")) return -1;
    if (b.includes("İşletme")) return 1;
    return a.localeCompare(b);
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <div className="site-breadcrumb">
              <Link href="/websites" className="breadcrumb-link">
                Websiteleri
              </Link>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="breadcrumb-current">{siteName}</span>
            </div>
            <h1 className="page-title">{siteName} Yönetim Paneli</h1>
            <p className="page-subtitle">
              İşletme paketlerini yönetin: Yeni oluşturun veya mevcut paketi düzenleyin
            </p>
          </div>
        </div>
      </div>

      {/* Paket Seçici Dropdown */}
      <div className="package-selector">
        <div className="package-selector-header">
          <div className="package-selector-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <label className="package-selector-label" htmlFor="package-dropdown">
            İşletme Paketi
          </label>
        </div>
        <select
          id="package-dropdown"
          className="package-dropdown"
          value={selectedPackageId}
          onChange={(e) => handleDropdownChange(e.target.value)}
        >
          <option value="new">➕ Yeni Kayıt</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.isletmeAdi} {pkg.slug ? `(/${pkg.slug})` : ""}
            </option>
          ))}
        </select>
        {selectedPackageId !== "new" && (
          <button
            className="delete-package-btn"
            onClick={handleDeletePackage}
            disabled={deleting}
            title="İşletme paketini sil"
          >
            {deleting ? (
              <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </button>
        )}
        {hasChanges && (
          <div className="package-unsaved-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Kaydedilmemiş değişiklikler
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Veriler yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* İşletme Bilgileri Formu */}
          {textFields.length > 0 && (
            <div className="business-info-section">
              <div className="business-info-header">
                <div className="business-info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="business-info-title">İşletme Bilgileri</h2>
              </div>

              <div className="business-info-fields">
                {textFields.map((tf) => (
                  <div key={tf.key} className="business-info-field">
                    <label className="form-label" htmlFor={`text-${tf.key}`}>
                      {tf.label}
                      {tf.key === "isletmeAdi" && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
                    </label>
                    <input
                      id={`text-${tf.key}`}
                      type="text"
                      className="form-input"
                      placeholder={tf.placeholder}
                      value={textValues[tf.key] || ""}
                      onChange={(e) => handleTextChange(tf.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Görsel Kategorileri */}
          {sortedCategories.map((category) => (
            <div key={category} className="image-category-section">
              <h2 className="image-category-title">{category}</h2>
              <div className="site-images-grid">
                {groupedFields[category].map((field) => (
                  <div
                    key={field.key}
                    className="site-image-card"
                    onClick={() => handleImageClick(field)}
                    id={`img-${field.key}`}
                  >
                    <div className="site-image-preview">
                      {images[field.key] ? (
                        <img
                          src={images[field.key]}
                          alt={field.label}
                          loading="lazy"
                        />
                      ) : (
                        <div className="site-image-empty">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>Görsel yok</span>
                        </div>
                      )}
                    </div>
                    <div className="site-image-info">
                      <span className="site-image-label">{field.label}</span>
                      <span className="site-image-action">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Değiştir
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Toplu Kaydet Butonu */}
          <div className="package-save-section">
            {saveError && (
              <div className="package-save-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {saveError}
              </div>
            )}
            <button
              className="package-save-btn"
              onClick={handleSaveAll}
              disabled={saving}
              id="save-package-btn"
            >
              {saving ? (
                <>
                  <div className="loading-spinner-small" />
                  Kaydediliyor...
                </>
              ) : saveSuccess ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Kaydedildi!
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {selectedPackageId === "new" ? "Yeni İşletme Paketi Oluştur" : "İşletme Paketini Kaydet"}
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Image Picker Modal */}
      {selectedField && (
        <ImagePickerModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedField(null);
          }}
          fieldKey={selectedField.key}
          fieldLabel={selectedField.label}
          currentUrl={images[selectedField.key] || ""}
          site={site}
          onImageSelected={handleImageSelected}
        />
      )}
    </>
  );
}
