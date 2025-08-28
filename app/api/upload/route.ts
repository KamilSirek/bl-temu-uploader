import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fetch from "node-fetch";

const API_URL = "https://api.baselinker.com/connector.php";

async function getExistingOrdersAdminComments(token: string): Promise<Set<string>> {
  const headers = {
    "X-BLToken": token,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const method = "getOrders";
  const parameters = { date_confirmed_from: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 90 };
  const data = new URLSearchParams({
    method,
    parameters: JSON.stringify(parameters),
  });
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: data,
  });
  const result: any = await response.json();
  const adminComments = new Set<string>();
  if ((result as any).status === "SUCCESS") {
    for (const order of (result as any).orders || []) {
      const admin_comment = (order.admin_comments || "").trim();
      if (admin_comment) adminComments.add(admin_comment.toLowerCase());
    }
  }
  return adminComments;
}

async function getExistingOrdersDetails(token: string): Promise<any[]> {
  const headers = {
    "X-BLToken": token,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const method = "getOrders";
  const parameters = { date_confirmed_from: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 90 };
  const data = new URLSearchParams({
    method,
    parameters: JSON.stringify(parameters),
  });
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: data,
  });
  const result: any = await response.json();
  if (result.status === "SUCCESS") {
    return result.orders || [];
  }
  return [];
}

function safeValue(val: any) {
  if (val === undefined || val === null || val === "") return "";
  return String(val).trim();
}

function normalize(s: string) {
  return String(s).trim().toLowerCase().replace(/\n|\r/g, "");
}

