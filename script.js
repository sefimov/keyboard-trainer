// Русская раскладка клавиатуры
const keyboardLayout = [
    [
        { main: 'ё', hint: '`' },
        { main: '1', hint: '!' },
        { main: '2', hint: '"' },
        { main: '3', hint: '№' },
        { main: '4', hint: ';' },
        { main: '5', hint: '%' },
        { main: '6', hint: ':' },
        { main: '7', hint: '?' },
        { main: '8', hint: '*' },
        { main: '9', hint: '(' },
        { main: '0', hint: ')' },
        { main: '-', hint: '_' },
        { main: '=', hint: '+' }
    ],
    [
        { main: 'й', hint: 'q' },
        { main: 'ц', hint: 'w' },
        { main: 'у', hint: 'e' },
        { main: 'к', hint: 'r' },
        { main: 'е', hint: 't' },
        { main: 'н', hint: 'y' },
        { main: 'г', hint: 'u' },
        { main: 'ш', hint: 'i' },
        { main: 'щ', hint: 'o' },
        { main: 'з', hint: 'p' },
        { main: 'х', hint: '[' },
        { main: 'ъ', hint: ']' },
        { main: '\\', hint: '\\' }
    ],
    [
        { main: 'ф', hint: 'a' },
        { main: 'ы', hint: 's' },
        { main: 'в', hint: 'd' },
        { main: 'а', hint: 'f' },
        { main: 'п', hint: 'g' },
        { main: 'р', hint: 'h' },
        { main: 'о', hint: 'j' },
        { main: 'л', hint: 'k' },
        { main: 'д', hint: 'l' },
        { main: 'ж', hint: ';' },
        { main: 'э', hint: "'" }
    ],
    [
        { main: 'я', hint: 'z' },
        { main: 'ч', hint: 'x' },
        { main: 'с', hint: 'c' },
        { main: 'м', hint: 'v' },
        { main: 'и', hint: 'b' },
        { main: 'т', hint: 'n' },
        { main: 'ь', hint: 'm' },
        { main: 'б', hint: ',' },
        { main: 'ю', hint: '.' }
    ]
];

class KeyboardTrainer {
    constructor() {
        this.words = [];
        this.allWords = [];
        this.currentWordIndex = 0;
        this.currentInput = '';
        this.errors = 0;
        this.totalChars = 0;
        this.isActive = false;
        this.currentKey = null;
        this.isCelebrating = false;
        this.pendingNextWord = false;
        
        // Настройки доступности
        this.settings = {
            soundFeedback: false,
            fontSize: 'large',
            simplifiedMode: true,
            highContrast: false,
            customWords: null
        };

        this.init();
    }

    async init() {
        this.loadSettings(); // Загружаем настройки сначала
        await this.loadWords();
        this.createKeyboard();
        this.setupEventListeners();
        this.setupSettingsListeners();
        this.applySettings();
        this.updateStats();
    }

