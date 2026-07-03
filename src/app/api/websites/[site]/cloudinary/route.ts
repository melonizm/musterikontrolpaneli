import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { SITE_CONFIGS } from "@/lib/website-db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: List all images in the Cloudinary folder for this site
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

    // Search for all images in the Cloudinary account to ensure we don't miss old images in the root directory
    const result = await cloudinary.api.resources({
      type: "upload",
      max_results: 500,
    });

    const images = result.resources
      .map((img: Record<string, string>) => ({
        public_id: img.public_id,
        url: img.secure_url,
        filename: img.public_id.split("/").pop() || img.public_id,
        format: img.format,
        created_at: img.created_at,
      }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ images, folder: config.cloudinaryFolder });
  } catch (error) {
    console.error("Error listing Cloudinary images:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    );
  }
}

// POST: Upload a new image to Cloudinary
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
    const { image, filename } = body; // image is base64 data URL

    if (!image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }

    const folder = config.cloudinaryFolder;

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder,
      public_id: filename || undefined,
      overwrite: false,
      resource_type: "image",
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      filename: uploadResult.public_id.split("/").pop(),
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an image from Cloudinary
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

    const body = await request.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json({ error: "public_id is required" }, { status: 400 });
    }

    await cloudinary.uploader.destroy(public_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
