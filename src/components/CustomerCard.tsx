"use client";

import Link from "next/link";

interface CustomerCardProps {
  customer: {
    _id: string;
    fullName: string;
    phone: string;
    status: string;
    shouldCallback: boolean;
    callbackDate?: string;
    personality: string[];
    notes: { content: string; createdAt: string }[];
    lastCalledAt?: string;
  };
}

const personalityColors: Record<string, string> = {
  "şüpheci": "tag-orange",
  "istekli": "tag-green",
  "isteksiz": "tag-red",
  "yorgun": "tag-purple",
  "kararsız": "tag-yellow",
  "sinirli": "tag-red",
  "meraklı": "tag-blue",
  "sabırsız": "tag-orange",
  "nazik": "tag-green",
  "soğuk": "tag-gray",
};

const statusLabels: Record<string, { label: string; class: string }> = {
  potansiyel: { label: "Potansiyel", class: "status-potansiyel" },
  kapora_odeyecek: { label: "Kapora Ödeyecek", class: "status-kapora-odeyecek" },
  kapora_odendi: { label: "Kapora Ödendi", class: "status-kapora-odendi" },
  basarisiz: { label: "Başarısız", class: "status-basarisiz" },
};

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isPast(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const statusInfo = statusLabels[customer.status] || statusLabels.potansiyel;
  const lastNote = customer.notes?.length
    ? customer.notes[customer.notes.length - 1]
    : null;

  const callbackUrgent =
    customer.shouldCallback &&
    customer.callbackDate &&
    (isToday(customer.callbackDate) || isPast(customer.callbackDate));

  return (
    <Link href={`/customer/${customer._id}`} className="customer-card" id={`customer-${customer._id}`}>
      {callbackUrgent && <div className="card-urgent-strip" />}

      <div className="card-header">
        <div className="card-info">
          <h3 className="card-name">{customer.fullName}</h3>
          <p className="card-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {customer.phone}
          </p>
        </div>
        <span className={`status-badge ${statusInfo.class}`}>
          {statusInfo.label}
        </span>
      </div>

      {customer.personality.length > 0 && (
        <div className="card-tags">
          {customer.personality.slice(0, 3).map((p) => (
            <span
              key={p}
              className={`personality-tag ${personalityColors[p] || "tag-gray"}`}
            >
              {p}
            </span>
          ))}
          {customer.personality.length > 3 && (
            <span className="personality-tag tag-gray">
              +{customer.personality.length - 3}
            </span>
          )}
        </div>
      )}

      {customer.shouldCallback && customer.callbackDate && (
        <div className={`card-callback ${callbackUrgent ? "callback-urgent" : "callback-normal"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>
            {isPast(customer.callbackDate)
              ? `Gecikmiş: ${formatDate(customer.callbackDate)}`
              : isToday(customer.callbackDate)
              ? "Bugün aranacak"
              : `Arama: ${formatDate(customer.callbackDate)}`}
          </span>
        </div>
      )}

      {lastNote && (
        <p className="card-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {lastNote.content.length > 60
            ? lastNote.content.substring(0, 60) + "..."
            : lastNote.content}
        </p>
      )}
    </Link>
  );
}
