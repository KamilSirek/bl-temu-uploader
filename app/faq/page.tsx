"use client";

import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function FAQPage() {
  const router = useRouter();
  // Funkcje obsługi eksportu/importu/wylogowania powinny być przekazane przez props lub zaimplementowane analogicznie jak na stronie głównej
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("vsprint_logged_in");
      router.push('/login');
    }
  };
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
        }
      } catch (err) {
        alert("Błąd importu pliku użytkowników!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Pasek nawigacji identyczny jak na stronie głównej */}
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
      {/* Przyciski nawigacyjne pod paskiem */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 2 }}>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/')}>Strona główna</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/dashboard')}>Dashboard</Button>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/faq')}>FAQ</Button>
      </Box>
      {/* Sekcja FAQ */}
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, p: 2 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff7f0', borderRadius: 3, boxShadow: 3 }}>
          <Typography variant="h4" fontWeight={700} mb={2} color="#fd6615">FAQ & Instrukcja obsługi</Typography>
          <Typography variant="h6" fontWeight={600} mb={1}>Opis programu</Typography>
          <Typography mb={2}>
            <b>BL-TEMU Uploader</b> to nowoczesna aplikacja webowa do importu zamówień z plików Excel (TEMU) do BaseLinker oraz analizy sprzedaży. Pozwala na zarządzanie wieloma kontami BaseLinker, wybór zamówień do importu, śledzenie wysłanych zamówień i generowanie statystyk sprzedaży.
          </Typography>
          <Typography variant="h6" fontWeight={600} mb={1}>Główne funkcje</Typography>
          <ul style={{ marginBottom: 16, marginLeft: 24 }}>
            <li>Import plików Excel z zamówieniami TEMU</li>
            <li>Obsługa wielu kont BaseLinker (przechowywanie tokenów, szybkie przełączanie)</li>
            <li>Automatyczne pobieranie statusów BaseLinker</li>
            <li>Wybór zamówień do importu (checkboxy, zaznacz/odznacz wszystkie)</li>
            <li>Zapamiętywanie wysłanych zamówień (per użytkownik, nawet po zmianie pliku)</li>
            <li>Nowoczesny dashboard z kafelkami, wykresami i tabelami (statystyki, TOP produkty, miasta, zamówienia z trackingiem)</li>
            <li>Eksport i import użytkowników (backup/restore kont)</li>
            <li>Przyjazny interfejs (Material UI, responsywny design)</li>
          </ul>
          <Typography variant="h6" fontWeight={600} mb={1}>Jak korzystać z programu?</Typography>
          <ol style={{ marginBottom: 16, marginLeft: 24 }}>
            <li>Dodaj konto BaseLinker (login + token API) lub wybierz istniejące.</li>
            <li>Wgraj plik Excel z zamówieniami TEMU.</li>
            <li>Wybierz status docelowy z listy pobranej z BaseLinker.</li>
            <li>Zaznacz zamówienia do importu (możesz użyć „Zaznacz wszystkie” lub wybrać pojedyncze).</li>
            <li>Kliknij „Wyślij zamówienia do Base”, aby zaimportować wybrane zamówienia.</li>
            <li>Przejdź na Dashboard, aby zobaczyć statystyki sprzedaży, TOP produkty, miasta i szczegóły zamówień.</li>
            <li>Możesz eksportować/importować konta użytkowników (backup/restore).</li>
            <li>Przycisk FAQ prowadzi do tej strony z instrukcją i opisem funkcji.</li>
          </ol>
          <Typography variant="h6" fontWeight={600} mb={1}>Najczęstsze pytania</Typography>
          <ul style={{ marginBottom: 16, marginLeft: 24 }}>
            <li><b>Gdzie są przechowywane dane?</b> – Wszystko (konta, zamówienia, statusy) jest zapisywane lokalnie w przeglądarce (localStorage).</li>
            <li><b>Jak przywrócić konta po reinstalacji?</b> – Skorzystaj z funkcji „Importuj użytkowników” i wybierz wcześniej zapisany plik.</li>
            <li><b>Jak działa zapamiętywanie wysłanych zamówień?</b> – System zapisuje ID wysłanych zamówień osobno dla każdego konta, nawet po zmianie pliku.</li>
            <li><b>Jak działa dashboard?</b> – Pokazuje statystyki, wykresy, TOP produkty, miasta i szczegóły zamówień na podstawie zaimportowanych danych.</li>
          </ul>
          <Typography variant="body2" color="text.secondary">W razie pytań lub problemów skontaktuj się z autorem aplikacji.</Typography>
        </Paper>
      </Box>
    </>
  );
} 