## 1. Implementation
- [x] 1.1 Utwórz szkielet MV3: `extension/manifest.json`, katalogi `content/`, `popup/`, `options/`, `background/`
- [x] 1.2 Zaimplementuj content script bazowy z wstrzykiwaniem `styles.css`
- [x] 1.3 Popup: przełącznik „Focus Mode” (domyślnie OFF; persist w `chrome.storage.sync` z lokalnym fallbackiem)
- [x] 1.4 Options (Settings) UI: pola konfiguracyjne i zapisywanie (collapse threshold, keyword list, TL;DR preview toggle, code-in-blocks highlighting toggle)
- [x] 1.5 Funkcja: `text-collapse` (prog konfigurowalny; domyślnie 400; pierwsze zdanie + „Show more/less”) z ARIA
- [x] 1.6 Funkcja: `code-first` jako TL;DR preview (klon skrótu + link „Jump to full example”; bez przenoszenia oryginału)
- [x] 1.7 Funkcja: `keyword-highlighting` w prozie i liniowe w blokach kodu (zachować kopię znaków 1:1; toggle w Settings)
- [x] 1.8 Detekcja stron dokumentacji (rozszerzona lista wzorców) + ręczny override w popup (persist per‑domena — SHOULD)
- [x] 1.9 Wymagania wydajności: aktywacja < 150 ms; budżet rozmiaru < 100 KB (gzipped < 30 KB)
- [x] 1.10 MV3: minimalne uprawnienia, zero zewnętrznych żądań sieciowych
- [x] 1.11 UI: English only (EN), focus styles i ARIA
- [x] 1.12 GitHub Actions: lint + build + zip artefaktu
- [x] 1.13 Plan testów manualnych (MDN, GitHub Docs, npm, Rust, Python docs, ReadTheDocs, go.dev/pkg.go.dev, nodejs.org/api, learn.microsoft.com)
- [x] 1.14 Ikony (16/48/128) i weryfikacja kontrastu
- [x] 1.15 Dokumentacja (README, instrukcje instalacji/ładowania z katalogu)

## 2. Validation
- [x] 2.1 `openspec validate add-docsfocus-mvp --strict`
- [x] 2.2 Przegląd UX pod kątem dostępności (WCAG 2.1 AA)
- [x] 2.3 Przegląd prywatności (brak telemetryki, brak zewnętrznych żądań)

## 3. Out of Scope (kolejne zmiany)
- Reading mask (gradient overlay)
- Collapsible sections
- Per‑site settings (szczegółowe)
- Dark mode optimization
