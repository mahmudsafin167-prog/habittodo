import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const categories = await prisma.category.findMany({
      where: { user_id: auth.uid },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        user_id: auth.uid,
        name: body.name,
        color: body.color || '#4f46e5', // Default to indigo-600
        type: body.type || 'both'
      }
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