function parseFloatSafe(val: any) {
  try {
    return parseFloat(String(val).replace(",", ".").replace("zł", "").trim());
  } catch {
    return 0.0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;
    const status = formData.get("status") as string; // nie używamy statusu z frontendu
    const file = formData.get("file") as File | null;
    const ordersJson = formData.get("orders") as string | null;
    let rows: any[] = [];
    if (ordersJson) {
      try {
        rows = JSON.parse(ordersJson);
      } catch {
        return NextResponse.json({ error: "Nieprawidłowy format zamówień" }, { status: 400 });
      }
    } else if (file) {
      // Sprawdź rozszerzenie pliku
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        // Odczyt pliku CSV
        const text = await file.text();
        try {
          const Papa = (await import('papaparse')).default;
          const result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          });
          rows = result.data as any[];
        } catch (error) {
          console.error('Błąd parsowania CSV:', error);
          return NextResponse.json({ error: "Błąd parsowania pliku CSV" }, { status: 400 });
        }
      } else {
        // Odczyt pliku Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet);
      }
    } else {
      return NextResponse.json({ error: "Brak wymaganych danych" }, { status: 400 });
    }
    console.log('Odebrany status z frontendu:', status);
    if (!token || !status) {
      return NextResponse.json({ error: "Brak wymaganych danych" }, { status: 400 });
    }
    // Pobierz istniejące zamówienia z BaseLinker
    const existingOrders = await getExistingOrdersDetails(token);
    console.log('Pobrane zamówienia z BaseLinker:', existingOrders.length);
    let added = 0, skipped = 0;
    const logDetails: any[] = [];
    for (const row of rows) {
      const order_id = safeValue((row as any)["order id"]);
      if (!order_id) { skipped++; logDetails.push({order_id, action: 'brak order id'}); continue; }
      const email = safeValue((row as any)["email"]);
      // POPRAWIONA LOGIKA CENY DO BASELINKER
      const activity_goods_base_price = parseFloatSafe((row as any)["activity goods base price"]);
      const base_price_total = parseFloatSafe((row as any)["base price total"]);
      const retail_price_total = parseFloatSafe((row as any)["retail price total"]);
      const product_tax_total = parseFloatSafe((row as any)["product tax total"]);
      const shipping_tax_total = parseFloatSafe((row as any)["shipping tax total"]);
      const shipping_cost = parseFloatSafe((row as any)["shipping cost"]);
      const discount_from_temu = parseFloatSafe((row as any)["discount form TEMU"]);
      
      // Ustal cenę bazową (promocyjna lub standardowa)
      const base_price = activity_goods_base_price > 0 ? activity_goods_base_price : base_price_total;
      
      // Klient zapłacił (cena detaliczna + podatki + shipping cost)
      const customer_paid = retail_price_total + product_tax_total + shipping_tax_total + shipping_cost;
      
      // Sprawdź czy TEMU użyło kuponu i czy cena po kuponie jest mniejsza niż cena bazowa
      const price_after_discount = retail_price_total - discount_from_temu;
      const should_use_base_price = price_after_discount < base_price;
      
      // Ustal cenę brutto do BaseLinker (TYLKO produkt + podatki, BEZ shipping cost)
      let price_brutto;
      if (should_use_base_price) {
        // Użyj ceny bazowej + podatki (TEMU wystawi fakturę kosztową)
        price_brutto = base_price + product_tax_total + shipping_tax_total;
      } else {
        // Użyj ceny detalicznej + podatki (bez shipping cost)
        price_brutto = retail_price_total + product_tax_total + shipping_tax_total;
      }
      const excelDate = new Date(); // Możesz dodać pole z datą z pliku, jeśli jest
      // Sprawdź duplikat po kilku polach
      const isDuplicate = existingOrders.some(order => {
        const orderEmail = (order.email || '').trim().toLowerCase();
        const orderBrutto = parseFloatSafe(order.products?.[0]?.price_brutto);
        const orderDate = order.date_add ? new Date(order.date_add * 1000) : null;
        // Porównaj tylko dzień, miesiąc, rok
        const sameDay = orderDate && excelDate && orderDate.getFullYear() === excelDate.getFullYear() && orderDate.getMonth() === excelDate.getMonth() && orderDate.getDate() === excelDate.getDate();
        return orderEmail === email.trim().toLowerCase() && Math.abs(orderBrutto - price_brutto) < 0.01 && sameDay;
      });
      if (isDuplicate) {
        skipped++;
        logDetails.push({order_id, action: 'duplikat (email+kwota+data)'});
        continue;
      }
      const first_name = safeValue((row as any)["recipient first name"]) || "Brak danych";
      const last_name = safeValue((row as any)["recipient last name"]) || "Brak danych";
      const phone = safeValue((row as any)["recipient phone number"]);
      const address = safeValue((row as any)["ship address 1"]);
      const postcode = safeValue((row as any)["ship postal code"]);
      const city = safeValue((row as any)["ship city"]);
      const country = safeValue((row as any)["ship country"]);
      const product_name = safeValue((row as any)["product name"]);
      const quantity = (row as any)["quantity purchased"] ? parseInt((row as any)["quantity purchased"]) : 1;
      const delivery_price = shipping_cost;
      const tracking_number = safeValue((row as any)["tracking number"]);
      const carrier = safeValue((row as any)["carrier"]);
      let user_comments = "";
      if (tracking_number || carrier) {
        user_comments = `Numer przesyłki: ${tracking_number}, Kurier: ${carrier}`.replace(/^,\s*/, "");
      }
      const parameters = {
        order_status_id: status,
        date_add: Math.floor(Date.now() / 1000),
        user_login: email,
        email,
        phone,
        delivery_fullname: `${first_name} ${last_name}`,
        delivery_company: "",
        delivery_address: address,
        delivery_postcode: postcode,
        delivery_city: city,
        delivery_country_code: country,
        invoice_fullname: `${first_name} ${last_name}`,
        invoice_company: "",
        invoice_address: address,
        invoice_postcode: postcode,
        invoice_city: city,
        invoice_country_code: country,
        admin_comments: order_id,
        user_comments,
        products: [
          {
            name: product_name,
            quantity,
            price_brutto,
            tax_rate: 23,
          },
        ],
        delivery_price,
        paid: 1, // zamówienie opłacone w całości
      };
      const headers = {
        "X-BLToken": token,
        "Content-Type": "application/x-www-form-urlencoded",
      };
      const data = new URLSearchParams({
        method: "addOrder",
        parameters: JSON.stringify(parameters),
      });
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers,
          body: data,
        });
        const result: any = await response.json();
        console.log(`BaseLinker addOrder response for order_id ${order_id}:`, result);
        if (result.status === "SUCCESS") {
          added++;
          logDetails.push({order_id, action: 'dodano'});
        } else {
          skipped++;
          logDetails.push({order_id, action: 'blad', error: result});
        }
      } catch (e) {
        skipped++;
        logDetails.push({order_id, action: 'blad', error: String(e)});
      }
    }
    console.log('Szczegóły przetwarzania zamówień:', logDetails);
    return NextResponse.json({ message: `Dodano: ${added}, Pominięto: ${skipped}`, details: logDetails });
  } catch (err) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
