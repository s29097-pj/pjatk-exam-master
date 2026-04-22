// ==========================================
// KOMPLETYNY MÓZG APLIKACJI (script.js)
// ==========================================

// --- 1. NAWIGACJA SIDEBARA (TABY) ---
function switchTab(tabId) {
    // 1. Ukryj wszystkie panele treści
    document.querySelectorAll('.block-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // 2. Odznacz wszystkie przyciski w sidebarze
    document.querySelectorAll('.nav-block-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. Pokaż właściwy panel
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');

    // 4. Znajdź aktywny przycisk, zaznacz go i WYCENTRUJ na ekranie
    const targetBtn = document.querySelector(`.nav-block-btn[onclick="switchTab('${tabId}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');

        // MAGIA UX: Przewinięcie paska tak, aby kliknięty blok był na środku
        targetBtn.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }

    // 5. Na mobile: zamknij menu (jeśli używasz hamburgera do progress baru)
    const menu = document.getElementById('progressMenu');
    if (menu && menu.classList.contains('mobile-open')) {
        toggleMobileMenu();
    }
}

// --- 2. ZARZĄDZANIE GŁOSEM I CZYTANIEM (SILNIK CHUNKOWANIA) ---
let speechChunks = [];
let currentChunkIndex = 0;
let isSpeakingState = false;
let isPausedState = false;
let currentUtterance = null;

function setVoicePreference(gender) {
    localStorage.setItem('voiceGender', gender);
    stopSpeech(); // Po zmianie głosu resetujemy odtwarzacz
}

function getVoicePreference() {
    return localStorage.getItem('voiceGender') || 'female';
}

function updateAudioUI(playText, stopDisplay) {
    const playBtn = document.getElementById('audioBtn');
    const stopBtn = document.getElementById('stopAudioBtn');
    if (playBtn) playBtn.innerHTML = playText;
    if (stopBtn) stopBtn.style.display = stopDisplay;
}

// Twardy reset całego systemu czytania
function stopSpeech() {
    window.speechSynthesis.cancel();
    speechChunks = [];
    currentChunkIndex = 0;
    isSpeakingState = false;
    isPausedState = false;
    currentUtterance = null;
    updateAudioUI('🔊 Czytaj', 'none');
}

// Funkcja wyciągająca i odtwarzająca kolejne zdanie z kolejki
function playNextChunk() {
    // 1. Sprawdzamy czy dotarliśmy do końca tekstu
    if (currentChunkIndex >= speechChunks.length) {
        stopSpeech();
        return;
    }

    // 2. Blokada, jeśli użytkownik wcisnął pauzę w międzyczasie
    if (isPausedState) return;

    const text = speechChunks[currentChunkIndex];
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'pl-PL';
    currentUtterance.rate = 1.05;

    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const polishVoices = voices.filter(v => v.lang.includes('pl') || v.lang.includes('PL'));
    const preferredGender = getVoicePreference();
    const targetName = preferredGender === 'female' ? 'Zofia' : 'Marek';

    if (polishVoices.length > 0) {
        let bestVoice = polishVoices.find(v => v.name.includes(targetName) && v.name.includes('Online')) ||
            polishVoices.find(v => v.name.includes(targetName)) ||
            polishVoices.find(v => v.name.includes('Premium')) ||
            polishVoices.find(v => v.name.includes('Google')) ||
            polishVoices[0];
        currentUtterance.voice = bestVoice;
    }

    // Kiedy skończy czytać zdanie, odpal kolejne
    currentUtterance.onend = function() {
        if (!isPausedState) {
            currentChunkIndex++;
            playNextChunk();
        }
    };

    // Zabezpieczenie na błędy przerywania
    currentUtterance.onerror = function(e) {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.error("Speech API Error:", e);
        }
    };

    synth.speak(currentUtterance);
}

// Główna logika (Start / Pauza / Wznów)
function toggleSpeech() {
    const synth = window.speechSynthesis;

    // 1. Jeśli CZYTA -> PAUZA
    if (isSpeakingState && !isPausedState) {
        isPausedState = true;
        synth.cancel(); // Twarde przerwanie na mobile zapobiega bugom pamięciowym
        updateAudioUI('▶️ Wznów', 'inline-block');
        return;
    }

    // 2. Jeśli jest ZAPAUZOWANY -> WZNÓW
    if (isSpeakingState && isPausedState) {
        isPausedState = false;
        updateAudioUI('⏸️ Pauza', 'inline-block');
        playNextChunk(); // Puszcza ponownie to samo zdanie, na którym skończyliśmy
        return;
    }

    // 3. Jeśli NIC NIE CZYTA -> ZBUDUJ KOLEJKĘ I START
    const titleElement = document.getElementById('q-title');
    const contentElement = document.getElementById('q-content');
    if (!titleElement || !contentElement) return;

    synth.cancel(); // Czyścimy pamięć

    // Pobieramy surowy tekst z HTML i sprzątamy zbedne spacje
    const rawText = titleElement.innerText + ". " + contentElement.innerText;
    const cleanText = rawText.replace(/\s+/g, ' ');

    // Magia Regex: Dzielimy tekst na tablicę zdań (rozbijamy po kropkach, znakach zapytania i wykrzyknikach)
    speechChunks = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];

    // Sprzątamy puste kawałki
    speechChunks = speechChunks.map(s => s.trim()).filter(s => s.length > 2);

    currentChunkIndex = 0;
    isSpeakingState = true;
    isPausedState = false;

    updateAudioUI('⏸️ Pauza', 'inline-block');
    playNextChunk(); // Odpalamy pierwszy kawałek
}

// --- 3. ZAPISYWANIE OCENY I POWRÓT ---
function saveAndReturn(status) {
    window.speechSynthesis.cancel();
    const filename = window.location.pathname.split('/').pop().replace('.html', '');
    const qId = 'q-' + filename;
    localStorage.setItem(qId, status);
    sessionStorage.setItem('returnToQuestion', qId);
    history.back();
}

// --- 4. LOGIKA ROZWIJANIA KURSÓW W PANELACH ---
let isAllExpanded = false;

function toggleBlock(element) {
    element.classList.toggle('active');
    const content = element.nextElementSibling;
    if (content) {
        content.style.display = content.style.display === "block" ? "none" : "block";
    }
}

function toggleAll() {
    isAllExpanded = !isAllExpanded;
    const btn = document.getElementById('globalToggleBtn');
    if (btn) btn.textContent = isAllExpanded ? "Zwiń wszystko" : "Rozwiń wszystko";

    document.querySelectorAll('.course-header').forEach(header => {
        if (isAllExpanded) {
            header.classList.add('active');
            if (header.nextElementSibling) header.nextElementSibling.style.display = "block";
        } else {
            header.classList.remove('active');
            if (header.nextElementSibling) header.nextElementSibling.style.display = "none";
        }
    });
}

// --- 5. OBSŁUGA STATUSÓW (KROPKI) I POSTĘPU ---
function setStatus(id, color, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    localStorage.setItem(id, color);
    const li = document.getElementById(id);
    if (li) applyStatusUI(li, color);
    updateProgressBar();
}

function applyStatusUI(li, color) {
    li.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
    const dot = li.querySelector(`.dot-${color}`);
    if(dot) dot.classList.add('active');

    const colors = {
        'grey': '#f8f9f9',
        'red': '#fdedec',
        'yellow': '#fef9e7',
        'green': '#e9f7ef'
    };
    li.style.backgroundColor = colors[color] || colors['grey'];
}

function updateProgressBar() {
    const progressVal = document.getElementById('progress-val');
    const progressFill = document.getElementById('progress-fill');
    if (!progressVal || !progressFill) return;

    let count = 0;
    const total = 146;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('q-') && localStorage.getItem(key) === 'green') {
            count++;
        }
    }

    progressVal.textContent = count;
    const percentage = (count / total * 100);
    progressFill.style.width = percentage + '%';
}

// --- 6. SYMULATOR EGZAMINU ---
function generateRandomSet() {
    const allQuestions = Array.from(document.querySelectorAll('.question-link'));
    if (allQuestions.length === 0) return;

    const randomSet = [];
    const seenIndices = new Set();

    while(randomSet.length < 3 && allQuestions.length >= 3) {
        const idx = Math.floor(Math.random() * allQuestions.length);
        if(!seenIndices.has(idx)) {
            seenIndices.add(idx);
            randomSet.push(allQuestions[idx].cloneNode(true));
        }
    }

    const list = document.getElementById('random-questions-list');
    if (list) {
        list.innerHTML = '';
        randomSet.forEach(q => {
            q.style.display = 'block';
            q.style.marginBottom = '10px';
            q.style.padding = '15px';
            q.style.border = '1px solid #ddd';
            q.style.borderRadius = '8px';
            q.style.backgroundColor = '#f9f9f9';
            const dots = q.querySelector('.status-dots');
            if(dots) dots.remove();
            list.appendChild(q);
        });
    }

    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('modalExam').style.display = 'block';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalExam').style.display = 'none';
}

// --- 7. MENU HAMBURGEROWE ---
function toggleMobileMenu() {
    const menu = document.getElementById('progressMenu');
    const btn = document.querySelector('.hamburger-btn');
    if(menu && btn) {
        menu.classList.toggle('mobile-open');
        btn.classList.toggle('is-active');
    }
}

// --- 8. INICJALIZACJA (ON LOAD) ---
window.addEventListener('DOMContentLoaded', () => {

    // A) Podstrony: Active Recall (Dwuetapowy) i Panel Ocen
    const questionContent = document.getElementById('q-content');
    const container = document.querySelector('.container');

    // ZMIANA: Szukamy słów kluczowych globalnie na całej stronie
    const keywordsBox = document.querySelector('.keywords-box');

    if (questionContent && container) {

        // 0. WSTRZYKIWANIE TOP BARU (Nawigacja i Audio)
        const topBar = document.createElement('div');
        topBar.className = 'top-bar';
        topBar.innerHTML = `
            <div class="top-bar-inner">
                <a href="../index.html" class="nav-back" onclick="stopSpeech()">← Wróć do spisu treści</a>
                <div class="audio-controls-top">
                    <div class="voice-toggles">
                        <label><input type="radio" name="voice" value="female" onclick="setVoicePreference('female')"> Zofia</label>
                        <label><input type="radio" name="voice" value="male" onclick="setVoicePreference('male')"> Marek</label>
                    </div>
                    <button id="audioBtn" class="btn-audio-minimal" onclick="toggleSpeech()">🔊 Czytaj</button>
                    <button id="stopAudioBtn" class="btn-audio-minimal" onclick="stopSpeech()" style="display: none; margin-left: 5px; color: #e74c3c; border-color: #fadbd8; background-color: #fdedec;">⏹️ Stop</button>
                </div>
            </div>
        `;
        // Wstawiamy Top Bar na samą górę kontenera
        container.insertBefore(topBar, container.firstChild);

        // 1. Tworzenie kontenerów i przycisków
        // Wrapper dla TEKSTU GŁÓWNEGO
        const textWrapper = document.createElement('div');
        textWrapper.className = 'content-blur-wrapper';
        const textBtnContainer = document.createElement('div');
        textBtnContainer.className = 'reveal-btn-container';
        const textRevealBtn = document.createElement('button');
        textRevealBtn.className = 'btn-reveal';
        textRevealBtn.innerHTML = '👁️ Pokaż odpowiedź';

        // Wrapper dla SŁÓW KLUCZOWYCH
        let kwWrapper, kwBtnContainer, kwRevealBtn;
        if (keywordsBox) {
            kwWrapper = document.createElement('div');
            kwWrapper.className = 'content-blur-wrapper kw-wrapper';
            kwBtnContainer = document.createElement('div');
            kwBtnContainer.className = 'reveal-btn-container';
            kwRevealBtn = document.createElement('button');
            kwRevealBtn.className = 'btn-reveal btn-reveal-kw';
            kwRevealBtn.innerHTML = '💡 Podpowiedź (Słowa kluczowe)';
        }

        // 2. Pakowanie elementów w mgłę (w miejscach, gdzie aktualnie stoją w HTML)
        if (keywordsBox) {
            keywordsBox.parentNode.insertBefore(kwWrapper, keywordsBox);
            keywordsBox.classList.add('content-blurred');
            kwWrapper.appendChild(keywordsBox);
            kwBtnContainer.appendChild(kwRevealBtn);
            kwWrapper.appendChild(kwBtnContainer);
        }

        questionContent.parentNode.insertBefore(textWrapper, questionContent);
        questionContent.classList.add('content-blurred');
        textWrapper.appendChild(questionContent);
        textBtnContainer.appendChild(textRevealBtn);
        textWrapper.appendChild(textBtnContainer);

        // 3. Generowanie ukrytego panelu ocen (Zawsze pod głównym tekstem)
        const assessmentPanel = document.createElement('div');
        assessmentPanel.className = 'assessment-panel-minimal';
        assessmentPanel.style.display = 'none';
        assessmentPanel.innerHTML = `
            <span>Jak oceniasz swoją wiedzę?</span>
            <div class="status-buttons-minimal">
                <button class="btn-stat minimal-red" onclick="saveAndReturn('red')">🔴 Nie umiem</button>
                <button class="btn-stat minimal-yellow" onclick="saveAndReturn('yellow')">🟡 Kojarzę</button>
                <button class="btn-stat minimal-green" onclick="saveAndReturn('green')">🟢 Umiem</button>
            </div>
        `;
        textWrapper.parentNode.insertBefore(assessmentPanel, textWrapper.nextSibling);

        // 4. Logika odkrywania (Kliknięcia)
        if (keywordsBox) {
            kwRevealBtn.onclick = () => {
                keywordsBox.classList.remove('content-blurred');
                keywordsBox.classList.add('content-revealed');
                kwBtnContainer.style.display = 'none';
            };
        }

        textRevealBtn.onclick = () => {
            questionContent.classList.remove('content-blurred');
            questionContent.classList.add('content-revealed');
            textBtnContainer.style.display = 'none';

            // Jeśli pokazujesz całą odpowiedź, automatycznie pokaż też słowa kluczowe
            if (keywordsBox && kwBtnContainer.style.display !== 'none') {
                kwRevealBtn.click();
            }

            // Pokaż panel oceny
            assessmentPanel.style.display = 'flex';
            assessmentPanel.style.animation = 'fadeInUp 0.4s ease';
        };

        // Integracja z Lektorem Audio (Odkrywa wszystko, by czytać na głos)
        const audioBtn = document.getElementById('audioBtn');
        if(audioBtn) {
            audioBtn.addEventListener('click', () => {
                if(textBtnContainer.style.display !== 'none') textRevealBtn.click();
            });
        }

        // Ustawienie radia dla głosu
        const savedGender = getVoicePreference();
        const voiceInput = document.querySelector(`input[value="${savedGender}"]`);
        if (voiceInput) voiceInput.checked = true;
    }

    // B) Menu Główne: Inicjalizacja pytań i kropek
    const questionItems = document.querySelectorAll('.question-item');
    if (questionItems.length > 0) {
        questionItems.forEach((li) => {
            const link = li.querySelector('a.question-link');
            const href = link.getAttribute('href');
            const filename = href.split('/').pop().replace('.html', '');
            const qId = 'q-' + filename;
            li.id = qId;
            li.dataset.id = qId;

            const dotsDiv = document.createElement('div');
            dotsDiv.className = 'status-dots';
            dotsDiv.innerHTML = `
                <div class="dot dot-grey" onclick="setStatus('${qId}', 'grey', event)">⚪</div>
                <div class="dot dot-red" onclick="setStatus('${qId}', 'red', event)">🔴</div>
                <div class="dot dot-yellow" onclick="setStatus('${qId}', 'yellow', event)">🟡</div>
                <div class="dot dot-green" onclick="setStatus('${qId}', 'green', event)">🟢</div>
            `;
            link.appendChild(dotsDiv);

            const saved = localStorage.getItem(qId) || 'grey';
            applyStatusUI(li, saved);

            link.addEventListener('click', () => {
                sessionStorage.setItem('returnToQuestion', qId);
            });
        });
        updateProgressBar();
    }

    window.speechSynthesis.getVoices();
});

// --- 9. ANIMACJA POWROTU I AUTO-PRZEŁĄCZANIE TABÓW ---
window.addEventListener('pageshow', () => {
    const targetId = sessionStorage.getItem('returnToQuestion');
    if (targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            let current = targetElement;
            while (current && current.classList) {
                // Rozwiń kurs (podkategorię)
                if (current.classList.contains('course-content')) {
                    current.style.display = 'block';
                    const header = current.previousElementSibling;
                    if (header) header.classList.add('active');
                }
                // PRZEŁĄCZ TAB SIDEBARA (Najważniejsze!)
                if (current.classList.contains('block-panel')) {
                    switchTab(current.id);
                }
                current = current.parentElement;
            }

            setTimeout(() => {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetElement.classList.add('highlight-return');
                setTimeout(() => targetElement.classList.remove('highlight-return'), 1600);
            }, 100);

            sessionStorage.removeItem('returnToQuestion');
        }
    }

    // Refresh postępu po powrocie
    if (document.querySelectorAll('.question-item').length > 0) {
        document.querySelectorAll('.question-item').forEach(li => {
            if (li.dataset && li.dataset.id) {
                const saved = localStorage.getItem(li.dataset.id) || 'grey';
                applyStatusUI(li, saved);
            }
        });
        updateProgressBar();
    }

});

// ==========================================
// --- 10. WYSZUKIWARKA GLOBALNA Z PODŚWIETLANIEM (DROPDOWN) ---
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const allLinks = document.querySelectorAll('.question-link');

    if(searchInput && searchResults) {
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.trim().toLowerCase();

            if (term.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            searchResults.innerHTML = '';
            let matchCount = 0;

            allLinks.forEach(link => {
                const originalText = link.textContent;
                const lowerText = originalText.toLowerCase();

                if(lowerText.includes(term)) {
                    matchCount++;

                    const resultItem = document.createElement('a');
                    resultItem.href = link.getAttribute('href');
                    resultItem.style.display = 'block';
                    resultItem.style.padding = '10px 15px';
                    resultItem.style.borderBottom = '1px solid #f1f2f6';
                    resultItem.style.textDecoration = 'none';
                    resultItem.style.color = '#2c3e50';
                    resultItem.style.fontSize = '14px';
                    resultItem.style.lineHeight = '1.4';

                    const regex = new RegExp(`(${term})`, "gi");
                    const highlightedText = originalText.replace(regex, "<mark style='background-color: #f1c40f; color: #000; padding: 0 2px; border-radius: 3px; font-weight: bold;'>$1</mark>");

                    resultItem.innerHTML = highlightedText;

                    resultItem.addEventListener('mouseenter', () => resultItem.style.backgroundColor = '#f8f9fa');
                    resultItem.addEventListener('mouseleave', () => resultItem.style.backgroundColor = 'transparent');

                    searchResults.appendChild(resultItem);
                }
            });

            if (matchCount > 0) {
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = '<div style="padding: 12px 15px; color: #7f8c8d; font-size: 14px; text-align: center; font-style: italic;">Brak pasujących zagadnień...</div>';
                searchResults.style.display = 'block';
            }
        });

        document.addEventListener('click', function(event) {
            if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
});

// ==========================================
// --- 11. PRZYCISK "SCROLL TO TOP" ---
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Tworzymy przycisk w locie i dodajemy do body
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-to-top';
    scrollTopBtn.innerHTML = '↑';
    scrollTopBtn.title = 'Wróć na górę';
    document.body.appendChild(scrollTopBtn);

    // Nasłuchujemy przewijania strony
    window.addEventListener('scroll', () => {
        // Jeśli zjechaliśmy więcej niż 300px w dół -> pokaż przycisk
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    // Płynne przewijanie do góry po kliknięciu
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});