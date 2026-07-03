import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

// GET /api/users - Kullanıcı listesi (sadece admin)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Kullanıcı listesi hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// POST /api/users - Yeni kullanıcı oluştur (sadece admin)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    await dbConnect();
    const { username, displayName, password, role } = await request.json();

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı, görünen isim ve şifre zorunludur" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten mevcut" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: username.toLowerCase(),
      displayName,
      password: hashedPassword,
      role: role || "user",
    });

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kullanıcı ekleme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
