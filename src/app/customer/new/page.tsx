"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerForm from "@/components/CustomerForm";

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Müşteri eklenirken hata oluştu");
    }

    router.push("/");
  };

  return (
    <>
      <Link href="/" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Ana Sayfaya Dön
      </Link>

      <div className="page-header">
        <h1 className="page-title">Yeni Müşteri Ekle</h1>
        <p className="page-subtitle">Yeni müşteri bilgilerini girin</p>
      </div>

      <CustomerForm onSubmit={handleSubmit} />
    </>
  );
}
