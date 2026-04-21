import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date'); 
    
    // Expecting a date to determine which month to fetch
    const dateObj = dateParam ? new Date(dateParam) : new Date();
    
    const start = startOfMonth(dateObj);
    const end = endOfMonth(dateObj);

    const tasks = await prisma.task.findMany({
      where: {
        user_id: auth.uid,
        status: 'completed',
        completed_at: {
          gte: start,
          lte: end,
        }
      },
      select: {
        id: true,
        title: true,
        completed_at: true,
        priority: true,
      }
    });

    const habitLogs = await prisma.habitLog.findMany({
      where: {
        user_id: auth.uid,
        date: {
          gte: start,
          lte: end,
        }
      },
      include: {
        habit: {
          select: {
            title: true,
          }
        }
      }
    });

    return NextResponse.json({ tasks, habitLogs });

  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
