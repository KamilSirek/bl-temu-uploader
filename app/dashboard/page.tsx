"use client";
import { useEffect, useState } from "react";
import { Card, Grid, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";
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

export default function Dashboard() {
  const [users, setUsers] = useState<{login: string, token: string}[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [aggregation, setAggregation] = useState("day");
  const [dateRange, setDateRange] = useState("30d");
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

  // Generowanie danych do wykresu wg agregacji
  let chartData: { label: string, Zamówienia: number, Obrót: number }[] = [];
  if (aggregation === "day") {
    const daysArr = [];
    let d = summaryFrom;
    while (d.isBefore(summaryTo) || d.isSame(summaryTo, "day")) {
      daysArr.push(d);
      d = d.add(1, "day");
    }
    chartData = daysArr.map(day => {
      const label = day.format("YYYY-MM-DD");
      const ordersForDay = filteredOrdersByRange.filter(row => {
        const parsedDate = parsePolishDate(row["purchase date"]);
        return parsedDate && parsedDate.format("YYYY-MM-DD") === label;
      });
      const count = ordersForDay.length;
      const obrot = ordersForDay.reduce((acc, row) => {
        const base = parseFloat(row["base price total"] || 0);
        const tax = parseFloat(row["product tax total"] || 0);
        const shiptax = parseFloat(row["shipping tax total"] || 0);
        const delivery = parseFloat(row["shipping cost"] || 0);
        return acc + base + tax + shiptax + delivery;
      }, 0);
      return { label, Zamówienia: count, Obrót: Math.round(obrot * 100) / 100 };
    });
  } else if (aggregation === "week") {
    const weekMap: Record<string, { Zamówienia: number, Obrót: number }> = {};
    filteredOrdersByRange.forEach(row => {
      const week = parsePolishDate(row["purchase date"]).startOf("week").format("YYYY-[T]WW");
      if (!weekMap[week]) weekMap[week] = { Zamówienia: 0, Obrót: 0 };
      weekMap[week].Zamówienia += 1;
      const base = parseFloat(row["base price total"] || 0);
      const tax = parseFloat(row["product tax total"] || 0);
      const shiptax = parseFloat(row["shipping tax total"] || 0);
      const delivery = parseFloat(row["shipping cost"] || 0);
      weekMap[week].Obrót += base + tax + shiptax + delivery;
    });
    chartData = Object.entries(weekMap).map(([label, obj]) => ({ label, Zamówienia: obj.Zamówienia, Obrót: Math.round(obj.Obrót * 100) / 100 })).sort((a, b) => a.label.localeCompare(b.label));
  } else if (aggregation === "month") {
    const monthMap: Record<string, { Zamówienia: number, Obrót: number }> = {};
    filteredOrdersByRange.forEach(row => {
      const month = parsePolishDate(row["purchase date"]).format("YYYY-MM");
      if (!monthMap[month]) monthMap[month] = { Zamówienia: 0, Obrót: 0 };
      monthMap[month].Zamówienia += 1;
      const base = parseFloat(row["base price total"] || 0);
      const tax = parseFloat(row["product tax total"] || 0);
      const shiptax = parseFloat(row["shipping tax total"] || 0);
      const delivery = parseFloat(row["shipping cost"] || 0);
      monthMap[month].Obrót += base + tax + shiptax + delivery;
    });
    chartData = Object.entries(monthMap).map(([label, obj]) => ({ label, Zamówienia: obj.Zamówienia, Obrót: Math.round(obj.Obrót * 100) / 100 })).sort((a, b) => a.label.localeCompare(b.label));
  }

  // Statystyki dla kafelków/statystyk:
  const sumProducts = filteredOrdersByRange.reduce((acc, row) => {
    const base = parseFloat(row["base price total"] || 0);
    const tax = parseFloat(row["product tax total"] || 0);
    const shiptax = parseFloat(row["shipping tax total"] || 0);
    return acc + base + tax + shiptax;
  }, 0);
  const sumDelivery = filteredOrdersByRange.reduce((acc, row) => acc + parseFloat(row["shipping cost"] || 0), 0);
  const avgOrder = filteredOrdersByRange.length > 0 ? (sumProducts + sumDelivery) / filteredOrdersByRange.length : 0;
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
  const totalObrot = filteredOrdersByRange.reduce((acc, row) => {
    const base = parseFloat(row["base price total"] || 0);
    const tax = parseFloat(row["product tax total"] || 0);
    const shiptax = parseFloat(row["shipping tax total"] || 0);
    const delivery = parseFloat(row["shipping cost"] || 0);
    return acc + base + tax + shiptax + delivery;
  }, 0);
  const productSalesMap: Record<string, { value: number, count: number }> = {};
  filteredOrdersByRange.forEach(row => {
    const name = row["product name"] || "Brak nazwy";
    const qty = parseInt(row["quantity purchased"] || 1);
    const base = parseFloat(row["base price total"] || 0);
    const tax = parseFloat(row["product tax total"] || 0);
    const shiptax = parseFloat(row["shipping tax total"] || 0);
    const delivery = parseFloat(row["shipping cost"] || 0);
    const value = base + tax + shiptax + delivery;
    if (!productSalesMap[name]) productSalesMap[name] = { value: 0, count: 0 };
    productSalesMap[name].value += value;
    productSalesMap[name].count += qty;
  });
  const productSales = Object.entries(productSalesMap)
    .map(([name, obj]) => ({ name, value: obj.value, count: obj.count, percent: totalObrot ? (obj.value / totalObrot * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const visibleProducts = showAllProducts ? productSales : productSales.slice(0, 5);

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
          Import zamówień TEMU do BaseLinker
        </Typography>
        <Box sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          <Button variant="outlined" component="label" sx={{ borderColor: '#fff', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 2, background: 'transparent' }}>
            Importuj użytkownika
            <input type="file" accept="application/json" onChange={handleImportUsers} hidden />
          </Button>
          <Button variant="outlined" sx={{ borderColor: '#fff', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 2, background: 'transparent' }} onClick={handleExportUsers}>Eksportuj użytkownika</Button>
          <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #fff', background: '#fff', color: '#fd6615', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #0002', fontFamily: 'inherit', letterSpacing: 1 }}>Wyloguj</button>
        </Box>
      </Box>
      {/* PRZYCISKI NAWIGACYJNE */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 2 }}>
        <Button variant="outlined" sx={{ borderColor: '#fd6615', color: '#fd6615', fontWeight: 700, fontSize: 16, textTransform: 'none', borderRadius: 2 }} onClick={() => router.push('/')}>Strona główna</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, fontSize: 16, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#ff7d2a' } }} onClick={() => router.push('/dashboard')}>Dashboard</Button>
        <Button variant="outlined" sx={{ borderColor: '#fd6615', color: '#fd6615', fontWeight: 700, fontSize: 16, textTransform: 'none', borderRadius: 2 }} onClick={() => router.push('/faq')}>FAQ</Button>
      </Box>
      <Box sx={{ minHeight: '100vh', background: '#f8fafc', py: 6 }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 }, background: '#fff', borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h4" fontWeight={700} align="center" mb={3}>
            Dashboard – statystyki zamówień
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
              {/* Kafelki/statystyki korzystają z filteredOrdersByRange */}
              <Grid container spacing={3} mb={2} justifyContent="center">
                {/* Rząd 1 */}
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 350, height: 130, minWidth: 350, maxWidth: 350, m: 'auto' }}>
                    <Box sx={{ mr: 2, bgcolor: '#e3f2fd', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCartIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Liczba zamówień</Typography>
                      <Typography variant="h4" fontWeight={700}>{filteredOrdersByRange.length}</Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 350, height: 130, minWidth: 350, maxWidth: 350, m: 'auto' }}>
                    <Box sx={{ mr: 2, bgcolor: '#e8f5e9', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AttachMoneyIcon sx={{ fontSize: 40, color: '#388e3c' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Obrót (produkty + dostawa)</Typography>
                      <Typography variant="h4" fontWeight={700}>{totalObrot.toFixed(2)} zł</Typography>
                    </Box>
                  </Card>
                </Grid>
                {/* Rząd 2 */}
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 350, height: 130, minWidth: 350, maxWidth: 350, m: 'auto' }}>
                    <Box sx={{ mr: 2, bgcolor: '#e8f5e9', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AttachMoneyIcon sx={{ fontSize: 40, color: '#388e3c' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Suma wartości produktów brutto</Typography>
                      <Typography variant="h4" fontWeight={700}>{sumProducts.toFixed(2)} zł</Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 350, height: 130, minWidth: 350, maxWidth: 350, m: 'auto' }}>
                    <Box sx={{ mr: 2, bgcolor: '#fff3e0', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LocalShippingIcon sx={{ fontSize: 40, color: '#f57c00' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Suma kosztów dostawy brutto</Typography>
                      <Typography variant="h4" fontWeight={700}>{sumDelivery.toFixed(2)} zł</Typography>
                    </Box>
                  </Card>
                </Grid>
                {/* Rząd 3 */}
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 350, height: 130, minWidth: 350, maxWidth: 350, m: 'auto' }}>
                    <Box sx={{ mr: 2, bgcolor: '#f3e5f5', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChartIcon sx={{ fontSize: 40, color: '#8e24aa' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Średnia wartość zamówienia</Typography>
                      <Typography variant="h4" fontWeight={700}>{avgOrder.toFixed(2)} zł</Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: 3, boxShadow: 3, width: 350, height: 130, minWidth: 350, maxWidth: 350, m: 'auto' }}>
                    <Box sx={{ mr: 2, bgcolor: '#fce4ec', borderRadius: '50%', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PersonIcon sx={{ fontSize: 40, color: '#d81b60' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Unikalnych klientów (email)</Typography>
                      <Typography variant="h4" fontWeight={700}>{uniqueEmails}</Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
              {/* WYKRES SEZONOWOŚCI */}
              <Box display="flex" gap={2} alignItems="center" mb={2} mt={4}>
                <Typography variant="h6" fontWeight={600} align="left" sx={{ flex: 1 }}>
                  Sezonowość: liczba zamówień
                </Typography>
                <select value={aggregation} onChange={e => setAggregation(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
                  <option value="day">Dziennie</option>
                  <option value="week">Tygodniowo</option>
                  <option value="month">Miesięcznie</option>
                </select>
              </Box>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, mb: 2 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} tick={{ fill: '#888' }} />
                    <YAxis allowDecimals={false} fontSize={12} tick={{ fill: '#888' }} />
                    <Tooltip formatter={(value: any, name: string) => name === "Obrót" ? `${Number(value).toFixed(2)} zł` : value} />
                    <Legend />
                    <Line type="monotone" dataKey="Zamówienia" stroke="#fd6615" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Obrót" stroke="#388e3c" strokeWidth={3} dot={{ r: 3 }} yAxisId={1} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
              {/* SEKCA ZAMÓWIENIA */}
              <Typography variant="h6" fontWeight={600} mt={4} mb={1} align="left">Zamówienia</Typography>
              {/* Tabela zamówień korzysta z 'orders' (wszystkie zamówienia) */}
              {orders.length === 0 && (
                <Typography align="center" color="text.secondary" mb={2}>Brak zamówień w bazie danych.</Typography>
              )}
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 2, maxHeight: 320, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>ID</b></TableCell>
                      <TableCell><b>Nazwa przedmiotu</b></TableCell>
                      <TableCell align="right"><b>Koszt przedmiotu</b></TableCell>
                      <TableCell align="right"><b>Koszt wysyłki</b></TableCell>
                      <TableCell align="right"><b>Wartość całkowita</b></TableCell>
                      <TableCell align="right"><b>Rozliczenie</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...orders]
                      .sort((a, b) => {
                        const dateA = parsePolishDate(a["purchase date"]);
                        const dateB = parsePolishDate(b["purchase date"]);
                        return dateA.isBefore(dateB) ? 1 : -1;
                      })
                      .map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row["order id"] || row["order_id"]}</TableCell>
                          <TableCell>{row["product name"]}</TableCell>
                          <TableCell align="right">{parseFloat(row["base price total"] || 0).toFixed(2)} zł</TableCell>
                          <TableCell align="right">{parseFloat(row["shipping cost"] || 0).toFixed(2)} zł</TableCell>
                          <TableCell align="right">{(parseFloat(row["base price total"] || 0) + parseFloat(row["shipping cost"] || 0)).toFixed(2)} zł</TableCell>
                          <TableCell align="right" sx={{ color: row["order settlement status"] === "Nierozliczone" ? 'error.main' : row["order settlement status"] === "Rozliczone" ? 'success.main' : undefined, fontWeight: 700 }}>
                            {row["order settlement status"] || ""}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* ZAMÓWIENIA Z TRACKINGIEM */}
              <Box mt={2} mb={2} display="flex" gap={4} justifyContent="center">
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
              </Box>
              {/* SPRZEDAŻ WEDŁUG PRODUKTÓW */}
              <Typography variant="h6" fontWeight={600} mt={4} mb={1} align="left">Sprzedaż według produktów</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 4, maxHeight: 320, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Produkt</b></TableCell>
                      <TableCell align="right"><b>Całkowita sprzedaż</b></TableCell>
                      <TableCell align="right"><b>Ilość sztuk</b></TableCell>
                      <TableCell align="right"><b>% obrotów</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell align="right">{p.value.toFixed(2)} zł</TableCell>
                        <TableCell align="right">{p.count}</TableCell>
                        <TableCell align="right">{p.percent.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {productSales.length > 5 && (
                <Box textAlign="center" mb={2}>
                  <button onClick={() => setShowAllProducts(v => !v)} style={{ padding: '6px 18px', borderRadius: 6, border: '1px solid #ccc', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}>
                    {showAllProducts ? 'Pokaż mniej' : 'Pokaż więcej'}
                  </button>
                </Box>
              )}
              {/* TOP 10 PRODUKTÓW I MIASTA POD WYKRESEM */}
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
              <Typography variant="h6" fontWeight={600} mt={4} mb={1} align="left">Najpopularniejsze miasta (TOP 10)</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Miasto</b></TableCell>
                      <TableCell align="right"><b>Zamówień</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCities.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c.city}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{c.count}</TableCell>
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
    </>
  );
}