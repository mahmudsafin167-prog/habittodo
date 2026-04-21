import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const data = await req.json();

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        color: data.color !== undefined ? data.color : existing.color,
        type: data.type !== undefined ? data.type : existing.type,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    // Tasks/Habits linked to this category will have category_id set to null or cascade delete 
    // depending on schema. We'll manually set them to null to prevent deleting tasks.
    await prisma.task.updateMany({
      where: { category_id: id },
      data: { category_id: null }
    });
    
    await prisma.habit.updateMany({
      where: { category_id: id },
      data: { category_id: null }
    });

    await prisma.category.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
