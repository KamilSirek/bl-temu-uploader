"use client";
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, Card, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Select, MenuItem, InputLabel, FormControl, Checkbox, FormControlLabel } from "@mui/material";

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
    if (selectedUser) {
      const data = localStorage.getItem(`orders_${selectedUser}`);
      if (data) {
        const rows = JSON.parse(data);
        setOrders(rows);
        setSelectedOrders([]); // domyślnie nic nie zaznaczaj
        // Statystyki
        let sum = 0;
        for (const row of rows) {
          const base = parseFloat((row as any)["base price total"] || 0);
          const tax = parseFloat((row as any)["product tax total"] || 0);
          const shiptax = parseFloat((row as any)["shipping tax total"] || 0);
          sum += base + tax + shiptax;
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

  const handleUserSelect = (e: React.ChangeEvent<{ value: unknown }>) => {
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
          const base = parseFloat((row as any)["base price total"] || 0);
          const tax = parseFloat((row as any)["product tax total"] || 0);
          const shiptax = parseFloat((row as any)["shipping tax total"] || 0);
          sum += base + tax + shiptax;
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
    setUsers(users.filter(u => u.login !== login));
    if (selectedUser === login) setSelectedUser("");
  };

  // Przy wgrywaniu pliku filtruję zamówienia, by nie pokazywać tych, które już były wysłane
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setOrders([]);
    setSelectedOrders([]);
    setStats({sum: 0, count: 0});
    if (f) {
      const data = await f.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let rows = XLSX.utils.sheet_to_json(sheet);
      // Filtruj zamówienia, które już były wysłane
      if (selectedUser) {
        const sent = localStorage.getItem(`sent_orders_${selectedUser}`);
        const sentIds = sent ? JSON.parse(sent) : [];
        rows = rows.filter((row: any) => !sentIds.includes(row["order id"]));
      }
      setOrders(rows);
      setSelectedOrders(rows.map((_, i) => i));
      if (selectedUser) {
        localStorage.setItem(`orders_${selectedUser}`, JSON.stringify(rows));
      }
      let sum = 0;
      for (const row of rows) {
        const base = parseFloat((row as any)["base price total"] || 0);
        const tax = parseFloat((row as any)["product tax total"] || 0);
        const shiptax = parseFloat((row as any)["shipping tax total"] || 0);
        sum += base + tax + shiptax;
      }
      setStats({sum, count: rows.length});
      const productMap: Record<string, number> = {};
      for (const row of rows) {
        const name = (row as any)["product name"] || "Brak nazwy";
        const qty = parseInt((row as any)["quantity purchased"] || 1);
        productMap[name] = (productMap[name] || 0) + qty;
      }
      setProductStats(Object.entries(productMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
    }
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
      {/* Pomarańczowy pasek */}
      <Box sx={{ width: '100%', background: '#fd6615', py: 1.5, display: 'flex', alignItems: 'center', mb: 4, position: 'relative' }}>
        <img src="/logo.png" alt="Logo firmy" style={{ height: 32, marginLeft: 32, marginRight: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0002' }} />
        <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
          Import zamówień TEMU do BaseLinker
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
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/')}>Strona główna</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/dashboard')}>Dashboard</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/faq')}>FAQ</Button>
      </Box>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, background: '#fff', borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h4" fontWeight={700} align="center" mb={3}>
          Import zamówień TEMU do BaseLinker
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
                          <TableRow key={u.login} sx={{ background: '#e6f7ff', fontWeight: 600 }}>
                            <TableCell>{u.login}</TableCell>
                            <TableCell sx={{ fontSize: 12, wordBreak: 'break-all' }} title={u.token}>
                              {u.token.length > 16 ? `${u.token.slice(0, 8)}...${u.token.slice(-6)}` : u.token}
                            </TableCell>
                            <TableCell>
                              <Button variant="outlined" size="small" onClick={() => handleUserEdit(u.login)} sx={{ mr: 1 }}>Edytuj</Button>
                              <Button variant="outlined" size="small" color="error" onClick={() => handleUserDelete(u.login)}>Usuń</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography fontWeight={600} mb={1}>Plik Excel z zamówieniami:</Typography>
                  <Button variant="contained" component="label" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 600 }}>
                    Wybierz plik
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} hidden />
                  </Button>
                  {file && <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>{file.name}</Typography>}
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
            </Grid>
            <Grid item xs={12} md={6}>
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
            </Grid>
          </Grid>
        </form>
      </Box>
      <Box sx={{ width: '100%', textAlign: 'center', mt: 6, py: 2, color: '#888', fontSize: 15 }}>
        <div>vSprint – narzędzie dla sprzedawców Allegro | powered by AI</div>
        <div><a href="https://www.vsprint.pl" target="_blank" rel="noopener noreferrer" style={{ color: '#fd6615', textDecoration: 'none', fontWeight: 500 }}>www.vsprint.pl</a></div>
      </Box>
    </>
  );
}
