import { NextResponse } from "next/server";

import { requireUser } from "@/auth/app-auth";
import { getSafeQuestionForUser } from "@/server/practice-memory-store";

type PracticeQuestionRouteProps = {
  params: Promise<{ sessionId: string; position: string }>;
};

export async function GET(
  _request: Request,
  { params }: PracticeQuestionRouteProps,
) {
  const user = await requireUser();
  const { sessionId, position } = await params;
  const question = getSafeQuestionForUser({
    sessionId,
    userId: user.id,
    position: Number(position),
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  return NextResponse.json({ question });
}
