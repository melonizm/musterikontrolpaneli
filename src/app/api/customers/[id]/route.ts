import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import Activity from "@/models/Activity";
import { getCurrentUser } from "@/lib/auth";

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Müşteri detay hatası:", error);
    return NextResponse.json(
      { error: "Müşteri bilgileri yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Telefon numarası değişiyorsa benzersizlik kontrolü
    if (body.phone) {
      const existing = await Customer.findOne({
        phone: body.phone,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Bu telefon numarası başka bir müşteride kayıtlı" },
          { status: 409 }
        );
      }
    }

    // Mevcut veriyi al (değişiklik karşılaştırması için)
    const oldCustomer = await Customer.findById(id).lean();

    const customer = await Customer.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Aktivite logla
    const currentUser = await getCurrentUser();
    if (currentUser && oldCustomer) {
      // Değişiklikleri tespit et
      const changes: string[] = [];
      const fieldLabels: Record<string, string> = {
        fullName: "İsim",
        phone: "Telefon",
        email: "E-posta",
        status: "Durum",
        shouldCallback: "Geri arama",
        callbackDate: "Arama tarihi",
        callbackNote: "Arama notu",
        personality: "Kişilik",
        interests: "İlgi alanları",
      };

      for (const key of Object.keys(fieldLabels)) {
        if (body[key] !== undefined) {
          const oldVal = JSON.stringify(oldCustomer[key as keyof typeof oldCustomer]);
          const newVal = JSON.stringify(body[key]);
          if (oldVal !== newVal) {
            changes.push(`${fieldLabels[key]}: ${oldVal} → ${newVal}`);
          }
        }
      }

      // Not ekleme kontrolü
      const oldNotesLen = oldCustomer.notes?.length || 0;
      const newNotesLen = body.notes?.length || 0;
      const isNoteAdded = body.notes && newNotesLen > oldNotesLen;

      // Arandı işaretleme kontrolü
      const isMarkedCalled = body.lastCalledAt && !oldCustomer.lastCalledAt;

      let action = "güncelledi";
      if (isNoteAdded) action = "not_ekledi";
      if (isMarkedCalled) action = "arandi_isaretledi";

      const details = isNoteAdded
        ? `Not eklendi: "${body.notes[newNotesLen - 1]?.content?.substring(0, 100) || ""}"`
        : isMarkedCalled
        ? "Müşteri arandı olarak işaretlendi"
        : changes.length > 0
        ? changes.join(" | ")
        : "Güncelleme yapıldı";

      await Activity.create({
        userId: currentUser.userId,
        userName: currentUser.displayName,
        action,
        customerId: customer._id,
        customerName: customer.fullName,
        details,
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Müşteri güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Müşteri güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Aktivite logla
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await Activity.create({
        userId: currentUser.userId,
        userName: currentUser.displayName,
        action: "sildi",
        customerId: customer._id,
        customerName: customer.fullName,
        details: `Müşteri silindi: ${customer.fullName} (${customer.phone})`,
      });
    }

    return NextResponse.json({ message: "Müşteri başarıyla silindi" });
  } catch (error) {
    console.error("Müşteri silme hatası:", error);
    return NextResponse.json(
      { error: "Müşteri silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
