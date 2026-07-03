import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// POST /api/auth/seed - İlk admin kullanıcıyı oluştur
export async function POST() {
  try {
    await dbConnect();

    // Zaten kullanıcı varsa çalışmasın
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: "Kullanıcılar zaten mevcut. Seed devre dışı." },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash("MlhKrtgz2552@_60", 12);

    const admin = await User.create({
      username: "melih",
      displayName: "Melih",
      password: hashedPassword,
      role: "admin",
    });

    return NextResponse.json({
      message: "Admin kullanıcı oluşturuldu",
      user: {
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Seed hatası:", error);
    return NextResponse.json(
      { error: "Seed sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
