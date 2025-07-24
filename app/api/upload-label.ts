import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tracking = formData.get("tracking") as string;
    if (!file || !tracking) {
      return NextResponse.json({ error: "Brak pliku lub numeru śledzenia" }, { status: 400 });
    }
    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Dozwolone są tylko pliki PDF" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const labelsDir = path.join(process.cwd(), "public", "labels");
    await fs.mkdir(labelsDir, { recursive: true });
    const filePath = path.join(labelsDir, `${tracking}.pdf`);
    await fs.writeFile(filePath, buffer);
    const url = `/labels/${tracking}.pdf`;
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
} 