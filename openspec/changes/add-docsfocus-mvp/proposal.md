## Why
Programistom (zwłaszcza z trudnościami w koncentracji i czytaniu) trudno jest szybko przetwarzać długie, gęste strony dokumentacji. DocsFocus redukuje obciążenie poznawcze przez ukrywanie ścian tekstu, priorytetyzację przykładów kodu i lekkie podświetlenia semantyczne — lokalnie, bez AI i bez śledzenia.

## What Changes
- Dodanie szkieletu rozszerzenia Chrome (Manifest V3) i struktury plików (content, popup, options, service worker)
- ADDED: Globalny przełącznik „Focus Mode” w popup (domyślnie OFF; włącza/wyłącza funkcje)
- ADDED: Ukrywanie długich akapitów z progiem konfigurowalnym (domyślnie 400) + „Show more/less”
- ADDED: „Code Examples First” jako TL;DR preview — klon skrótu kodu na górze sekcji z linkiem do oryginału; przełączalne w ustawieniach
- ADDED: Semantyczne podświetlenie słów kluczowych w prozie i (liniowo) w blokach kodu; lista słów i włączenie kodu konfigurowalne
- ADDED: Strona Settings (Options): próg collapse, lista słów kluczowych, toggles (code highlighting, TL;DR preview)
- ADDED: Detekcja stron dokumentacji (rozszerzona lista wzorców) + ręczne wymuszenie i pamięć per‑domena (MVP: SHOULD)
- ADDED: Wymagania prywatności i wydajności (MV3, zero zewnętrznych żądań, <150 ms aktywacji, rozmiar <100 KB)

## Impact
- Affected specs: `extension-shell`, `focus-mode`, `text-collapse`, `code-first`, `keyword-highlighting`, `settings`, `site-detection`, `privacy-performance`
- Affected code: `extension/manifest.json`, `extension/content/*`, `extension/popup/*`, `extension/options/*`, `extension/background/service-worker.js`

## Decisions
- Focus Mode domyślnie OFF po instalacji
- Próg długości akapitów konfigurowalny w Settings (domyślnie 400)
- Podświetlenia obejmują prozę oraz bloki kodu (liniowo), z możliwością wyłączenia
- „Code Examples First” realizowane jako TL;DR preview (klon + link), konfigurowalne; brak przenoszenia oryginału
- UI w języku angielskim (EN) w MVP
