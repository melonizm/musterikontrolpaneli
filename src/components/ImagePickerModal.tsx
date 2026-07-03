"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";

interface CloudinaryImage {
  public_id: string;
  url: string;
  filename: string;
  format: string;
}

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldKey: string;
  fieldLabel: string;
  currentUrl: string;
  site: string;
  onImageSelected: (field: string, url: string) => void;
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  fieldKey,
  fieldLabel,
  currentUrl,
  site,
  onImageSelected,
}: ImagePickerModalProps) {
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Aramayı default olarak kategorinin key'i ile başlat
  const [searchQuery, setSearchQuery] = useState(fieldKey || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal her açıldığında aramayı kategoriye özel yap
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(fieldKey || "");
    }
  }, [isOpen, fieldKey]);

  // Load cloudinary images when modal opens
  const loadImages = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/websites/${site}/cloudinary`);
      if (res.ok) {
        const data = await res.json();
        setCloudinaryImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to load cloudinary images:", err);
    }
    setLoading(false);
    setLoaded(true);
  }, [site, loaded]);

  // Trigger load when modal opens
  if (isOpen && !loaded && !loading) {
    loadImages();
  }

  const filteredImages = useMemo(() => {
    if (!searchQuery) return cloudinaryImages;
    return cloudinaryImages.filter(img => 
      // Arama kriterine uyan VEYA halihazırda seçili olan (sitedeki mevcut) görseli göster
      img.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
      img.public_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.url === currentUrl
    );
  }, [cloudinaryImages, searchQuery, currentUrl]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Dosya ismini temizle 
        let baseName = file.name.split(".")[0].replace(/[^a-zA-Z0-9_-]/g, "_");
        // Yeni yüklenen görsel, arama filtresine takılmasın (veya o kategoriye ait olduğu belli olsun) diye fieldKey ile prefixliyoruz
        let filename = `${fieldKey}_${baseName}_${Math.floor(Date.now() / 1000)}`;
        
        const res = await fetch(`/api/websites/${site}/cloudinary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, filename }),
        });

        if (res.ok) {
          const data = await res.json();
          // Add to list
          setCloudinaryImages((prev) => [
            { public_id: data.public_id, url: data.url, filename: data.filename, format: "" },
            ...prev,
          ]);
          setSelectedUrl(data.url);
          setSearchQuery(fieldKey || ""); // Yüklemeden sonra aramayı temizleme, kategoride kal
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (e: React.MouseEvent, public_id: string, url: string) => {
    e.stopPropagation();
    if (!confirm("Bu görseli kalıcı olarak silmek istediğinize emin misiniz?")) return;
    
    setDeletingId(public_id);
    try {
      const res = await fetch(`/api/websites/${site}/cloudinary`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (res.ok) {
        setCloudinaryImages(prev => prev.filter(img => img.public_id !== public_id));
        if (selectedUrl === url) setSelectedUrl(null);
      } else {
        alert("Görsel silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeletingId(null);
  };

  const handleSave = () => {
    if (!selectedUrl) return;
    // Sadece local state güncelle, DB'ye kaydetme (toplu kaydetme butonu yapacak)
    onImageSelected(fieldKey, selectedUrl);
    handleClose();
  };

  const handleClose = () => {
    setSelectedUrl(null);
    setLoaded(false);
    setCloudinaryImages([]);
    setSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="image-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-picker-header">
          <div>
            <h2 className="image-picker-title">Görsel Değiştir</h2>
            <p className="image-picker-subtitle">{fieldLabel}</p>
          </div>
          <button className="image-picker-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Current Image */}
        <div className="image-picker-current">
          <span className="image-picker-label">Sitedeki Mevcut Görsel</span>
          <div className="image-picker-current-img">
            {currentUrl ? (
              <img src={currentUrl} alt={fieldLabel} />
            ) : (
              <div className="image-picker-no-image">Görsel yok</div>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`image-picker-upload ${dragOver ? "image-picker-upload-active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          {uploading ? (
            <div className="image-picker-uploading">
              <div className="loading-spinner" />
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Yeni Görsel Yükle (Sürükle & Bırak veya Tıkla)</span>
              <span className="image-picker-upload-hint">PNG, JPG, WEBP desteklenir</span>
            </>
          )}
        </div>

        {/* Cloudinary Images Gallery */}
        <div className="image-picker-gallery-header">
          <span className="image-picker-label">Veritabanındaki (Cloudinary) Görseller</span>
          <div className="image-picker-search">
             <input 
               type="text" 
               placeholder="Görsellerde ara (Örn: dolgu, klinifoto1)..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery("")} className="search-clear">✕</button>
             )}
          </div>
        </div>

        {loading ? (
          <div className="image-picker-loading">
            <div className="loading-spinner" />
            <p>Görseller yükleniyor...</p>
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="image-picker-gallery">
            {filteredImages.map((img) => (
              <div
                key={img.public_id}
                className={`image-picker-gallery-item ${selectedUrl === img.url ? "image-picker-gallery-item-selected" : ""} ${currentUrl === img.url ? "image-picker-gallery-item-current" : ""}`}
                onClick={() => setSelectedUrl(img.url)}
              >
                <div className="image-picker-gallery-img-wrapper">
                  <img src={img.url} alt={img.filename} loading="lazy" />
                  
                  {/* Delete Button */}
                  {currentUrl !== img.url && (
                    <button 
                      className="image-picker-delete-btn"
                      onClick={(e) => handleDelete(e, img.public_id, img.url)}
                      disabled={deletingId === img.public_id}
                      title="Sil"
                    >
                      {deletingId === img.public_id ? (
                        <div className="loading-spinner" style={{width: 14, height: 14, borderWidth: 2}} />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                
                <span className="image-picker-gallery-name" title={img.filename}>{img.filename}</span>
                
                {currentUrl === img.url && (
                  <span className="image-picker-badge-current">Kullanımda</span>
                )}
                {selectedUrl === img.url && currentUrl !== img.url && (
                  <span className="image-picker-badge-selected">Seçildi</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="image-picker-empty">
            <p>{searchQuery ? "Arama kriterine uygun görsel bulunamadı." : "Bu klasörde henüz görsel yok."}</p>
            {searchQuery && (
              <button className="btn btn-ghost" onClick={() => setSearchQuery("")}>Aramayı Temizle</button>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="image-picker-footer">
          <button className="btn btn-ghost" onClick={handleClose}>
            İptal
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedUrl || selectedUrl === currentUrl}
          >
            Görseli Seç
          </button>
        </div>
      </div>
    </div>
  );
}
