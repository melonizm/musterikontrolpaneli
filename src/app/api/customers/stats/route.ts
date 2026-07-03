import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";

// GET /api/customers/stats - Dashboard istatistikleri
export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [total, active, todayCallbacks, overdue] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: { $in: ["kapora_odeyecek", "kapora_odendi"] } }),
      Customer.countDocuments({
        shouldCallback: true,
        callbackDate: { $gte: todayStart, $lt: todayEnd },
      }),
      Customer.countDocuments({
        shouldCallback: true,
        callbackDate: { $lt: todayStart },
      }),
    ]);

    return NextResponse.json({
      total,
      active,
      todayCallbacks,
      overdue,
    });
  } catch (error) {
    console.error("İstatistik hatası:", error);
    return NextResponse.json(
      { error: "İstatistikler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
