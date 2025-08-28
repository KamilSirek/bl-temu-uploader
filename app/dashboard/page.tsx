"use client";
import { useEffect, useState } from "react";
import { Card, Grid, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DiscountIcon from "@mui/icons-material/Discount";
import CancelIcon from "@mui/icons-material/Cancel";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import Link from "next/link";
import { useRouter } from "next/navigation";
dayjs.extend(customParseFormat);
dayjs.extend(utc);

const polishMonths: { [key: string]: string } = {
  "sty.": "01",
  "lut.": "02",
  "mar.": "03",
  "kwi.": "04",
  "maj.": "05",
  "cze.": "06",
  "lip.": "07",
  "sie.": "08",
  "wrz.": "09",
  "paź.": "10",
  "lis.": "11",
  "gru.": "12"
};

function parsePolishDate(dateStr: string) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2}) ([a-ząćęłńóśźż.]+) (\d{4}), (\d{2}:\d{2})/i);
  if (match) {
    const [_, day, month, year, time] = match;
    const monthNum = polishMonths[month.toLowerCase()];
    if (monthNum) {
      return dayjs(`${year}-${monthNum}-${day.padStart(2, '0')} ${time}`, "YYYY-MM-DD HH:mm");
    }
  }
  return dayjs(dateStr); // fallback
}

