import { NextResponse } from "next/server";

import { getCurrentUser } from "@/auth/app-auth";
import { getEssayReviewForUser } from "@/server/essay-memory-store";

type ReviewRouteProps = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_request: Request, { params }: ReviewRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attemptId } = await params;

  try {
    const review = getEssayReviewForUser(attemptId, user.id);

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch {
    return NextResponse.json(
      { error: "Review material is available only after submission." },
      { status: 403 },
    );
  }
}
