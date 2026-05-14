import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Automatska priprema referenci više nije dostupna i ništa nije naplaćeno. Dodajte jasnu sliku nameštaja/dekora i pokrenite obradu direktno.",
    },
    { status: 410 },
  );
}
