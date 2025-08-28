"use client";
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, Card, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Select, MenuItem, InputLabel, FormControl, Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";

export default function Home() {
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("134875");
  const [message, setMessage] = useState("");
  const [importDetails, setImportDetails] = useState<{order_id: string, action: string}[] | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [stats, setStats] = useState<{sum: number, count: number}>({sum: 0, count: 0});
  const [productStats, setProductStats] = useState<Array<{name: string, count: number}>>([]);
  const [users, setUsers] = useState<Array<{login: string, token: string}>>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newUser, setNewUser] = useState<{login: string, token: string}>({login: "", token: ""});
  const [editMode, setEditMode] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const router = useRouter();
  // Dodaję obsługę pamiętania wysłanych zamówień po ID
  const [sentOrders, setSentOrders] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Array<{id: string, name: string}>>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusesError, setStatusesError] = useState<string>("");
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [labelTracking, setLabelTracking] = useState("");
  const [labelUploadMsg, setLabelUploadMsg] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null);
  const [lastFileInfo, setLastFileInfo] = useState<{name: string, date: string} | null>(null);
  const [userAddedDialogOpen, setUserAddedDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [importFileDialogOpen, setImportFileDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('vsprint_logged_in') !== '1') {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("bl_users");
    if (saved) setUsers(JSON.parse(saved));
    const last = localStorage.getItem("bl_last_user");
    if (last) setSelectedUser(last);
  }, []);
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("bl_users", JSON.stringify(users));
    }
  }, [users]);
  useEffect(() => {
    if (selectedUser) localStorage.setItem("bl_last_user", selectedUser);
  }, [selectedUser]);
  useEffect(() => {
    const u = users.find(u => u.login === selectedUser);
    if (u) setToken(u.token);
  }, [selectedUser, users]);
  useEffect(() => {
    if (selectedUser) {
      const sent = localStorage.getItem(`sent_orders_${selectedUser}`);
      setSentOrders(sent ? JSON.parse(sent) : []);
    }
  }, [selectedUser]);
  // Przywracanie zamówień z localStorage po wybraniu użytkownika
  useEffect(() => {
    // Wyczyść dane zamówień i statystyk natychmiast po zmianie użytkownika
    setOrders([]);
    setSelectedOrders([]);
    setStats({sum: 0, count: 0});
    setProductStats([]);
    setImportDetails(null);
    setSentOrders([]);
    setLastFileInfo(null);
    if (selectedUser) {
      const data = localStorage.getItem(`orders_${selectedUser}`);
      if (data) {
        const rows = JSON.parse(data);
        setOrders(rows);
        setSelectedOrders([]); // domyślnie nic nie zaznaczaj
        // Statystyki
        let sum = 0;
        for (const row of rows) {
          // NOWA LOGIKA: Sprawdź najpierw activity goods base price (cena promocyjna)
          const activity_goods_base_price = parseFloat((row as any)["activity goods base price"] || 0);
          const base = activity_goods_base_price > 0 ? activity_goods_base_price : parseFloat((row as any)["base price total"] || 0);
          const tax = parseFloat((row as any)["product tax total"] || 0);
          const shiptax = parseFloat((row as any)["shipping tax total"] || 0);
          const shipping_cost = parseFloat((row as any)["shipping cost"] || 0);
          sum += base + tax + shiptax + shipping_cost;
        }
        setStats({sum, count: rows.length});
        // Statystyki produktów
        const productMap: Record<string, number> = {};
        for (const row of rows) {
          const name = (row as any)["product name"] || "Brak nazwy";
          const qty = parseInt((row as any)["quantity purchased"] || 1);
          productMap[name] = (productMap[name] || 0) + qty;
        }
        setProductStats(Object.entries(productMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      }
      // Przywróć info o pliku
      const info = localStorage.getItem(`orders_fileinfo_${selectedUser}`);
      if (info) {
        setLastFileInfo(JSON.parse(info));
      } else {
        setLastFileInfo(null);
      }
    }
  }, [selectedUser]);

  useEffect(() => {
    if (token) {
      setLoadingStatuses(true);
      setStatusesError("");
      const formData = new FormData();
      formData.append("token", token);
      fetch("/api/statuses", {
        method: "POST",
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          if (data.statuses) {
            const arr = Object.entries(data.statuses).map(([id, obj]: [string, any]) => ({ id: String(id), name: obj.name }));
            setStatuses(arr);
            console.log("Statusy z API:", arr);
            // Jeśli obecny status nie istnieje na liście, ustaw pierwszy
            if (!arr.find(s => String(s.id) === String(status))) {
              setStatus(arr.length > 0 ? String(arr[0].id) : "");
              console.log("Ustawiam status:", arr.length > 0 ? String(arr[0].id) : "");
            }
          } else {
            setStatuses([]);
            setStatusesError("Brak statusów lub błąd API");
            setStatus("");
          }
        })
        .catch(() => {
          setStatusesError("Błąd pobierania statusów");
          setStatuses([]);
          setStatus("");
        })
        .finally(() => setLoadingStatuses(false));
    } else {
      setStatuses([]);
      setStatus("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUserSelect = (e: any) => {
    const login = e.target.value as string;
    setSelectedUser(login);
    // Od razu czyść zamówienia i ładuj z localStorage
    if (login) {
      const data = localStorage.getItem(`orders_${login}`);
      if (data) {
        const rows = JSON.parse(data);
        setOrders(rows);
        setSelectedOrders(rows.map((_: any, i: number) => i));
        // Statystyki
        let sum = 0;
        for (const row of rows) {
          // NOWA LOGIKA: Sprawdź najpierw activity goods base price (cena promocyjna)
          const activity_goods_base_price = parseFloat((row as any)["activity goods base price"] || 0);
          const base = activity_goods_base_price > 0 ? activity_goods_base_price : parseFloat((row as any)["base price total"] || 0);
          const tax = parseFloat((row as any)["product tax total"] || 0);
          const shiptax = parseFloat((row as any)["shipping tax total"] || 0);
          const shipping_cost = parseFloat((row as any)["shipping cost"] || 0);
          sum += base + tax + shiptax + shipping_cost;
        }
        setStats({sum, count: rows.length});
        // Statystyki produktów
        const productMap: Record<string, number> = {};
        for (const row of rows) {
          const name = (row as any)["product name"] || "Brak nazwy";
          const qty = parseInt((row as any)["quantity purchased"] || 1);
          productMap[name] = (productMap[name] || 0) + qty;
        }
        setProductStats(Object.entries(productMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      } else {
        setOrders([]);
        setSelectedOrders([]);
        setStats({sum: 0, count: 0});
        setProductStats([]);
      }
    } else {
      setOrders([]);
      setSelectedOrders([]);
      setStats({sum: 0, count: 0});
      setProductStats([]);
    }
  };
  const handleUserAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.login.trim() || !newUser.token.trim()) return;
    if (users.some(u => u.login === newUser.login.trim())) return;
    setUsers(prev => [...prev, { login: newUser.login.trim(), token: newUser.token.trim() }]);
    setSelectedUser(newUser.login.trim());
    setNewUser({ login: "", token: "" });
    setShowAddUser(false);
    setUserAddedDialogOpen(true);
    // Wyczyść dane zamówień i statystyk po dodaniu nowego użytkownika
    setOrders([]);
    setSelectedOrders([]);
    setStats({sum: 0, count: 0});
    setProductStats([]);
    setImportDetails(null);
    setSentOrders([]);
    setLastFileInfo(null);
  };
  const handleUserEdit = (login: string) => {
    const u = users.find(u => u.login === login);
    if (u) {
      setEditMode(login);
      setNewUser({ ...u });
      setShowAddUser(false);
    }
  };
  const handleUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(users.map(u => u.login === editMode ? { ...newUser } : u));
    setEditMode(null);
    setNewUser({ login: "", token: "" });
    setShowAddUser(false);
  };
  const handleUserDelete = (login: string) => {
    setUserToDelete(login);
    setConfirmDeleteDialogOpen(true);
  };
  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.login !== userToDelete));
      if (selectedUser === userToDelete) {
        setSelectedUser("");
        setOrders([]);
        setSentOrders([]);
        setSelectedOrders([]);
        setImportDetails(null);
        setStats({sum: 0, count: 0});
        setProductStats([]);
      }
      localStorage.removeItem(`orders_${userToDelete}`);
      localStorage.removeItem(`sent_orders_${userToDelete}`);
      localStorage.removeItem(`orders_fileinfo_${userToDelete}`);
    }
    setUserToDelete(null);
    setConfirmDeleteDialogOpen(false);
  };
  const cancelDeleteUser = () => {
    setUserToDelete(null);
    setConfirmDeleteDialogOpen(false);
  };

  // Przy wgrywaniu pliku filtruję zamówienia, by nie pokazywać tych, które już były wysłane
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setOrders([]);
    setSelectedOrders([]); // NIE zaznaczaj żadnych zamówień po wgraniu pliku
    setStats({sum: 0, count: 0});
    if (f) {
      let rows: any[] = [];
      
      // Sprawdź rozszerzenie pliku
      const fileName = f.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        // Obsługa pliku CSV
        const text = await f.text();
        try {
          const Papa = (await import('papaparse')).default;
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              rows = results.data as any[];
              processFileData(rows, f);
            },
            error: (error) => {
              console.error('Błąd parsowania CSV:', error);
              setMessage('Błąd parsowania pliku CSV');
            }
          });
        } catch (error) {
          console.error('Błąd importu papaparse:', error);
          setMessage('Błąd parsowania pliku CSV');
        }
      } else {
        // Obsługa pliku Excel (XLSX/XLS)
        const data = await f.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
        processFileData(rows, f);
      }
    }
  };

  // Funkcja pomocnicza do przetwarzania danych z pliku
  const processFileData = (rows: any[], f: File) => {
    // NIE filtruj zamówień, które już były wysłane
    setOrders(rows);
    // NIE zaznaczaj żadnych zamówień domyślnie
    if (selectedUser) {
      localStorage.setItem(`orders_${selectedUser}`, JSON.stringify(rows));
      // Zapisz info o pliku i dacie
      const info = { name: f.name, date: new Date().toISOString() };
      localStorage.setItem(`orders_fileinfo_${selectedUser}`, JSON.stringify(info));
      setLastFileInfo(info);
    }
    let sum = 0;
    for (const row of rows) {
      // NOWA LOGIKA: Sprawdź najpierw activity goods base price (cena promocyjna)
      const activity_goods_base_price = parseFloat((row as any)["activity goods base price"] || 0);
      const base = activity_goods_base_price > 0 ? activity_goods_base_price : parseFloat((row as any)["base price total"] || 0);
      const tax = parseFloat((row as any)["product tax total"] || 0);
      const shiptax = parseFloat((row as any)["shipping tax total"] || 0);
      const shipping_cost = parseFloat((row as any)["shipping cost"] || 0);
      sum += base + tax + shiptax + shipping_cost;
    }
    setStats({sum, count: rows.length});
    const productMap: Record<string, number> = {};
    for (const row of rows) {
      const name = (row as any)["product name"] || "Brak nazwy";
      const qty = parseInt((row as any)["quantity purchased"] || 1);
      productMap[name] = (productMap[name] || 0) + qty;
    }
    setProductStats(Object.entries(productMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
    setImportFileDialogOpen(true);
    // Resetuj input pliku, aby można było ponownie wybrać ten sam plik
    if (labelInputRef.current) labelInputRef.current.value = "";
  };

  const handleOrderCheck = (idx: number) => {
    setSelectedOrders(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
  };
  const handleCheckAll = (checked: boolean) => {
    setSelectedOrders(checked ? orders.map((_, i) => i) : []);
  };
  // Po wysłaniu zamówień, ich ID są zapisywane do localStorage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !status) {
      setMessage("Uzupełnij wszystkie pola!");
      return;
    }
    if (selectedOrders.length === 0) {
      setMessage("Zaznacz przynajmniej jedno zamówienie!");
      return;
    }
    setPendingSubmitEvent(e);
    setConfirmOpen(true);
  };

  const handleConfirmYes = async () => {
    setConfirmOpen(false);
    setMessage("Wysyłanie...");
    setImportDetails(null);
    const selectedRows = orders.filter((_, i) => selectedOrders.includes(i));
    const formData = new FormData();
    formData.append("token", token);
    formData.append("status", "134875");
    formData.append("orders", JSON.stringify(selectedRows));
    console.log("Wysyłany status:", status);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Sukces: " + data.message);
        setImportDetails(data.details || null);
        // Dodaj wysłane ID do localStorage
        if (selectedUser) {
          const sent = localStorage.getItem(`sent_orders_${selectedUser}`);
          const sentIds = sent ? JSON.parse(sent) : [];
          const newIds = selectedRows.map((row: any) => row["order id"]);
          const allIds = Array.from(new Set([...sentIds, ...newIds]));
          localStorage.setItem(`sent_orders_${selectedUser}` , JSON.stringify(allIds));
          setSentOrders(allIds);
        }
      } else {
        setMessage("Błąd: " + data.error);
        setImportDetails(null);
      }
    } catch (err) {
      setMessage("Błąd połączenia z serwerem");
    }
    setPendingSubmitEvent(null);
  };

  const handleConfirmNo = () => {
    setConfirmOpen(false);
    setPendingSubmitEvent(null);
  };

  const handleLabelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLabelUploadMsg("");
    if (!labelFile || !labelTracking) {
      setLabelUploadMsg("Wybierz plik PDF i podaj numer śledzenia!");
      return;
    }
    const formData = new FormData();
    formData.append("file", labelFile);
    formData.append("tracking", labelTracking);
    try {
      const res = await fetch("/api/upload-label", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLabelUploadMsg(`Etykieta zapisana! Link: ${window.location.origin}${data.url}`);
        setLabelFile(null);
        setLabelTracking("");
        if (labelInputRef.current) labelInputRef.current.value = "";
      } else {
        setLabelUploadMsg("Błąd: " + (data.error || "Nieznany błąd"));
      }
    } catch (err) {
      setLabelUploadMsg("Błąd połączenia z serwerem");
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("vsprint_logged_in");
      router.push('/login');
    }
  };

  // Eksport/import użytkowników
  const handleExportUsers = () => {
    // Użyj aktualnego stanu users
    const usersArr = users;
    let ordersObj: Record<string, any[]> = {};
    let sentOrdersObj: Record<string, any[]> = {};
    let fileInfoObj: Record<string, {name: string, date: string}> = {};
    if (usersArr.length > 0) {
      usersArr.forEach((u: {login: string}) => {
        const orders = localStorage.getItem(`orders_${u.login}`);
        if (orders) {
          try {
            ordersObj[u.login] = JSON.parse(orders);
          } catch {
            ordersObj[u.login] = [];
          }
        } else {
          ordersObj[u.login] = [];
        }
        const sent = localStorage.getItem(`sent_orders_${u.login}`);
        if (sent) {
          try {
            sentOrdersObj[u.login] = JSON.parse(sent);
          } catch {
            sentOrdersObj[u.login] = [];
          }
        } else {
          sentOrdersObj[u.login] = [];
        }
        const fileinfo = localStorage.getItem(`orders_fileinfo_${u.login}`);
        if (fileinfo) {
          try {
            fileInfoObj[u.login] = JSON.parse(fileinfo);
          } catch {
            fileInfoObj[u.login] = {name: '', date: ''};
          }
        } else {
          fileInfoObj[u.login] = {name: '', date: ''};
        }
      });
      const exportData = { users: usersArr, orders: ordersObj, sentOrders: sentOrdersObj, fileInfo: fileInfoObj };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
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
        const parsed = JSON.parse(event.target?.result as string);
        // Nowy format: { users: [...], orders: {login: [...]}, sentOrders: {login: [...]}, fileInfo: {login: {name, date}} }
        if (Array.isArray(parsed)) {
          // Stary format: tylko tablica użytkowników
          setUsers(parsed);
          localStorage.setItem("bl_users", JSON.stringify(parsed));
        } else if (parsed && Array.isArray(parsed.users) && typeof parsed.orders === 'object') {
          setUsers(parsed.users);
          localStorage.setItem("bl_users", JSON.stringify(parsed.users));
          // Przywróć zamówienia dla każdego użytkownika
          Object.entries(parsed.orders).forEach(([login, orders]) => {
            localStorage.setItem(`orders_${login}`, JSON.stringify(orders));
          });
          // Przywróć wysłane zamówienia dla każdego użytkownika (jeśli są)
          if (parsed.sentOrders && typeof parsed.sentOrders === 'object') {
            Object.entries(parsed.sentOrders).forEach(([login, sent]) => {
              localStorage.setItem(`sent_orders_${login}`, JSON.stringify(sent));
            });
          }
          // Przywróć info o pliku dla każdego użytkownika (jeśli są)
          if (parsed.fileInfo && typeof parsed.fileInfo === 'object') {
            Object.entries(parsed.fileInfo).forEach(([login, info]) => {
              localStorage.setItem(`orders_fileinfo_${login}`, JSON.stringify(info));
            });
          }
        }
      } catch (err) {
        alert("Błąd importu pliku użytkowników!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Pomarańczowy pasek */}
      <Box sx={{ width: '100%', background: '#fd6615', py: 1.5, display: 'flex', alignItems: 'center', mb: 4, position: 'relative' }}>
        <img src="/logo.png" alt="Logo firmy" style={{ height: 32, marginLeft: 32, marginRight: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0002' }} />
        <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
          vSprint - TEMU integrator
        </Typography>
        <Box sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          <Button variant="outlined" component="label" sx={{ borderColor: '#fd6615', color: '#fd6615', fontWeight: 700, fontSize: 16, borderRadius: 2, background: '#fff' }}>
            Importuj użytkownika
            <input type="file" hidden onChange={handleImportUsers} />
          </Button>
          <Button variant="outlined" sx={{ borderColor: '#fd6615', color: '#fd6615', fontWeight: 700, fontSize: 16, borderRadius: 2, background: '#fff' }} onClick={handleExportUsers}>Eksportuj użytkownika</Button>
          <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #fd6615', background: '#fff', color: '#fd6615', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #0002', fontFamily: 'inherit', letterSpacing: 1 }}>Wyloguj</button>
        </Box>
      </Box>
      {/* PRZYCISKI NAWIGACYJNE */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 2 }}>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/')}>Import TEMU - Base</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/dashboard')}>Dashboard</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/faq')}>FAQ</Button>
      </Box>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, background: '#fff', borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h4" fontWeight={700} align="center" mb={3}>
          Import zamówień TEMU do BaseLinker
        </Typography>
        <form onSubmit={handleSubmit}>
          {/* FLEXBOX ALTERNATYWA DLA GRID */}
          {/* Zakomentowany Grid powyżej – możesz go odkomentować lokalnie */}
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box minWidth={350} maxWidth={600} width="100%" m="auto">
              <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="user-label">Użytkownik</InputLabel>
                  <Select labelId="user-label" value={selectedUser} label="Użytkownik" onChange={handleUserSelect}>
                    <MenuItem value="">-- Wybierz użytkownika --</MenuItem>
                    {users.map(u => <MenuItem key={u.login} value={u.login}>{u.login}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={() => { setEditMode(null); setShowAddUser(true); setNewUser({ login: "", token: "" }); }}
                  sx={{
                    bgcolor: '#fd6615',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    boxShadow: 1,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#ff7d2a' }
                  }}
                >
                  Dodaj nowego
                </Button>
                {showAddUser || editMode !== null ? (
                  <Box sx={{ mb: 2, background: '#fd6615', p: 2, borderRadius: 2, maxWidth: 400, color: '#fff' }}>
                    <Typography fontWeight={600} mb={1} sx={{ color: '#fff' }}>{editMode ? 'Edytuj użytkownika' : 'Dodaj użytkownika'}</Typography>
                    <TextField label="Login" value={newUser.login} onChange={e => setNewUser({ ...newUser, login: e.target.value })} sx={{ mr: 1, mb: 1, background: '#fff', borderRadius: 1 }} size="small" disabled={!!editMode} />
                    <TextField label="Token API" value={newUser.token} onChange={e => setNewUser({ ...newUser, token: e.target.value })} sx={{ mr: 1, mb: 1, background: '#fff', borderRadius: 1 }} size="small" />
                    <Button variant="contained" onClick={editMode ? handleUserSave : handleUserAdd} sx={{ mr: 1, bgcolor: '#fff', color: '#fd6615', fontWeight: 700, '&:hover': { bgcolor: '#ffe0d6' } }}>{editMode ? 'Zapisz' : 'Dodaj'}</Button>
                    <Button variant="outlined" onClick={() => { setEditMode(null); setShowAddUser(false); setNewUser({ login: "", token: "" }); }} sx={{ color: '#fff', borderColor: '#fff', fontWeight: 700, '&:hover': { bgcolor: '#fff', color: '#fd6615', borderColor: '#fd6615' } }}>Anuluj</Button>
                  </Box>
                ) : null}
                {selectedUser && users.length > 0 && (
                  <TableContainer component={Paper} sx={{ maxWidth: 500, mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Login</TableCell>
                          <TableCell>Token API</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.filter(u => u.login === selectedUser).map(u => (
                          <TableRow key={u.login} sx={{ background: '#fff7e0', fontWeight: 600 }}>
                            <TableCell>{u.login}</TableCell>
                            <TableCell sx={{ fontSize: 12, wordBreak: 'break-all' }} title={u.token}>
                              {u.token.length > 16 ? `${u.token.slice(0, 8)}...${u.token.slice(-6)}` : u.token}
                            </TableCell>
                            <TableCell>
                              <Button variant="outlined" size="small" onClick={() => handleUserEdit(u.login)} sx={{ mr: 1, bgcolor: '#fff', color: '#fd6615', fontWeight: 700, borderColor: '#fd6615', '&:hover': { bgcolor: '#ffe0d6', borderColor: '#fd6615', color: '#fd6615' } }}>Edytuj</Button>
                              <Button variant="outlined" size="small" onClick={() => handleUserDelete(u.login)} sx={{ bgcolor: '#fff', color: '#fd6615', fontWeight: 700, borderColor: '#fd6615', '&:hover': { bgcolor: '#ffe0d6', borderColor: '#fd6615', color: '#fd6615' } }}>Usuń</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography fontWeight={600} mb={1}>Wgraj plik Excel lub CSV z zamówieniami</Typography>
                  <Button variant="contained" component="label" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 600 }}>
                    Wybierz plik
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} hidden ref={labelInputRef} />
                  </Button>
                </Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="status-label">Status docelowy w BaseLinker</InputLabel>
                  <Select labelId="status-label" value={"134875"} label="Status docelowy w BaseLinker" disabled>
                    <MenuItem value="134875">Nowe zamówienia</MenuItem>
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, fontSize: 16, mt: 2, width: '100%' }}>Wyślij zamówienia do Base</Button>
                {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
              </Paper>
            </Box>
            <Box minWidth={350} maxWidth={600} width="100%" m="auto">
              {orders.length > 0 && (
                <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                  <Typography fontWeight={600} mb={1}>Wybierz zamówienia do wysłania:</Typography>
                  <TableContainer sx={{ maxHeight: 370 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedOrders.length === orders.length} onChange={e => handleCheckAll(e.target.checked)} />
                          </TableCell>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Data zamówienia</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Wysłane do Base</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.map((row, i) => (
                          <TableRow key={i} selected={selectedOrders.includes(i)}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={selectedOrders.includes(i)} onChange={() => handleOrderCheck(i)} />
                            </TableCell>
                            <TableCell>{row["order id"]}</TableCell>
                            <TableCell>{row["purchase date"]}</TableCell>
                            <TableCell>
                              {sentOrders.includes(row["order id"]) ? (
                                <span style={{ color: 'green', fontWeight: 600 }}>tak</span>
                              ) : (
                                <span style={{ color: 'red', fontWeight: 600 }}>nie</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
              {importDetails && (
                <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                  <Typography fontWeight={600} mb={1}>Szczegóły importu:</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importDetails.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell>{d.order_id || <i>brak</i>}</TableCell>
                            <TableCell>
                              {d.action === 'dodano' && <span style={{ color: 'green' }}>Dodano</span>}
                              {d.action === 'duplikat' && <span style={{ color: 'orange' }}>Duplikat</span>}
                              {d.action === 'brak order id' && <span style={{ color: 'red' }}>Brak order id</span>}
                              {d.action === 'blad' && <span style={{ color: 'red' }}>Błąd</span>}
                              {d.action === 'duplikat (email+kwota+data)' && <span style={{ color: 'orange' }}>Duplikat (email+kwota+data)</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
              {lastFileInfo && (
                <Box sx={{ mb: 2, p: 1, background: '#fff7e0', borderRadius: 2, fontSize: 15 }}>
                  Zamówienia na podstawie pliku: <b>{lastFileInfo.name}</b> | Data wczytania: <b>{new Date(lastFileInfo.date).toLocaleString()}</b>
                </Box>
              )}
            </Box>
          </Box>
        </form>
        <Dialog open={confirmOpen} onClose={handleConfirmNo}>
          <DialogTitle>Potwierdzenie wysyłki</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Czy na pewno chcesz wysłać wybrane zamówienia do BaseLinker?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleConfirmNo} color="secondary">Nie</Button>
            <Button onClick={handleConfirmYes} color="primary" autoFocus>Tak</Button>
          </DialogActions>
        </Dialog>
        {/* Dialog potwierdzający dodanie użytkownika */}
        <Dialog open={userAddedDialogOpen} onClose={() => setUserAddedDialogOpen(false)}>
          <DialogTitle>Dodano użytkownika</DialogTitle>
          <DialogContent>
            <DialogContentText>Użytkownik został dodany.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserAddedDialogOpen(false)} color="primary" autoFocus>OK</Button>
          </DialogActions>
        </Dialog>
        {/* Dialog potwierdzający usunięcie użytkownika */}
        <Dialog open={confirmDeleteDialogOpen} onClose={cancelDeleteUser}>
          <DialogTitle>Potwierdzenie usunięcia</DialogTitle>
          <DialogContent>
            <DialogContentText>Czy na pewno usunąć użytkownika?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDeleteUser} color="secondary">Nie</Button>
            <Button onClick={confirmDeleteUser} color="primary" autoFocus>Tak</Button>
          </DialogActions>
        </Dialog>
        {/* Dialog potwierdzający import pliku zamówień */}
        <Dialog open={importFileDialogOpen} onClose={() => setImportFileDialogOpen(false)}>
          <DialogTitle>Import zakończony</DialogTitle>
          <DialogContent>
            <DialogContentText>Import pliku excel z zamówieniami wykonany z sukcesem.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportFileDialogOpen(false)} color="primary" autoFocus>OK</Button>
          </DialogActions>
        </Dialog>
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
