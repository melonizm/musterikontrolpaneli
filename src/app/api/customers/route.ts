import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import Activity from "@/models/Activity";
import { getCurrentUser } from "@/lib/auth";

// GET /api/customers - Müşteri listesi (arama, filtreleme, sıralama)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "callback";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    // Arama filtresi
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Durum filtresi
    if (status && status !== "tümü") {
      query.status = status;
    }

    // Toplam kayıt sayısı
    const total = await Customer.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    let customers;
    const now = new Date();

    if (sort === "callback") {
      // Önce bugün aranacaklar, sonra yaklaşan tarihler, sonra son eklenenler
      customers = await Customer.find(query)
        .sort({
          shouldCallback: -1,
          callbackDate: 1,
          createdAt: -1,
        })
        .lean();

      // Manuel sıralama: bugün aranacaklar en üstte
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      customers.sort((a, b) => {
        const aIsToday =
          a.shouldCallback &&
          a.callbackDate &&
          new Date(a.callbackDate) >= todayStart &&
          new Date(a.callbackDate) < todayEnd;
        const bIsToday =
          b.shouldCallback &&
          b.callbackDate &&
          new Date(b.callbackDate) >= todayStart &&
          new Date(b.callbackDate) < todayEnd;

        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;

        const aIsPast =
          a.shouldCallback &&
          a.callbackDate &&
          new Date(a.callbackDate) < todayStart;
        const bIsPast =
          b.shouldCallback &&
          b.callbackDate &&
          new Date(b.callbackDate) < todayStart;

        if (aIsPast && !bIsPast) return -1;
        if (!aIsPast && bIsPast) return 1;

        const aIsFuture =
          a.shouldCallback &&
          a.callbackDate &&
          new Date(a.callbackDate) >= todayEnd;
        const bIsFuture =
          b.shouldCallback &&
          b.callbackDate &&
          new Date(b.callbackDate) >= todayEnd;

        if (aIsFuture && !bIsFuture) return -1;
        if (!aIsFuture && bIsFuture) return 1;

        if (aIsFuture && bIsFuture) {
          return new Date(a.callbackDate!).getTime() - new Date(b.callbackDate!).getTime();
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Manuel sıralama sonrası sayfalama uygula
      const startIndex = (page - 1) * limit;
      customers = customers.slice(startIndex, startIndex + limit);
    } else {
      customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    }

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Müşteri listesi hatası:", error);
    return NextResponse.json(
      { error: "Müşteriler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Yeni müşteri ekle
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Telefon numarası benzersizlik kontrolü
    const existing = await Customer.findOne({ phone: body.phone });
    if (existing) {
      return NextResponse.json(
        { error: "Bu telefon numarası zaten kayıtlı" },
        { status: 409 }
      );
    }

    const customer = await Customer.create(body);

    // Aktivite logla
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await Activity.create({
        userId: currentUser.userId,
        userName: currentUser.displayName,
        action: "ekledi",
        customerId: customer._id,
        customerName: customer.fullName,
        details: `Yeni müşteri eklendi: ${customer.fullName} (${customer.phone})`,
      });
    }

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Müşteri ekleme hatası:", error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).name === "ValidationError") {
      return NextResponse.json(
        { error: "Geçersiz veri: " + (error as Error).message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Müşteri eklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
