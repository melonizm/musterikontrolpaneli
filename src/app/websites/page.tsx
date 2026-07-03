"use client";

import Link from "next/link";

const sites = [
  {
    key: "disklinigi",
    name: "Diş Kliniği",
    description: "Diş kliniği websitesindeki görselleri yönetin",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 6 5 6 8c0 3 1 4 2 6s1 4 1 6c0 1.5.5 2 1.5 2s1.5-1 1.5-2.5c0-1 .5-1.5 1-1.5s1 .5 1 1.5c0 1.5.5 2.5 1.5 2.5s1.5-.5 1.5-2c0-2 0-4 1-6s2-3 2-6c0-3-2-6-6-6z" />
      </svg>
    ),
    color: "#0ea5e9",
  },
  {
    key: "guzelliksalonu",
    name: "Güzellik Salonu",
    description: "Güzellik salonu websitesindeki görselleri yönetin",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    color: "#ec4899",
  },
];

export default function WebsitesPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Websiteleri</h1>
            <p className="page-subtitle">
              Websitelerinizdeki görselleri yönetin ve güncelleyin
            </p>
          </div>
        </div>
      </div>

      <div className="websites-grid">
        {sites.map((site) => (
          <Link
            key={site.key}
            href={`/websites/${site.key}`}
            className="website-card"
            id={`website-${site.key}`}
          >
            <div
              className="website-card-icon"
              style={{ color: site.color, borderColor: `${site.color}30` }}
            >
              {site.icon}
            </div>
            <h2 className="website-card-title">{site.name}</h2>
            <p className="website-card-desc">{site.description}</p>
            <div className="website-card-arrow" style={{ color: site.color }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