    async loadWords() {
        // Сначала проверяем, есть ли пользовательские слова в настройках
        if (this.settings.customWords && this.settings.customWords.length > 0) {
            this.allWords = [...this.settings.customWords];
            this.words = [...this.allWords];
            document.getElementById('total-words').textContent = this.words.length;
            return;
        }
        
        // Если пользовательских слов нет, загружаем из файла
        try {
            const response = await fetch('words.txt');
            const text = await response.text();
            this.allWords = text
                .split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length > 0);
            this.words = [...this.allWords];
        } catch (error) {
            console.error('Ошибка загрузки слов:', error);
            // Fallback слова
            this.allWords = ['привет', 'мир', 'компьютер', 'клавиатура'];
            this.words = [...this.allWords];
        }
        document.getElementById('total-words').textContent = this.words.length;
    }
    
    loadCustomWords() {
        const customWordsText = document.getElementById('custom-words').value;
        if (customWordsText.trim()) {
            const words = customWordsText
                .split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length > 0);
            
            if (words.length > 0) {
                this.settings.customWords = words;
                this.allWords = [...words];
                this.words = [...words];
                this.saveSettings();
                document.getElementById('total-words').textContent = this.words.length;
                return true;
            }
        }
        return false;
    }

    createKeyboard() {
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = '';

        keyboardLayout.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(key => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                keyDiv.dataset.key = key.main;
                keyDiv.innerHTML = `
                    <span class="key-label">${key.main}</span>
                    <span class="key-hint">${key.hint}</span>
                `;
                rowDiv.appendChild(keyDiv);
            });

            keyboard.appendChild(rowDiv);
        });
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        // Обработка физической клавиатуры
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));

        // Обработка кликов по виртуальной клавиатуре
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => {
                const keyChar = key.dataset.key;
                this.processKey(keyChar);
            });
        });
    }

    handleKeyPress(e) {
        // Обработка пробела для закрытия празднования
        if (e.key === ' ' || e.key === 'Spacebar') {
            if (this.isCelebrating) {
                e.preventDefault();
                this.hideCelebration();
                if (this.pendingNextWord) {
                    this.nextWord();
                    this.pendingNextWord = false;
                }
                return;
            }
        }

        if (!this.isActive) return;

        const key = e.key.toLowerCase();
        const keyElement = document.querySelector(`[data-key="${key}"]`);

        if (keyElement) {
            keyElement.classList.add('active');
            this.currentKey = keyElement;
        }

        // Обработка Backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.handleBackspace();
            return;
        }

        // Обработка обычных символов
        if (key.length === 1 && /[а-яё0-9\-=\\]/.test(key)) {
            e.preventDefault();
            this.processKey(key);
        }
    }

    handleKeyRelease(e) {
        const key = e.key.toLowerCase();
        const keyElement = document.querySelector(`[data-key="${key}"]`);

        if (keyElement) {
            keyElement.classList.remove('active');
            if (this.currentKey === keyElement) {
                this.currentKey = null;
            }
        }
    }

    processKey(key) {
        if (!this.isActive) return;

        const currentWord = this.words[this.currentWordIndex];
        const expectedChar = currentWord[this.currentInput.length];

        this.totalChars++;

        if (key === expectedChar) {
            this.currentInput += key;
            this.updateDisplay();
            this.highlightKey(key, 'correct');
            this.playSound('correct');

            // Проверка завершения слова
            if (this.currentInput === currentWord) {
                this.playSound('complete');
                this.showCelebration();
                this.pendingNextWord = true;
                // Автоматическое скрытие через 15 секунд, если пользователь не нажал пробел
                setTimeout(() => {
                    if (this.isCelebrating) {
                        this.hideCelebration();
                        if (this.pendingNextWord) {
                            this.nextWord();
                            this.pendingNextWord = false;
                        }
                    }
                }, 15000);
            }
        } else {
            this.errors++;
            this.highlightKey(key, 'incorrect');
            this.playSound('incorrect');
            this.updateStats();
        }
    }

    handleBackspace() {
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1);
            this.updateDisplay();
        }
    }

    highlightKey(key, type) {
        const keyElement = document.querySelector(`[data-key="${key}"]`);
        if (keyElement) {
            keyElement.classList.add(type);
            setTimeout(() => {
                keyElement.classList.remove(type);
            }, 300);
        }
    }

    updateDisplay() {
        const currentWord = this.words[this.currentWordIndex];
        const wordDisplay = document.getElementById('current-word');
        const inputDisplay = document.getElementById('input-display');

        wordDisplay.textContent = currentWord;

        let displayHTML = '';
        for (let i = 0; i < currentWord.length; i++) {
            if (i < this.currentInput.length) {
                const char = this.currentInput[i];
                const expectedChar = currentWord[i];
                const className = char === expectedChar ? 'correct' : 'incorrect';
                displayHTML += `<span class="${className}">${char}</span>`;
            } else if (i === this.currentInput.length) {
                displayHTML += `<span class="current">${currentWord[i]}</span>`;
            } else {
                displayHTML += currentWord[i];
            }
        }

        inputDisplay.innerHTML = displayHTML;
        
        // Подсветка следующей клавиши
        this.highlightNextKey();
    }

    highlightNextKey() {
        // Убираем предыдущую подсветку
        document.querySelectorAll('.key.next-key').forEach(key => {
            key.classList.remove('next-key');
        });

        if (!this.isActive || this.words.length === 0) return;

        const currentWord = this.words[this.currentWordIndex];
        if (this.currentInput.length >= currentWord.length) return;

        const nextChar = currentWord[this.currentInput.length];
        const keyElement = document.querySelector(`[data-key="${nextChar}"]`);

        if (keyElement) {
            keyElement.classList.add('next-key');
        }
    }

    updateStats() {
        document.getElementById('word-number').textContent = this.currentWordIndex + 1;
        document.getElementById('errors').textContent = this.errors;
        
        const accuracy = this.totalChars > 0 
            ? Math.round(((this.totalChars - this.errors) / this.totalChars) * 100)
            : 100;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }

    start() {
        if (this.words.length === 0) {
            alert('Слова не загружены. Проверьте файл words.txt');
            return;
        }

        this.isActive = true;
        this.currentWordIndex = 0;
        this.currentInput = '';
        this.errors = 0;
        this.totalChars = 0;

        document.getElementById('start-btn').textContent = 'Продолжить';
        this.updateDisplay();
        this.updateStats();
    }

    nextWord() {
        this.currentWordIndex++;
        
        if (this.currentWordIndex >= this.words.length) {
            this.isActive = false;
            alert(`Поздравляем! Вы завершили все слова!\nОшибок: ${this.errors}\nТочность: ${document.getElementById('accuracy').textContent}`);
            this.reset();
            return;
        }

        this.currentInput = '';
        this.updateDisplay();
        this.updateStats();
    }

    showCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        if (overlay) {
            this.isCelebrating = true;
            overlay.classList.add('show');
            // Перезапускаем анимацию салюта
            const fireworks = overlay.querySelectorAll('.firework');
            fireworks.forEach(firework => {
                firework.style.animation = 'none';
                setTimeout(() => {
                    firework.style.animation = '';
                }, 10);
            });
        }
    }

    hideCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        if (overlay) {
            this.isCelebrating = false;
            overlay.classList.remove('show');
        }
    }

    reset() {
        this.isActive = false;
        this.currentWordIndex = 0;
        this.currentInput = '';
        this.errors = 0;
        this.totalChars = 0;
        this.isCelebrating = false;
        this.pendingNextWord = false;

        // Убираем подсветку следующей клавиши
        document.querySelectorAll('.key.next-key').forEach(key => {
            key.classList.remove('next-key');
        });

        // Скрываем празднование
        this.hideCelebration();

        document.getElementById('start-btn').textContent = 'Начать';
        document.getElementById('current-word').textContent = '';
        document.getElementById('input-display').innerHTML = '';
        this.updateStats();
    }

    // Настройки доступности
    loadSettings() {
        const saved = localStorage.getItem('keyboardTrainerSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Ошибка загрузки настроек:', e);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('keyboardTrainerSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        const body = document.body;
        const container = document.querySelector('.container');
        
        // Размер шрифта
        body.classList.remove('font-large', 'font-extra-large');
        if (this.settings.fontSize === 'large') {
            body.classList.add('font-large');
        } else if (this.settings.fontSize === 'extra-large') {
            body.classList.add('font-extra-large');
        }
        
        // Упрощенный режим
        if (this.settings.simplifiedMode) {
            container.classList.add('simplified-mode');
        } else {
            container.classList.remove('simplified-mode');
        }
        
        // Высокий контраст
        if (this.settings.highContrast) {
            body.classList.add('high-contrast');
        } else {
            body.classList.remove('high-contrast');
        }
        
        // Обновляем UI элементов настроек
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        document.getElementById('sound-feedback').checked = this.settings.soundFeedback;
        document.getElementById('simplified-mode').checked = this.settings.simplifiedMode;
        document.getElementById('high-contrast').checked = this.settings.highContrast;
        document.getElementById('font-size').value = this.settings.fontSize;
        
        // Загружаем пользовательские слова в textarea
        if (this.settings.customWords && this.settings.customWords.length > 0) {
            document.getElementById('custom-words').value = this.settings.customWords.join('\n');
        } else {
            // Показываем слова из файла
            document.getElementById('custom-words').value = this.allWords.join('\n');
        }
    }

    setupSettingsListeners() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        
        settingsBtn.addEventListener('click', () => {
            const isVisible = settingsPanel.style.display !== 'none';
            settingsPanel.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                this.updateSettingsUI();
            }
        });
        
        // Чекбоксы
        document.getElementById('sound-feedback').addEventListener('change', (e) => {
            this.settings.soundFeedback = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('simplified-mode').addEventListener('change', (e) => {
            this.settings.simplifiedMode = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });
        
        document.getElementById('high-contrast').addEventListener('change', (e) => {
            this.settings.highContrast = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });
        
        // Селекты
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.settings.fontSize = e.target.value;
            this.saveSettings();
            this.applySettings();
        });
        
        // Кнопка сохранения слов
        document.getElementById('save-words-btn').addEventListener('click', () => {
            if (this.loadCustomWords()) {
                alert(`Сохранено ${this.words.length} слов(а)!`);
                this.reset();
            } else {
                alert('Пожалуйста, введите хотя бы одно слово (по одному на строку)');
            }
        });
    }

    playSound(type) {
        if (!this.settings.soundFeedback) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'correct') {
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
            } else if (type === 'incorrect') {
                oscillator.frequency.value = 300;
                oscillator.type = 'sawtooth';
            } else if (type === 'complete') {
                // Восходящая мелодия для завершения
                oscillator.frequency.value = 600;
                oscillator.type = 'sine';
            }
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            // Игнорируем ошибки звука
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new KeyboardTrainer();
});
