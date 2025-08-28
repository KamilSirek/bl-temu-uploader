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
      {/* Przyciski nawigacyjne pod paskiem */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 2 }}>
        <Button variant="contained" sx={{ bgcolor: '#fd6615', color: '#fff', fontWeight: 700, borderRadius: 2 }} onClick={() => router.push('/')}>Import TEMU - Base</Button>
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
          
          <Typography variant="h6" fontWeight={600} mb={2} color="#fd6615" sx={{ mt: 4 }}>📊 Analiza finansowa TEMU - szczegółowe wyjaśnienie</Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#388e3c">💰 Wpływy sprzedawcy</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Co to jest:</b> Kwota, którą sprzedawca faktycznie otrzymuje na swoje konto po sprzedaży produktu na TEMU.<br/>
            <b>Skąd się bierze:</b> Suma trzech wartości z pliku TEMU:<br/>
            • <b>Base Price Total</b> - cena bazowa produktu<br/>
            • <b>Product Tax Total</b> - podatek od produktu<br/>
            • <b>Shipping Tax Total</b> - podatek od wysyłki<br/>
            <b>Wzór:</b> Wpływy = Base Price Total + Product Tax Total + Shipping Tax Total
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#f57c00">💳 Klient zapłacił</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Co to jest:</b> Całkowita kwota, którą klient zapłacił za zamówienie (łącznie z kuponami TEMU).<br/>
            <b>Skąd się bierze:</b> Suma czterech wartości:<br/>
            • <b>Retail Price Total</b> - cena detaliczna produktu<br/>
            • <b>Product Tax Total</b> - podatek od produktu<br/>
            • <b>Shipping Tax Total</b> - podatek od wysyłki<br/>
            • <b>Discount from TEMU</b> - kupon/dopłata TEMU (może być ujemny)<br/>
            <b>Wzór:</b> Klient zapłacił = Retail Price Total + Product Tax Total + Shipping Tax Total + Discount from TEMU
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#d81b60">📈 Prowizja TEMU</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Co to jest:</b> Kwota, którą TEMU pobiera jako prowizję za pośrednictwo w sprzedaży.<br/>
            <b>Skąd się bierze:</b> Różnica między tym, co zapłacił klient, a tym, co dostaje sprzedawca.<br/>
            <b>Wzór:</b> Prowizja TEMU = Klient zapłacił - Wpływy sprzedawcy<br/>
            <b>Uwaga:</b> Może być ujemna, gdy TEMU dopłaca do sprzedaży (np. przez kupony)
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#e034d2">🎫 Dopłaty TEMU (kupony)</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Co to jest:</b> Kwota, którą TEMU dopłaca do zamówienia w formie kuponów lub promocji.<br/>
            <b>Skąd się bierze:</b> Wartość z pola "Discount from TEMU" (zawsze ujemna w pliku).<br/>
            <b>Przykład:</b> Jeśli klient otrzymał kupon -5 zł, to TEMU dopłaca 5 zł do zamówienia.<br/>
            <b>Wpływ na zysk:</b> Im większe dopłaty TEMU, tym mniejsza prowizja TEMU i większy zysk sprzedawcy.
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#d32f2f">❌ Anulowane zamówienia</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Co to jest:</b> Zamówienia ze statusem "Canceled" w pliku TEMU.<br/>
            <b>Wpływ na analizę:</b> Anulowane zamówienia są wykluczane z wszystkich obliczeń finansowych.<br/>
            <b>Dlaczego:</b> Nie generują żadnych przychodów ani kosztów dla sprzedawcy.
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#1976d2">📊 Wykres sezonowości</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Co pokazuje:</b> Trendy sprzedaży w czasie (dziennie, tygodniowo, miesięcznie).<br/>
            <b>Możliwości:</b> Możesz zaznaczyć/odznaczyć poszczególne linie:<br/>
            • <span style={{color: '#fd6615'}}>Zamówienia</span> - liczba zamówień w czasie<br/>
            • <span style={{color: '#388e3c'}}>Wpływy sprzedawcy</span> - przychody w czasie<br/>
            • <span style={{color: '#f57c00'}}>Klient zapłacił</span> - płatności klientów w czasie<br/>
            • <span style={{color: '#d81b60'}}>Prowizja TEMU</span> - prowizje TEMU w czasie<br/>
            <b>Funkcje:</b> Przyciski "Pokaż wszystko" i "Ukryj wszystko" dla szybkiego zarządzania.
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#f57f17">💡 Przykład praktyczny</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Scenariusz:</b> Produkt o cenie bazowej 20 zł, cenie detalicznej 25 zł, podatkach 5 zł, kuponie TEMU -3 zł<br/>
            <b>Obliczenia:</b><br/>
            • Wpływy sprzedawcy = 20 + 5 = 25 zł<br/>
            • Klient zapłacił = 25 + 5 + (-3) = 27 zł<br/>
            • Prowizja TEMU = 27 - 25 = 2 zł<br/>
            • Dopłata TEMU = 3 zł (wartość bezwzględna z -3)<br/>
            <b>Wynik:</b> Sprzedawca zarabia 25 zł, klient płaci 27 zł, TEMU pobiera prowizję 2 zł i dopłaca 3 zł.
          </Typography>
          
          <Typography variant="h6" fontWeight={600} mb={1} color="#1976d2">📈 Dodatkowe funkcje dashboardu</Typography>
          <Typography mb={2} sx={{ pl: 2 }}>
            <b>Kafelki statystyk:</b> Szybki przegląd najważniejszych wskaźników finansowych.<br/>
            <b>Szczegółowa tabela:</b> Analiza każdego zamówienia z podziałem na wpływy, płatności klienta i prowizje.<br/>
            <b>TOP produkty:</b> Lista najczęściej sprzedawanych produktów z liczbą sztuk.<br/>
            <b>Statystyki dodatkowe:</b> Zamówienia z/bez trackingu, statusy wysyłki, średnie wartości.<br/>
            <b>Zakresy czasowe:</b> Możliwość analizy różnych okresów (dzisiaj, ostatnie 7/30 dni, miesiąc, rok).<br/>
            <b>Zapisywanie ustawień:</b> Twoje preferencje wykresu są automatycznie zapisywane.
          </Typography>
        </Paper>
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