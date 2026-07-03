"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Activity {
  _id: string;
  userName: string;
  action: string;
  customerName?: string;
  customerId?: string;
  details?: string;
  createdAt: string;
}

const actionLabels: Record<string, { label: string; class: string; icon: string }> = {
  ekledi: { label: "Müşteri Ekledi", class: "activity-green", icon: "+" },
  güncelledi: { label: "Güncelledi", class: "activity-blue", icon: "✎" },
  sildi: { label: "Sildi", class: "activity-red", icon: "✕" },
  not_ekledi: { label: "Not Ekledi", class: "activity-purple", icon: "📝" },
  arandi_isaretledi: { label: "Arandı İşaretledi", class: "activity-cyan", icon: "✓" },
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch("/api/activities?limit=100");
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Aktiviteler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Aktivite Geçmişi</h1>
        <p className="page-subtitle">Tüm müşteri işlemlerinin kaydı</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Aktiviteler yükleniyor...</p>
        </div>
      ) : activities.length > 0 ? (
        <div className="activity-timeline">
          {activities.map((activity) => {
            const actionInfo = actionLabels[activity.action] || {
              label: activity.action,
              class: "activity-gray",
              icon: "•",
            };

            return (
              <div key={activity._id} className={`activity-item ${actionInfo.class}`}>
                <div className="activity-icon-wrapper">
                  <span className="activity-icon">{actionInfo.icon}</span>
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-user">{activity.userName}</span>
                    <span className="activity-action-label">{actionInfo.label}</span>
                    {activity.customerName && activity.customerId && (
                      <Link
                        href={`/customer/${activity.customerId}`}
                        className="activity-customer-link"
                      >
                        {activity.customerName}
                      </Link>
                    )}
                    {activity.customerName && !activity.customerId && (
                      <span className="activity-customer-deleted">{activity.customerName}</span>
                    )}
                  </div>
                  {activity.details && (
                    <p className="activity-details">{activity.details}</p>
                  )}
                  <span className="activity-time">
                    {new Date(activity.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p>Henüz aktivite yok</p>
          <p className="empty-hint">Müşteri ekleme, güncelleme veya silme işlemleri burada görünecek</p>
        </div>
      )}
    </>
  );
}
