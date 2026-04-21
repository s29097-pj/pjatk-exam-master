# PJATK Exam Master 🎓
> **Inżynierski system wspomagania nauki oparty na kognitywistyce i metodzie Active Recall.**

## 🚀 O Projekcie
Projekt powstał jako zaawansowana alternatywa dla pasywnego czytania notatek z PDF-ów. Aplikacja została zaprojektowana, aby zmaksymalizować retencję wiedzy przed egzaminem inżynierskim na PJATK (Polsko-Japońska Akademia Technik Komputerowych).

System zarządza bazą **146 pytań egzaminacyjnych**, podzielonych na 8 bloków tematycznych, od Cyberbezpieczeństwa po Elektronikę i IoT.

## 🧠 Biohacking Edukacyjny (Kluczowe Funkcje)
Aplikacja implementuje techniki naukowo udowodnione jako najskuteczniejsze w procesie zapamiętywania:

* **Active Recall (Efekt Testowania):** Treść odpowiedzi jest domyślnie rozmazana (blur). Zmusza to mózg do aktywnego wysiłku i próby odtworzenia informacji z pamięci przed ich zobaczeniem.
* **Scaffolded Learning (Rusztowanie poznawcze):** Sekcja "Słowa Kluczowe" działa jako podpowiedź (hint). Pozwala "zaskoczyć" pamięci, gdy sam tytuł pytania to za mało, bez podawania gotowej odpowiedzi.
* **Multisensory Learning:** Zintegrowany lektor audio (Zofia/Marek) angażuje zmysł słuchu. Jednoczesne czytanie i słuchanie tekstu tworzy podwójny ślad pamięciowy (Dual Coding Theory).
* **Gamifikacja i Feedback:** Dynamiczny pasek postępu oraz system oceniania (🔴🟡🟢) budują pętlę dopaminową, motywując do "zazielenienia" całego materiału.
* **Symulator Egzaminu:** Funkcja losowania zestawów pytań pozwala na weryfikację wiedzy w warunkach zbliżonych do realnego egzaminu.

## 🛠️ Architektura Techniczna
Projekt został zbudowany zgodnie z zasadą **Zero-Backend**, co czyni go idealnym do hostowania na GitHub Pages.

* **Frontend:** Czysty HTML5 i CSS3 (Responsive Design, Glassmorphism, zaawansowane filtry graficzne).
* **Logic:** Vanilla JavaScript (ES6+). Brak zewnętrznych bibliotek zapewnia błyskawiczne działanie.
* **Navigation:** Układ **Master-Detail (Sidebar)** zapewniający natychmiastowy dostęp do każdej kategorii bez przeładowywania strony.
* **Persistence:** Wykorzystanie localStorage i sessionStorage do trwałego zapamiętywania postępów nauki i statusu pytań bezpośrednio w przeglądarce użytkownika.

## ⚙️ Instalacja i Uruchomienie
Aplikacja nie wymaga serwera. Aby zacząć naukę:
1. Sklonuj repozytorium.
2. Otwórz plik index.html w dowolnej nowoczesnej przeglądarce.
3. (Opcjonalnie) Wypchnij projekt na **GitHub Pages**, aby uczyć się wygodnie na tablecie lub telefonie.

## 📂 Nota od autora
Zastrzegam: nie robię poprawek na życzenie (to nie helpdesk), ale jak znajdziecie błąd merytoryczny w którymś z pytań – dajcie znać, wtedy zaktualizuję bazę!

---
### ⚖️ Licencja i Prawa Autorskie
Projekt stworzony przez studenta dla studentów.

* **Kod aplikacji:** Udostępniony na licencji **[MIT](LICENSE)**. Możesz dowolnie kopiować i modyfikować silnik aplikacji (SPA).
* **Treści edukacyjne:** Notatki, pytania oraz fragmenty publikacji (np. "Kryminalistyka cyfrowa") są cytowane na podstawie **Prawa Cytatu** (Art. 29 ustawy o prawie autorskim) wyłącznie w celach edukacyjnych. Prawa autorskie do tych treści należą do ich pierwotnych autorów/wydawców.
* **Użytek:** Projekt ma charakter niekomercyjny i naukowy.