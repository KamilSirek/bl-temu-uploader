import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

const API_URL = "https://api.baselinker.com/connector.php";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;
    if (!token) return NextResponse.json({ error: "Brak tokena" }, { status: 400 });
    const headers = {
      "X-BLToken": token,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const data = new URLSearchParams({
      method: "getOrderStatusList",
      parameters: JSON.stringify({}),
    });
    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: data,
    });
    const result: any = await response.json();
    console.log('BaseLinker getOrderStatuses response:', result);
    if (result.status === "SUCCESS") {
      return NextResponse.json({ statuses: result.statuses });
    } else {
      return NextResponse.json({ error: "Błąd pobierania statusów" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
} 