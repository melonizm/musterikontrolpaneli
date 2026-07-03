import { NextRequest, NextResponse } from "next/server";
import { getWebsiteDbConnection, SITE_CONFIGS } from "@/lib/website-db";
import { ObjectId } from "mongodb";

// Slug oluşturma yardımcı fonksiyonu
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET: Tüm işletme paketlerini listele, veya belirli bir paketi getir (?id=xxx)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  try {
    const { site } = await params;
    const config = SITE_CONFIGS[site];
    if (!config) {
      return NextResponse.json({ error: "Unknown site" }, { status: 400 });
    }

    const conn = await getWebsiteDbConnection(site);
    const collection = conn.collection(config.collectionName);

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("id");

    if (packageId) {
      // Belirli bir paketi getir
      let doc;
      try {
        doc = await collection.findOne({ _id: new ObjectId(packageId) });
      } catch {
        doc = await collection.findOne({ slug: packageId });
      }

      if (!doc) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }

      const { _id, __v, createdAt, updatedAt, ...imageData } = doc;

      return NextResponse.json({
        id: _id.toString(),
        images: imageData,
        fields: config.imageFields,
        textFields: config.textFields,
      });
    }

    // Tüm paketleri listele (dropdown için)
    const docs = await collection.find({}).sort({ _id: 1 }).toArray();

    const packages = docs.map((doc, index) => ({
      id: doc._id.toString(),
      slug: doc.slug || "",
      isletmeAdi: doc.isletmeAdi || `İşletme ${index + 1}`,
      orderIndex: index + 1,
    }));

    return NextResponse.json({
      packages,
      fields: config.imageFields,
      textFields: config.textFields,
    });
  } catch (error) {
    console.error("Error fetching website packages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Yeni işletme paketi oluştur (tüm veriler toplu)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  try {
    const { site } = await params;
    const config = SITE_CONFIGS[site];
    if (!config) {
      return NextResponse.json({ error: "Unknown site" }, { status: 400 });
    }

    const body = await request.json();
    const { data } = body; // data: { isletmeAdi, adres, telefon, eposta, favicon, klinikfoto1, ... }

    if (!data || !data.isletmeAdi) {
      return NextResponse.json(
        { error: "İşletme adı gerekli" },
        { status: 400 }
      );
    }

    const conn = await getWebsiteDbConnection(site);
    const collection = conn.collection(config.collectionName);

    // Slug oluştur
    const slug = createSlug(data.isletmeAdi);

    // Aynı slug varsa hata dön
    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Bu işletme adıyla bir kayıt zaten mevcut" },
        { status: 409 }
      );
    }

    // Yeni paket oluştur
    const newDoc = {
      ...data,
      slug,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newDoc);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      slug,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Mevcut işletme paketini toplu güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  try {
    const { site } = await params;
    const config = SITE_CONFIGS[site];
    if (!config) {
      return NextResponse.json({ error: "Unknown site" }, { status: 400 });
    }

    const body = await request.json();
    const { id, data } = body; // id: MongoDB _id, data: tüm alanlar

    if (!id || !data) {
      return NextResponse.json(
        { error: "id and data are required" },
        { status: 400 }
      );
    }

    const conn = await getWebsiteDbConnection(site);
    const collection = conn.collection(config.collectionName);

    // Slug güncelle (isletmeAdi değiştiyse)
    if (data.isletmeAdi) {
      const newSlug = createSlug(data.isletmeAdi);
      // Aynı slug başka bir kayıtta varsa hata dön
      const existing = await collection.findOne({
        slug: newSlug,
        _id: { $ne: new ObjectId(id) },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Bu işletme adıyla başka bir kayıt zaten mevcut" },
          { status: 409 }
        );
      }
      data.slug = newSlug;
    }

    data.updatedAt = new Date();

    // _id, __v gibi alanları temizle
    delete data._id;
    delete data.__v;

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );

    return NextResponse.json({
      success: true,
      id,
      slug: data.slug,
    });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: İşletme paketini sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  try {
    const { site } = await params;
    const config = SITE_CONFIGS[site];
    if (!config) {
      return NextResponse.json({ error: "Unknown site" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("id");

    if (!packageId) {
      return NextResponse.json(
        { error: "id parametresi gerekli" },
        { status: 400 }
      );
    }

    const conn = await getWebsiteDbConnection(site);
    const collection = conn.collection(config.collectionName);

    let result;
    try {
      result = await collection.deleteOne({ _id: new ObjectId(packageId) });
    } catch {
      result = await collection.deleteOne({ slug: packageId });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Paket bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
