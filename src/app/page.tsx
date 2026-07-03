"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import StatsCards from "@/components/StatsCards";
import CustomerCard from "@/components/CustomerCard";

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  status: string;
  shouldCallback: boolean;
  callbackDate?: string;
  personality: string[];
  interests: string[];
  notes: { content: string; createdAt: string }[];
  lastCalledAt?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  todayCallbacks: number;
  overdue: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { value: "tümü", label: "Tümü" },
  { value: "potansiyel", label: "Potansiyel" },
  { value: "kapora_odeyecek", label: "Kapora Ödeyecek" },
  { value: "kapora_odendi", label: "Kapora Ödendi" },
  { value: "basarisiz", label: "Başarısız" },
];

const ITEMS_PER_PAGE = 20;

export default function HomePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, todayCallbacks: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("tümü");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 });

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "tümü") params.set("status", statusFilter);
      params.set("sort", "callback");
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Müşteriler yüklenemedi:", error);
    }
  }, [searchQuery, statusFilter, currentPage]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/customers/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("İstatistikler yüklenemedi:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCustomers(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCustomers, fetchStats]);

  // Arama veya filtre değiştiğinde sayfayı başa al
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Görünür sayfa numaralarını hesapla
  const getVisiblePages = () => {
    const { totalPages } = pagination;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Müşteri Paneli</h1>
            <p className="page-subtitle">Müşterilerinizi yönetin ve takip edin</p>
          </div>
          <Link href="/customer/new" className="btn btn-primary btn-md" id="add-customer-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Yeni Müşteri
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="page-header-actions" style={{ marginBottom: 24 }}>
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`filter-tab ${statusFilter === filter.value ? "filter-tab-active" : ""}`}
            id={`filter-${filter.value}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Müşteriler yükleniyor...</p>
        </div>
      ) : customers.length > 0 ? (
        <>
          <div className="customers-grid">
            {customers.map((customer) => (
              <CustomerCard key={customer._id} customer={customer} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} / {pagination.total} müşteri
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Önceki sayfa"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {getVisiblePages().map((page, idx) =>
                  page === "..." ? (
                    <span key={`dots-${idx}`} className="pagination-dots">…</span>
                  ) : (
                    <button
                      key={page}
                      className={`pagination-btn ${currentPage === page ? "pagination-btn-active" : ""}`}
                      onClick={() => goToPage(page as number)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  aria-label="Sonraki sayfa"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <p>{searchQuery ? "Arama sonucu bulunamadı" : "Henüz müşteri eklenmemiş"}</p>
          <p className="empty-hint">
            {searchQuery
              ? "Farklı bir arama terimi deneyin"
              : "İlk müşterinizi eklemek için 'Yeni Müşteri' butonuna tıklayın"}
          </p>
        </div>
      )}
    </>
  );
}
