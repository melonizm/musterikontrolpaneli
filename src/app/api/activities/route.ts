import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Activity from "@/models/Activity";

// GET /api/activities - Aktivite loglarını listele
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId") || "";
    const customerId = searchParams.get("customerId") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (userId) query.userId = userId;
    if (customerId) query.customerId = customerId;

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Aktivite listesi hatası:", error);
    return NextResponse.json(
      { error: "Aktiviteler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
