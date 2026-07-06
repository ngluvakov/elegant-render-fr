import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Automatic reference preparation is no longer available and nothing was charged. Add a clear image of the furniture or decor and start the generation directly.",
    },
    { status: 410 },
  );
}
