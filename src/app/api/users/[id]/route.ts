import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

// PUT /api/users/[id] - Kullanıcı güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const { username, displayName, password, role } = await request.json();

    // Kullanıcı adı değişiyorsa benzersizlik kontrolü
    if (username) {
      const existing = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Bu kullanıcı adı zaten mevcut" },
          { status: 409 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (username) updateData.username = username.toLowerCase();
    if (displayName) updateData.displayName = displayName;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Kullanıcı sil (sadece admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    // Kendini silemesin
    if (id === currentUser.userId) {
      return NextResponse.json(
        { error: "Kendinizi silemezsiniz" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ message: "Kullanıcı silindi" });
  } catch (error) {
    console.error("Kullanıcı silme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