// Funkcja pomocnicza do parsowania kwot z różnych formatów
function parseAmount(amount: any): number {
  if (!amount) return 0;
  const str = String(amount).replace(/[^\d.,-]/g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

// NOWA FUNKCJA: Parsowanie ceny z uwzględnieniem promocji
function parsePriceWithPromotion(row: any): number {
  // Sprawdź najpierw activity goods base price (cena promocyjna)
  const activityGoodsBasePrice = parseAmount(row["activity goods base price"]);
  // Jeśli jest cena promocyjna, użyj jej
  if (activityGoodsBasePrice > 0) {
    return activityGoodsBasePrice;
  }
  // W przeciwnym razie użyj standardowej ceny
  return parseAmount(row["base price total"]);
}

export default function Dashboard() {
  const [users, setUsers] = useState<{login: string, token: string}[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [aggregation, setAggregation] = useState("day");
  const [dateRange, setDateRange] = useState("30d");
  
  // Stan dla zaznaczonych elementów wykresu
  const [chartElements, setChartElements] = useState({
    orders: true,
    revenue: true,
    customer: true,
    commission: true
  });
  
  // Ustal najnowszą datę z zamówień:
  const allDates = orders
    .map(row => parsePolishDate(row["purchase date"]))
    .filter(Boolean)
    .map(date => date!.format("YYYY-MM-DD"));
  const newestDate = allDates.length > 0 ? allDates.sort().reverse()[0] : dayjs().format("YYYY-MM-DD");
  const [selectedDay, setSelectedDay] = useState(newestDate);
  useEffect(() => {
    if (allDates.length > 0) setSelectedDay(allDates.sort().reverse()[0]);
  }, [orders.length]);

  const [summaryRange, setSummaryRange] = useState("30d");
  
  function getSummaryRange(range: string) {
    const today = dayjs();
    switch (range) {
      case "today":
        return [today.startOf("day"), today.endOf("day")];
      case "yesterday":
        return [today.subtract(1, "day").startOf("day"), today.subtract(1, "day").endOf("day")];
      case "7d":
        return [today.subtract(6, "day").startOf("day"), today.endOf("day")];
      case "30d":
        return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
      case "this_month":
        return [today.startOf("month"), today.endOf("month")];
      case "last_month":
        return [today.subtract(1, "month").startOf("month"), today.subtract(1, "month").endOf("month")];
      case "this_year":
        return [today.startOf("year"), today.endOf("year")];
      default:
        return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
    }
  }
  
  const [summaryFrom, summaryTo] = getSummaryRange(summaryRange);
  const filteredOrdersByRange = orders.filter(row => {
    const date = parsePolishDate(row["purchase date"]);
    return date && date.isAfter(summaryFrom.subtract(1, "second")) && date.isBefore(summaryTo.add(1, "second"));
  });

  useEffect(() => {
    if (allDates.length > 0) setSelectedDay(allDates.sort().reverse()[0]);
  }, [orders.length]);

  useEffect(() => {
    const saved = localStorage.getItem("bl_users");
    if (saved) setUsers(JSON.parse(saved));
    
    // Wczytaj zapisane ustawienia wykresu
    const savedChartElements = localStorage.getItem("chart_elements");
    if (savedChartElements) {
      setChartElements(JSON.parse(savedChartElements));
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const data = localStorage.getItem(`orders_${selectedUser}`);
      if (data) setOrders(JSON.parse(data));
      else setOrders([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("bl_users", JSON.stringify(users));
    }
  }, [users]);

  // Zapisz ustawienia wykresu w localStorage
  useEffect(() => {
    localStorage.setItem("chart_elements", JSON.stringify(chartElements));
  }, [chartElements]);

  // Funkcja pomocnicza do zakresów dat
  function getDateRange(range: string) {
    const today = dayjs();
    switch (range) {
      case "today":
        return [today.startOf("day"), today.endOf("day")];
      case "yesterday":
        return [today.subtract(1, "day").startOf("day"), today.subtract(1, "day").endOf("day")];
      case "7d":
        return [today.subtract(6, "day").startOf("day"), today.endOf("day")];
      case "30d":
        return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
      case "this_month":
        return [today.startOf("month"), today.endOf("month")];
      case "last_month":
        return [today.subtract(1, "month").startOf("month"), today.subtract(1, "month").endOf("month")];
      default:
        return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
    }
  }

  // Filtrowanie zamówień po dacie
  const [from, to] = getDateRange(dateRange);
  const filteredOrders = orders.filter(row => {
    const date = parsePolishDate(row["purchase date"]);
    return date && date.isAfter(from.subtract(1, "second")) && date.isBefore(to.add(1, "second"));
  });

  const filteredOrdersByDay = orders.filter(row => {
    const date = parsePolishDate(row["purchase date"]);
    return date && date.format("YYYY-MM-DD") === selectedDay;
  });

  // NOWA LOGIKA BIZNESOWA TEMU
  const temuStats = filteredOrdersByRange
    .filter(row => row["order status"] !== "Canceled") // Wykluczamy anulowane zamówienia
    .reduce((acc, row) => {
    // Wpływy sprzedawcy (co dostaje na konto)
    // Użyj ceny z uwzględnieniem promocji + product tax total + shipping tax total + shipping cost
    const basePriceTotal = parsePriceWithPromotion(row);
    const productTaxTotal = parseAmount(row["product tax total"]);
    const shippingTaxTotal = parseAmount(row["shipping tax total"]);
    const shippingCost = parseAmount(row["shipping cost"]);
    
    // ROZBICIE WPŁYWÓW SPRZEDAWCY NA KOMPONENTY
    const sellerRevenueWithoutShipping = basePriceTotal + productTaxTotal + shippingTaxTotal;
    const sellerShippingCost = shippingCost;
    const sellerRevenueTotal = sellerRevenueWithoutShipping + sellerShippingCost;
    
    // Klient zapłacił (cena detaliczna + podatki + shipping cost + kupon TEMU)
    const retailPriceTotal = parseAmount(row["retail price total"]);
    const discountFromTemu = parseAmount(row["discount form TEMU"]);
    const customerPaid = retailPriceTotal + productTaxTotal + shippingTaxTotal + shippingCost + discountFromTemu;
    
    // Prowizja TEMU - różnica między tym co zapłacił klient a tym co dostaje sprzedawca
    const temuCommission = customerPaid - sellerRevenueTotal;
    
    return {
      totalOrders: acc.totalOrders + 1,
      sellerRevenueWithoutShipping: acc.sellerRevenueWithoutShipping + sellerRevenueWithoutShipping,
      sellerShippingCost: acc.sellerShippingCost + sellerShippingCost,
      sellerRevenueTotal: acc.sellerRevenueTotal + sellerRevenueTotal,
      customerPaid: acc.customerPaid + customerPaid,
      temuCommission: acc.temuCommission + temuCommission,
      totalDiscounts: acc.totalDiscounts + Math.abs(discountFromTemu),
      ordersWithDiscounts: acc.ordersWithDiscounts + (discountFromTemu < 0 ? 1 : 0),
      // Dodajemy nowe statystyki
      ordersWhereTemuPays: acc.ordersWhereTemuPays + (customerPaid < sellerRevenueTotal ? 1 : 0),
      totalTemuSubsidy: acc.totalTemuSubsidy + Math.max(0, sellerRevenueTotal - customerPaid)
    };
  }, {
    totalOrders: 0,
    sellerRevenueWithoutShipping: 0,
    sellerShippingCost: 0,
    sellerRevenueTotal: 0,
    customerPaid: 0,
    temuCommission: 0,
    totalDiscounts: 0,
    ordersWithDiscounts: 0,
    ordersWhereTemuPays: 0,
    totalTemuSubsidy: 0
  });

  // Liczba anulowanych zamówień
  const canceledOrders = filteredOrdersByRange.filter(row => row["order status"] === "Canceled").length;

  // Generowanie danych do wykresu wg agregacji
  let chartData: { label: string, Zamówienia: number, Wpływy: number, Klient: number, Prowizja: number }[] = [];
  if (aggregation === "day") {
    const daysArr = [];
    let d = summaryFrom;
    while (d.isBefore(summaryTo) || d.isSame(summaryTo, "day")) {
      daysArr.push(d);
      d = d.add(1, "day");
    }
    chartData = daysArr.map(day => {
      const label = day.format("YYYY-MM-DD");
      const ordersForDay = filteredOrdersByRange
        .filter(row => row["order status"] !== "Canceled") // Wykluczamy anulowane
        .filter(row => {
        const parsedDate = parsePolishDate(row["purchase date"]);
        return parsedDate && parsedDate.format("YYYY-MM-DD") === label;
      });
      
      const dayStats = ordersForDay.reduce((acc, row) => {
        const basePriceTotal = parsePriceWithPromotion(row);
        const productTaxTotal = parseAmount(row["product tax total"]);
        const shippingTaxTotal = parseAmount(row["shipping tax total"]);
        const shippingCost = parseAmount(row["shipping cost"]);
        
        // ROZBICIE WPŁYWÓW SPRZEDAWCY NA KOMPONENTY
        const sellerRevenueWithoutShipping = basePriceTotal + productTaxTotal + shippingTaxTotal;
        const sellerShippingCost = shippingCost;
        const sellerRevenueTotal = sellerRevenueWithoutShipping + sellerShippingCost;
        
        const retailPriceTotal = parseAmount(row["retail price total"]);
        const discountFromTemu = parseAmount(row["discount form TEMU"]);
        const customerPaid = retailPriceTotal + productTaxTotal + shippingTaxTotal + shippingCost + discountFromTemu;
        const temuCommission = customerPaid - sellerRevenueTotal;
        
        return {
          count: acc.count + 1,
          sellerRevenueWithoutShipping: acc.sellerRevenueWithoutShipping + sellerRevenueWithoutShipping,
          sellerShippingCost: acc.sellerShippingCost + sellerShippingCost,
          sellerRevenueTotal: acc.sellerRevenueTotal + sellerRevenueTotal,
          customerPaid: acc.customerPaid + customerPaid,
          temuCommission: acc.temuCommission + temuCommission
        };
      }, { count: 0, sellerRevenueWithoutShipping: 0, sellerShippingCost: 0, sellerRevenueTotal: 0, customerPaid: 0, temuCommission: 0 });
      
      return { 
        label, 
        Zamówienia: dayStats.count, 
        Wpływy: Math.round(dayStats.sellerRevenueTotal * 100) / 100,
        Klient: Math.round(dayStats.customerPaid * 100) / 100,
        Prowizja: Math.round(dayStats.temuCommission * 100) / 100
      };
    });
  } else if (aggregation === "week") {
    const weekMap: Record<string, { count: number, sellerRevenueTotal: number, customerPaid: number, temuCommission: number }> = {};
    filteredOrdersByRange
      .filter(row => row["order status"] !== "Canceled") // Wykluczamy anulowane
      .forEach(row => {
      const parsedDate = parsePolishDate(row["purchase date"]);
      if (!parsedDate) return;
      const week = parsedDate.startOf("week").format("YYYY-MM-DD");
      if (!weekMap[week]) weekMap[week] = { count: 0, sellerRevenueTotal: 0, customerPaid: 0, temuCommission: 0 };
      
      const basePriceTotal = parsePriceWithPromotion(row);
      const productTaxTotal = parseAmount(row["product tax total"]);
      const shippingTaxTotal = parseAmount(row["shipping tax total"]);
      const shippingCost = parseAmount(row["shipping cost"]);
      
      // ROZBICIE WPŁYWÓW SPRZEDAWCY NA KOMPONENTY
      const sellerRevenueWithoutShipping = basePriceTotal + productTaxTotal + shippingTaxTotal;
      const sellerShippingCost = shippingCost;
      const sellerRevenueTotal = sellerRevenueWithoutShipping + sellerShippingCost;
      
      const retailPriceTotal = parseAmount(row["retail price total"]);
      const discountFromTemu = parseAmount(row["discount form TEMU"]);
      const customerPaid = retailPriceTotal + productTaxTotal + shippingTaxTotal + shippingCost + discountFromTemu;
      const temuCommission = customerPaid - sellerRevenueTotal;
      
      weekMap[week].count += 1;
      weekMap[week].sellerRevenueTotal += sellerRevenueTotal;
      weekMap[week].customerPaid += customerPaid;
      weekMap[week].temuCommission += temuCommission;
    });
    chartData = Object.entries(weekMap).map(([label, obj]) => {
      const weekStart = dayjs(label);
      const weekEnd = weekStart.add(6, 'day');
      const displayLabel = `${weekStart.format('DD.MM')} - ${weekEnd.format('DD.MM.YYYY')}`;
      
      return { 
        label: displayLabel, 
        Zamówienia: obj.count, 
        Wpływy: Math.round(obj.sellerRevenueTotal * 100) / 100,
        Klient: Math.round(obj.customerPaid * 100) / 100,
        Prowizja: Math.round(obj.temuCommission * 100) / 100
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  } else if (aggregation === "month") {
    const monthMap: Record<string, { count: number, sellerRevenueTotal: number, customerPaid: number, temuCommission: number }> = {};
    filteredOrdersByRange
      .filter(row => row["order status"] !== "Canceled") // Wykluczamy anulowane
      .forEach(row => {
      const parsedDate = parsePolishDate(row["purchase date"]);
      if (!parsedDate) return;
      const month = parsedDate.format("YYYY-MM");
      if (!monthMap[month]) monthMap[month] = { count: 0, sellerRevenueTotal: 0, customerPaid: 0, temuCommission: 0 };
      
      const basePriceTotal = parsePriceWithPromotion(row);
      const productTaxTotal = parseAmount(row["product tax total"]);
      const shippingTaxTotal = parseAmount(row["shipping tax total"]);
      const shippingCost = parseAmount(row["shipping cost"]);
      
      // ROZBICIE WPŁYWÓW SPRZEDAWCY NA KOMPONENTY
      const sellerRevenueWithoutShipping = basePriceTotal + productTaxTotal + shippingTaxTotal;
      const sellerShippingCost = shippingCost;
      const sellerRevenueTotal = sellerRevenueWithoutShipping + sellerShippingCost;
      
      const retailPriceTotal = parseAmount(row["retail price total"]);
      const discountFromTemu = parseAmount(row["discount form TEMU"]);
      const customerPaid = retailPriceTotal + productTaxTotal + shippingTaxTotal + shippingCost + discountFromTemu;
      const temuCommission = customerPaid - sellerRevenueTotal;
      
      monthMap[month].count += 1;
      monthMap[month].sellerRevenueTotal += sellerRevenueTotal;
      monthMap[month].customerPaid += customerPaid;
      monthMap[month].temuCommission += temuCommission;
    });
    chartData = Object.entries(monthMap).map(([label, obj]) => ({ 
      label, 
      Zamówienia: obj.count, 
      Wpływy: Math.round(obj.sellerRevenueTotal * 100) / 100,
      Klient: Math.round(obj.customerPaid * 100) / 100,
      Prowizja: Math.round(obj.temuCommission * 100) / 100
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  // Statystyki dla kafelków/statystyk:
  const uniqueEmails = new Set(filteredOrdersByRange.map(row => (row["email"] || "").toLowerCase().trim())).size;
  const productMap: Record<string, number> = {};
  filteredOrdersByRange.forEach(row => {
    const name = row["product name"] || "Brak nazwy";
    const qty = parseInt(row["quantity purchased"] || 1);
    productMap[name] = (productMap[name] || 0) + qty;
  });
  const topProducts = Object.entries(productMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const withTracking = filteredOrdersByRange.filter(row => row["tracking number"] && String(row["tracking number"]).trim() !== "").length;
  const withoutTracking = filteredOrdersByRange.length - withTracking;
  type Order = any;
  const shippedStatuses = ["Shipped", "Delivered"];
  const unshippedStatus = "Unshipped";
  const shippedOrders = filteredOrdersByRange.filter((row: Order) => shippedStatuses.includes(row["order status"]))?.length || 0;
  const unshippedOrders = filteredOrdersByRange.filter((row: Order) => row["order status"] === unshippedStatus)?.length || 0;
  const cityMap: Record<string, number> = {};
  filteredOrdersByRange.forEach(row => {
    const city = (row["ship city"] || "Brak miasta").toString().trim();
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const router = useRouter();
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("vsprint_logged_in");
      router.push('/login');
    }
  };

  // Eksport/import użytkowników
  const handleExportUsers = () => {
    const data = localStorage.getItem("bl_users");
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "uzytkownicy_bl.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  const handleImportUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const users = JSON.parse(event.target?.result as string);
        if (Array.isArray(users)) {
          localStorage.setItem("bl_users", JSON.stringify(users));
          setUsers(users);
        }
      } catch (err) {
        alert("Błąd importu pliku użytkowników!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Pasek nawigacji (logo, tytuł, przyciski po prawej) */}
      <Box sx={{ width: '100%', background: '#fd6615', py: 1.5, display: 'flex', alignItems: 'center', mb: 4, position: 'relative' }}>
        <img src="/logo.png" alt="Logo firmy" style={{ height: 32, marginLeft: 32, marginRight: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0002' }} />
        <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
          vSprint - TEMU integrator
        </Typography>
        <Box sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          <Button variant="outlined" component="label" sx={{ borderColor: '#fd6615', color: '#fd6615', fontWeight: 700, fontSize: 16, borderRadius: 2, background: '#fff', '&:hover': { bgcolor: '#ffe0d6', borderColor: '#fd6615' } }}>
            Importuj użytkownika
            <input type="file" accept="application/json" onChange={handleImportUsers} hidden />
          </Button>
          <Button variant="outlined" sx={{ borderColor: '#fd6615', color: '#fd6615', fontWeight: 700, fontSize: 16, borderRadius: 2, background: '#fff', '&:hover': { bgcolor: '#ffe0d6', borderColor: '#fd6615' } }} onClick={handleExportUsers}>Eksportuj użytkownika</Button>
          <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #fd6615', background: '#fff', color: '#fd6615', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #0002', fontFamily: 'inherit', letterSpacing: 1 }}>Wyloguj</button>
        </Box>
      </Box>
      {/* PRZYCISKI NAWIGACYJNE */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 2 }}>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/')}>Import TEMU - Base</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/dashboard')}>Dashboard</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/faq')}>FAQ</Button>
      </Box>
      <Box sx={{ minHeight: '100vh', background: '#f8fafc', py: 6 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, background: '#fff', borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h4" fontWeight={700} align="center" mb={3}>
            Dashboard TEMU – analiza finansowa
          </Typography>
          <Box mb={4} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" gap={2}>
            <Typography fontWeight={600}>Wybierz konto:</Typography>
            <select
              style={{ border: '1px solid #ccc', borderRadius: 6, padding: '8px 16px', minWidth: 180 }}
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">-- wybierz konto --</option>
              {users.map(u => (
                <option key={u.login} value={u.login}>{u.login}</option>
              ))}
            </select>
          </Box>
          {selectedUser && (
            <>
              {/* Input daty nad kafelkami/statystyk: */}
              <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Typography fontWeight={600}>Zakres dla statystyk:</Typography>
                <select
                  value={summaryRange}
                  onChange={e => setSummaryRange(e.target.value)}
                  style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
                >
                  <option value="today">Dzisiaj</option>
                  <option value="yesterday">Wczoraj</option>
                  <option value="7d">Ostatnie 7 dni</option>
                  <option value="30d">Ostatnie 30 dni</option>
                  <option value="this_month">Bieżący miesiąc</option>
                  <option value="last_month">Poprzedni miesiąc</option>
                  <option value="this_year">Bieżący rok</option>
                </select>
              </Box>
              
              {/* NOWE KAFELKI Z LOGIKĄ TEMU - UKŁAD 3 KOLUMNOWY */}
              <Box display="flex" flexWrap="wrap" gap={3} mb={4} justifyContent="center">
                {/* KOLUMNA 1 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Liczba zamówień */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#e3f2fd', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCartIcon sx={{ fontSize: 35, color: '#1976d2' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Liczba zamówień</Typography>
                        <Typography variant="h4" fontWeight={700}>{temuStats.totalOrders}</Typography>
                      </Box>
                    </Card>
                  </Box>
                  
                  {/* Anulowane zamówienia */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#ffebee', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CancelIcon sx={{ fontSize: 35, color: '#d32f2f' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Anulowane zamówienia</Typography>
                        <Typography variant="h4" fontWeight={700}>{canceledOrders}</Typography>
                      </Box>
                    </Card>
                  </Box>
                </Box>
                
                {/* KOLUMNA 2 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Wpływy sprzedawcy */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#e8f5e9', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AccountBalanceIcon sx={{ fontSize: 35, color: '#388e3c' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Wpływy sprzedawcy</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.8rem' }}>{temuStats.sellerRevenueTotal.toFixed(2)} zł</Typography>
                      </Box>
                    </Card>
                  </Box>
                  
                  {/* Wpływy sprzedawcy bez kosztów dostawy */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#e8f5e9', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AttachMoneyIcon sx={{ fontSize: 35, color: '#388e3c' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Wpływy sprzedawcy (bez kosztów dostawy)</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.8rem' }}>{temuStats.sellerRevenueWithoutShipping.toFixed(2)} zł</Typography>
                      </Box>
                    </Card>
                  </Box>
                  
                  {/* Koszty dostawy */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#e8f5e9', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LocalShippingIcon sx={{ fontSize: 35, color: '#388e3c' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Koszty dostawy</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.8rem' }}>{temuStats.sellerShippingCost.toFixed(2)} zł</Typography>
                      </Box>
                    </Card>
                  </Box>
                </Box>
                
                {/* KOLUMNA 3 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Klient zapłacił */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#fff3e0', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AttachMoneyIcon sx={{ fontSize: 35, color: '#f57c00' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Klient zapłacił</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.8rem' }}>{temuStats.customerPaid.toFixed(2)} zł</Typography>
                      </Box>
                    </Card>
                  </Box>
                  
                  {/* Prowizja TEMU */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#fce4ec', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChartIcon sx={{ fontSize: 35, color: '#d81b60' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Prowizja TEMU</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.8rem' }}>{temuStats.temuCommission.toFixed(2)} zł</Typography>
                      </Box>
                    </Card>
                  </Box>
                  
                  {/* Dopłaty TEMU */}
                  <Box sx={{ width: 280, minWidth: 280, maxWidth: 280 }}>
                    <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 280, height: 120, minWidth: 280, maxWidth: 280 }}>
                      <Box sx={{ mr: 2, bgcolor: '#fff8e1', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AttachMoneyIcon sx={{ fontSize: 35, color: '#f57f17' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600} fontSize={14}>Dopłaty TEMU (kupony)</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.8rem' }}>{temuStats.totalDiscounts.toFixed(2)} zł</Typography>
                        <Typography fontSize={12} color="text.secondary">({temuStats.ordersWithDiscounts} zamówień)</Typography>
                      </Box>
                    </Card>
                  </Box>
                </Box>
              </Box>
              
              {/* WYKRES SEZONOWOŚCI */}
              <Box display="flex" gap={2} alignItems="center" mb={2} mt={4}>
                <Typography variant="h6" fontWeight={600} align="left" sx={{ flex: 1 }}>
                  Sezonowość: analiza finansowa
                </Typography>
                <select value={aggregation} onChange={e => setAggregation(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
                  <option value="day">Dziennie</option>
                  <option value="week">Tygodniowo</option>
                  <option value="month">Miesięcznie</option>
                </select>
              </Box>
              
              {/* Kontrolki wykresu */}
              <Box display="flex" gap={3} alignItems="center" mb={2} flexWrap="wrap">
                <Typography fontWeight={600} fontSize={14}>
                  Pokaż na wykresie ({Object.values(chartElements).filter(Boolean).length}/4):
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={chartElements.orders}
                      onChange={(e) => setChartElements(prev => ({ ...prev, orders: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#fd6615' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#fd6615' }}>Zamówienia</span>
                  </label>
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={chartElements.revenue}
                      onChange={(e) => setChartElements(prev => ({ ...prev, revenue: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#388e3c' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#388e3c' }}>Wpływy sprzedawcy (suma)</span>
                  </label>
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={chartElements.customer}
                      onChange={(e) => setChartElements(prev => ({ ...prev, customer: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#f57c00' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#f57c00' }}>Klient zapłacił</span>
                  </label>
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={chartElements.commission}
                      onChange={(e) => setChartElements(prev => ({ ...prev, commission: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#d81b60' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#d81b60' }}>Prowizja TEMU</span>
                  </label>
                </Box>
                <Box display="flex" gap={1} ml={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setChartElements({ orders: true, revenue: true, customer: true, commission: true })}
                    sx={{ fontSize: 12, py: 0.5, px: 1.5, borderColor: '#fd6615', color: '#fd6615' }}
                  >
                    Pokaż wszystko
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setChartElements({ orders: false, revenue: false, customer: false, commission: false })}
                    sx={{ fontSize: 12, py: 0.5, px: 1.5, borderColor: '#666', color: '#666' }}
                  >
                    Ukryj wszystko
                  </Button>
                </Box>
              </Box>
                              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, mb: 4 }}>
                  {Object.values(chartElements).some(Boolean) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" fontSize={12} tick={{ fill: '#888' }} />
                        <YAxis allowDecimals={false} fontSize={12} tick={{ fill: '#888' }} />
                        <Tooltip formatter={(value: any, name: string) => {
                          if (name === "Zamówienia") return value;
                          return `${Number(value).toFixed(2)} zł`;
                        }} />
                        <Legend />
                        {chartElements.orders && (
                          <Line type="monotone" dataKey="Zamówienia" stroke="#fd6615" strokeWidth={2} dot={{ r: 3 }} />
                        )}
                        {chartElements.revenue && (
                          <Line type="monotone" dataKey="Wpływy" stroke="#388e3c" strokeWidth={2} dot={{ r: 3 }} />
                        )}
                        {chartElements.customer && (
                          <Line type="monotone" dataKey="Klient" stroke="#f57c00" strokeWidth={2} dot={{ r: 3 }} />
                        )}
                        {chartElements.commission && (
                          <Line type="monotone" dataKey="Prowizja" stroke="#d81b60" strokeWidth={2} dot={{ r: 3 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                      <Typography color="text.secondary" fontSize={16}>
                        Zaznacz elementy do wyświetlenia na wykresie
                      </Typography>
                    </Box>
                  )}
                </Paper>
              
              {/* SZCZEGÓŁOWA TABELA ZAMÓWIENIA */}
              <Typography variant="h6" fontWeight={600} mt={4} mb={2} align="left">Szczegółowa analiza zamówień</Typography>
              {orders.length === 0 && (
                <Typography align="center" color="text.secondary" mb={2}>Brak zamówień w bazie danych.</Typography>
              )}
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 4, maxHeight: 400, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>ID</b></TableCell>
                      <TableCell><b>Produkt</b></TableCell>
                      <TableCell align="right"><b>Wpływy sprzedawcy (suma)</b></TableCell>
                      <TableCell align="right"><b>Klient zapłacił</b></TableCell>
                      <TableCell align="right"><b>Prowizja TEMU</b></TableCell>
                      <TableCell align="right"><b>Kupon TEMU</b></TableCell>
                      <TableCell align="right"><b>Status</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...orders]
                      .sort((a, b) => {
                        const dateA = parsePolishDate(a["purchase date"]);
                        const dateB = parsePolishDate(b["purchase date"]);
                        if (!dateA && !dateB) return 0;
                        if (!dateA) return 1;
                        if (!dateB) return -1;
                        return dateA.isBefore(dateB) ? 1 : -1;
                      })
                      .map((row, i) => {
                        const basePriceTotal = parsePriceWithPromotion(row);
                        const productTaxTotal = parseAmount(row["product tax total"]);
                        const shippingTaxTotal = parseAmount(row["shipping tax total"]);
                        const shippingCost = parseAmount(row["shipping cost"]);
                        
                        // ROZBICIE WPŁYWÓW SPRZEDAWCY NA KOMPONENTY
                        const sellerRevenueWithoutShipping = basePriceTotal + productTaxTotal + shippingTaxTotal;
                        const sellerShippingCost = shippingCost;
                        const sellerRevenueTotal = sellerRevenueWithoutShipping + sellerShippingCost;
                        
                        const retailPriceTotal = parseAmount(row["retail price total"]);
                        const discountFromTemu = parseAmount(row["discount form TEMU"]);
                        const customerPaid = retailPriceTotal + productTaxTotal + shippingTaxTotal + shippingCost + discountFromTemu;
                        const temuCommission = customerPaid - sellerRevenueTotal;
                        
                        return (
                          <TableRow key={i}>
                            <TableCell>{row["order id"] || row["order_id"]}</TableCell>
                            <TableCell>{row["product name"]}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                              {sellerRevenueTotal.toFixed(2)} zł
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>
                              {customerPaid.toFixed(2)} zł
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                              {temuCommission.toFixed(2)} zł
                            </TableCell>
                            <TableCell align="right" sx={{ color: discountFromTemu < 0 ? 'info.main' : 'text.secondary', fontWeight: 600 }}>
                              {discountFromTemu < 0 ? `${discountFromTemu.toFixed(2)} zł` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: row["order status"] === "Shipped" || row["order status"] === "Delivered" ? 'success.main' : 
                                     row["order status"] === "Unshipped" ? 'error.main' : 'text.secondary', 
                              fontWeight: 700 
                            }}>
                              {row["order status"] || ""}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* STATYSTYKI DODATKOWE */}
              <Box mt={4} mb={4} display="flex" gap={4} justifyContent="center" flexWrap="wrap">
                <Paper sx={{ p: 2, borderRadius: 3, minWidth: 220, textAlign: 'center', boxShadow: 2 }}>
                  <Typography fontWeight={600}>Zamówienia z trackingiem</Typography>
                  <Typography color="success.main" fontWeight={700}>Z trackingiem: {withTracking}</Typography>
                  <Typography color="text.secondary">Bez trackingu: {withoutTracking}</Typography>
                </Paper>
                <Paper sx={{ p: 2, borderRadius: 3, minWidth: 220, textAlign: 'center', boxShadow: 2 }}>
                  <Typography fontWeight={600}>Zamówienia wg statusu</Typography>
                  <Typography color="primary.main" fontWeight={700}>Wysłane: {shippedOrders}</Typography>
                  <Typography color="text.secondary">Niewysłane: {unshippedOrders}</Typography>
                </Paper>
                <Paper sx={{ p: 2, borderRadius: 3, minWidth: 220, textAlign: 'center', boxShadow: 2 }}>
                  <Typography fontWeight={600}>Średnie wartości</Typography>
                  <Typography color="success.main" fontWeight={700}>
                    Śr. wpływy: {(temuStats.sellerRevenueTotal / temuStats.totalOrders || 0).toFixed(2)} zł
                  </Typography>
                  <Typography color="warning.main" fontWeight={700}>
                    Śr. klient: {(temuStats.customerPaid / temuStats.totalOrders || 0).toFixed(2)} zł
                  </Typography>
                </Paper>
              </Box>
              
              {/* TOP 10 PRODUKTÓW I MIASTA */}
              <Typography variant="h6" fontWeight={600} mt={4} mb={1} align="left">TOP 10 najczęściej sprzedawanych produktów</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Produkt</b></TableCell>
                      <TableCell align="right"><b>Sztuk</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{p.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          {!selectedUser && <Typography align="center" color="text.secondary" mt={8}>Wybierz konto, aby zobaczyć statystyki.</Typography>}
        </Box>
      </Box>
      <Box sx={{ width: '100%', textAlign: 'center', mt: 6, py: 2, color: '#888', fontSize: 15 }}>
        <div>vSprint – narzędzie dla sprzedawców Allegro | powered by AI</div>
        <div>
          <a href="https://www.vsprint.pl" target="_blank" rel="noopener noreferrer" style={{ color: '#fd6615', textDecoration: 'none', fontWeight: 500 }}>www.vsprint.pl</a>
          <span style={{ marginLeft: 12, color: '#888', fontWeight: 400 }}>| wersja beta 1.0.0.</span>
        </div>
      </Box>
    </>
  );
}