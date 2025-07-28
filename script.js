// App State
let questions = JSON.parse(localStorage.getItem('gaaQuestions')) || [];
let exams = JSON.parse(localStorage.getItem('gaaExams')) || [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let quizScore = 0;
let isAdmin = false;
let currentMode = 'landing';
let isDarkMode = localStorage.getItem('gaaDarkMode') === 'true';
let studyTimer = null;
let timerInterval = null;
let voiceRecognition = null;
let isListening = false;
let userStats = JSON.parse(localStorage.getItem('gaaUserStats')) || {
    totalStudyTime: 0,
    totalQuizzes: 0,
    averageScore: 0,
    categoryScores: {},
    studySessions: [],
    currentStreak: 0,
    bestStreak: 0,
    lastStudyDate: null
};

// Voice input functionality for questions and answers
let voiceInputActive = false;
let voiceInputTarget = null;

// Quick Reference Card Navigation
let currentCardIndex = 0;
const quickRefCards = [
    {
        category: 'technical',
        title: 'Technical Fouls',
        icon: '⚖️',
        items: [
            { label: 'Overcarrying', value: 'Max 4 steps' },
            { label: 'Handpass', value: 'Fist or open hand' },
            { label: 'Bouncing', value: 'Once after catch' },
            { label: 'Throwing', value: 'Not allowed' }
        ]
    },
    {
        category: 'aggressive',
        title: 'Aggressive Fouls',
        icon: '🛡️',
        items: [
            { label: 'Yellow Card', value: 'Caution' },
            { label: 'Black Card', value: '10 min sin bin' },
            { label: 'Red Card', value: 'Sent off' },
            { label: 'Charging', value: 'Shoulder to shoulder only' }
        ]
    },
    {
        category: 'setplay',
        title: 'Set Play',
        icon: '🎯',
        items: [
            { label: 'Free Kick', value: '13m distance' },
            { label: 'Penalty', value: '11m from goal' },
            { label: 'Kick-out', value: '20m line' },
            { label: '45m Free', value: 'From 45m line' }
        ]
    },
    {
        category: 'scoring',
        title: 'Scoring',
        icon: '🥅',
        items: [
            { label: 'Goal', value: '3 points' },
            { label: 'Point', value: '1 point' },
            { label: '2-Point Free', value: 'Outside 40m arc' },
            { label: 'Mark', value: 'Clean catch from kick-out' }
        ]
    },
    {
        category: 'timing',
        title: 'Timing',
        icon: '⏰',
        items: [
            { label: 'Game', value: '2 x 30 min' },
            { label: 'Extra Time', value: '2 x 10 min' },
            { label: 'Sin Bin', value: '10 minutes' },
            { label: 'Injury Time', value: "Referee's discretion" }
        ]
    },
    {
        category: 'players',
        title: 'Players',
        icon: '👥',
        items: [
            { label: 'Team Size', value: '15 players' },
            { label: 'Substitutes', value: '6 allowed' },
            { label: 'Interchange', value: 'Unlimited' },
            { label: 'Sin Bin', value: '10 minutes' }
        ]
    }
];

function initializeQuickRef() {
    showQuickRefCard(0);
    updateCardCounter();
}

function showQuickRefCard(index) {
    if (index < 0 || index >= quickRefCards.length) return;
    
    currentCardIndex = index;
    const card = quickRefCards[index];
    const container = document.querySelector('.quickref-container');
    
    if (container) {
        container.innerHTML = `
            <div class="quickref-card active">
                <div class="card-header">
                    <h3>${card.title}</h3>
                    <span class="card-icon">${card.icon}</span>
                </div>
                <div class="card-content">
                    <ul>
                        ${card.items.map(item => `
                            <li><strong>${item.label}:</strong> ${item.value}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    updateCardCounter();
    updateNavigationButtons();
}

function updateCardCounter() {
    const counter = document.getElementById('cardCounter');
    if (counter) {
        counter.textContent = `${currentCardIndex + 1} of ${quickRefCards.length}`;
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentCardIndex === 0;
        prevBtn.style.opacity = currentCardIndex === 0 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentCardIndex === quickRefCards.length - 1;
        nextBtn.style.opacity = currentCardIndex === quickRefCards.length - 1 ? '0.5' : '1';
    }
}

function nextQuickRefCard() {
    if (currentCardIndex < quickRefCards.length - 1) {
        showQuickRefCard(currentCardIndex + 1);
    }
}

function prevQuickRefCard() {
    if (currentCardIndex > 0) {
        showQuickRefCard(currentCardIndex - 1);
    }
}

// DOM Elements
const addQuestionBtn = document.getElementById('addQuestionBtn');
const addQuestionModal = document.getElementById('addQuestionModal');
const closeModal = document.getElementById('closeModal');
const addQuestionForm = document.getElementById('addQuestionForm');
const cancelAdd = document.getElementById('cancelAdd');
const searchInput = document.getElementById('searchInput');
const questionsList = document.getElementById('questionsList');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const categoryCards = document.querySelectorAll('.category-card');
const startQuizBtn = document.getElementById('startQuizBtn');
const resetQuizBtn = document.getElementById('resetQuizBtn');
const quizContainer = document.getElementById('quizContainer');
const quizResults = document.getElementById('quizResults');
const quizProgress = document.getElementById('quizProgress');
const progressFill = document.getElementById('progressFill');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const quizScoreElement = document.getElementById('quizScore');
const retakeQuizBtn = document.getElementById('retakeQuizBtn');
const questionDetailModal = document.getElementById('questionDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const questionDetailContent = document.getElementById('questionDetailContent');
const editQuestionBtn = document.getElementById('editQuestionBtn');
const deleteQuestionBtn = document.getElementById('deleteQuestionBtn');

// PDF Viewer Elements
const downloadRulesBtn = document.getElementById('downloadRulesBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenClose = document.getElementById('fullscreenClose');
const pdfContainer = document.querySelector('.pdf-container');

// New Feature Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const voiceCommandBtn = document.getElementById('voiceCommandBtn');
const studyTimerBtn = document.getElementById('studyTimerBtn');
const ruleOfDayBadge = document.getElementById('ruleOfDayBadge');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const exportResultsBtn = document.getElementById('exportResultsBtn');

// Timer Elements
const studyTimerModal = document.getElementById('studyTimerModal');
const closeTimerModal = document.getElementById('closeTimerModal');
const timeRemaining = document.getElementById('timeRemaining');
const timerStatus = document.getElementById('timerStatus');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const studyDuration = document.getElementById('studyDuration');
const breakDuration = document.getElementById('breakDuration');
const autoStartBreaks = document.getElementById('autoStartBreaks');

// Voice Elements
const voiceModal = document.getElementById('voiceModal');
const closeVoiceModal = document.getElementById('closeVoiceModal');
const voiceIndicator = document.getElementById('voiceIndicator');
const voiceStatus = document.getElementById('voiceStatus');
const startVoiceBtn = document.getElementById('startVoiceBtn');
const stopVoiceBtn = document.getElementById('stopVoiceBtn');
const voiceTranscript = document.getElementById('voiceTranscript');

// Exam Elements
const addExamBtn = document.getElementById('addExamBtn');
const addExamModal = document.getElementById('addExamModal');
const closeExamModal = document.getElementById('closeExamModal');
const addExamForm = document.getElementById('addExamForm');
const cancelExam = document.getElementById('cancelExam');
const addExamQuestionBtn = document.getElementById('addExamQuestionBtn');
const examQuestionsContainer = document.getElementById('examQuestionsContainer');
const examsList = document.getElementById('examsList');

// Rule of Day Elements
const ruleOfDayModal = document.getElementById('ruleOfDayModal');
const closeRuleModal = document.getElementById('closeRuleModal');
const ruleOfDayTitle = document.getElementById('ruleOfDayTitle');
const ruleOfDayDate = document.getElementById('ruleOfDayDate');
const ruleOfDayText = document.getElementById('ruleOfDayText');
const ruleOfDayExample = document.getElementById('ruleOfDayExample');
const ruleOfDayPenalty = document.getElementById('ruleOfDayPenalty');
const addToFavoritesBtn = document.getElementById('addToFavoritesBtn');
const practiceRuleBtn = document.getElementById('practiceRuleBtn');

// Analytics Elements
const overallProgress = document.getElementById('overallProgress');
const totalStudyTime = document.getElementById('totalStudyTime');
const avgSessionTime = document.getElementById('avgSessionTime');
const currentStreak = document.getElementById('currentStreak');
const bestStreak = document.getElementById('bestStreak');
const insightsList = document.getElementById('insightsList');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeApp();
    showLandingPage();
});

// Initialize app features
function initializeApp() {
    // Apply dark mode if enabled
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.textContent = '☀️';
    }
    
    // Initialize voice recognition
    initializeVoiceRecognition();
    
    // Load rule of the day
    loadRuleOfTheDay();
    
    // Update analytics
    updateAnalytics();
    
    // Load exams
    loadExams();
}

// Initialize voice recognition
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        voiceRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        voiceRecognition.continuous = false;
        voiceRecognition.interimResults = false;
        voiceRecognition.lang = 'en-US';
        
        voiceRecognition.onstart = function() {
            isListening = true;
            voiceIndicator.classList.add('listening');
            voiceStatus.textContent = 'Listening...';
            voiceSearchBtn.classList.add('listening');
        };
        
        voiceRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            voiceTranscript.textContent = transcript;
            processVoiceCommand(transcript);
        };
        
        voiceRecognition.onend = function() {
            isListening = false;
            voiceIndicator.classList.remove('listening');
            voiceStatus.textContent = 'Click to start listening';
            voiceSearchBtn.classList.remove('listening');
            stopVoiceBtn.style.display = 'none';
            startVoiceBtn.style.display = 'inline-flex';
        };
        
        voiceRecognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            voiceStatus.textContent = 'Error: ' + event.error;
        };
    } else {
        voiceCommandBtn.style.display = 'none';
        voiceSearchBtn.style.display = 'none';
    }
}

// Process voice commands
function processVoiceCommand(transcript) {
    if (transcript.includes('search for') || transcript.includes('find')) {
        const query = transcript.replace(/search for|find/gi, '').trim();
        searchInput.value = query;
        handleSearch({ target: { value: query } });
        showNotification(`Searching for: ${query}`, 'success');
    } else if (transcript.includes('show technical fouls')) {
        filterByCategory('technical');
        showNotification('Showing Technical Fouls', 'success');
    } else if (transcript.includes('show aggressive fouls')) {
        filterByCategory('aggressive');
        showNotification('Showing Aggressive Fouls', 'success');
    } else if (transcript.includes('start quiz')) {
        startQuiz();
        showNotification('Starting quiz...', 'success');
    } else if (transcript.includes('show rules')) {
        switchTab('rules');
        showNotification('Opening rules reference', 'success');
    } else if (transcript.includes('what is') || transcript.includes('explain')) {
        const rule = transcript.replace(/what is|explain/gi, '').trim();
        searchForRule(rule);
    } else {
        showNotification('Command not recognized. Try: "Search for [topic]", "Start quiz", "Show rules"', 'info');
    }
}

// Search for specific rules
function searchForRule(ruleQuery) {
    // This would integrate with the PDF or rules database
    showNotification(`Searching for rule: ${ruleQuery}`, 'info');
    // Could open PDF and search within it
}

// Load rule of the day
function loadRuleOfTheDay() {
    const today = new Date().toDateString();
    const lastRuleDate = localStorage.getItem('gaaLastRuleDate');
    
    if (lastRuleDate !== today) {
        // Generate new rule of the day
        const rules = [
            {
                title: 'Rule 4.1 - Overcarrying',
                text: 'A player may carry the ball for a maximum of four consecutive steps or hold it for no longer than the time needed to take four steps.',
                example: 'If a player catches the ball and runs more than four steps without bouncing, toe-tapping, or releasing the ball, it\'s a technical foul.',
                penalty: 'Free kick to the opposing team from where the foul occurred.'
            },
            {
                title: 'Rule 5.10 - Cynical Foul',
                text: 'To deliberately pull down an opponent is a cynical foul.',
                example: 'A defender deliberately pulls down an attacking player who is about to score.',
                penalty: 'Black card - player is ordered off for 10 minutes and may be replaced by a substitute.'
            },
            {
                title: 'Rule 1.7 - Fair Charge',
                text: 'A player may make a shoulder to shoulder charge on an opponent who is in possession of the ball.',
                example: 'A defender makes a legal shoulder-to-shoulder challenge on a player carrying the ball.',
                penalty: 'No penalty - this is legal play.'
            }
        ];
        
        const randomRule = rules[Math.floor(Math.random() * rules.length)];
        localStorage.setItem('gaaRuleOfDay', JSON.stringify(randomRule));
        localStorage.setItem('gaaLastRuleDate', today);
    }
    
    const ruleOfDay = JSON.parse(localStorage.getItem('gaaRuleOfDay'));
    if (ruleOfDay) {
        ruleOfDayTitle.textContent = ruleOfDay.title;
        ruleOfDayText.textContent = ruleOfDay.text;
        ruleOfDayExample.textContent = ruleOfDay.example;
        ruleOfDayPenalty.textContent = ruleOfDay.penalty;
        ruleOfDayDate.textContent = today;
    }
}

// Study Timer Functions
function startStudyTimer() {
    const duration = parseInt(studyDuration.value) * 60; // Convert to seconds
    let timeLeft = duration;
    
    studyTimer = {
        duration: duration,
        timeLeft: timeLeft,
        isRunning: true,
        isBreak: false
    };
    
    updateTimerDisplay();
    timerStatus.textContent = 'Study session in progress...';
    startTimerBtn.style.display = 'none';
    pauseTimerBtn.style.display = 'inline-flex';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        studyTimer.timeLeft = timeLeft;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (studyTimer.isBreak) {
                // Break finished, start study session
                startStudySession();
            } else {
                // Study session finished, start break
                startBreak();
            }
        }
    }, 1000);
    
    // Track study session
    trackStudySession();
}

function pauseStudyTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        studyTimer.isRunning = false;
        timerStatus.textContent = 'Timer paused';
        startTimerBtn.style.display = 'inline-flex';
        pauseTimerBtn.style.display = 'none';
    }
}

function resetStudyTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    studyTimer = null;
    timeRemaining.textContent = formatTime(parseInt(studyDuration.value) * 60);
    timerStatus.textContent = 'Ready to start';
    startTimerBtn.style.display = 'inline-flex';
    pauseTimerBtn.style.display = 'none';
}

function startBreak() {
    const breakTime = parseInt(breakDuration.value) * 60;
    studyTimer = {
        duration: breakTime,
        timeLeft: breakTime,
        isRunning: true,
        isBreak: true
    };
    
    timerStatus.textContent = 'Break time!';
    timeRemaining.textContent = formatTime(breakTime);
    
    timerInterval = setInterval(() => {
        studyTimer.timeLeft--;
        updateTimerDisplay();
        
        if (studyTimer.timeLeft <= 0) {
            clearInterval(timerInterval);
            if (autoStartBreaks.checked) {
                startStudySession();
            } else {
                timerStatus.textContent = 'Break finished';
                startTimerBtn.style.display = 'inline-flex';
                pauseTimerBtn.style.display = 'none';
            }
        }
    }, 1000);
}

function startStudySession() {
    const duration = parseInt(studyDuration.value) * 60;
    studyTimer = {
        duration: duration,
        timeLeft: duration,
        isRunning: true,
        isBreak: false
    };
    
    timerStatus.textContent = 'Study session in progress...';
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        studyTimer.timeLeft--;
        updateTimerDisplay();
        
        if (studyTimer.timeLeft <= 0) {
            clearInterval(timerInterval);
            startBreak();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (studyTimer) {
        timeRemaining.textContent = formatTime(studyTimer.timeLeft);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Track study sessions
function trackStudySession() {
    const sessionStart = new Date();
    const session = {
        start: sessionStart,
        duration: parseInt(studyDuration.value),
        category: 'study'
    };
    
    userStats.studySessions.push(session);
    userStats.totalStudyTime += session.duration;
    
    // Update streak
    const today = new Date().toDateString();
    if (userStats.lastStudyDate !== today) {
        userStats.currentStreak++;
        userStats.lastStudyDate = today;
        if (userStats.currentStreak > userStats.bestStreak) {
            userStats.bestStreak = userStats.currentStreak;
        }
    }
    
    saveUserStats();
    updateAnalytics();
}

// Analytics Functions
function updateAnalytics() {
    // Calculate average score
    if (userStats.totalQuizzes > 0) {
        const totalScore = Object.values(userStats.categoryScores).reduce((sum, score) => sum + score, 0);
        userStats.averageScore = Math.round((totalScore / userStats.totalQuizzes) * 100);
    }
    
    // Update display
    overallProgress.textContent = `${userStats.averageScore}%`;
    totalStudyTime.textContent = formatStudyTime(userStats.totalStudyTime);
    avgSessionTime.textContent = `${Math.round(userStats.totalStudyTime / Math.max(userStats.studySessions.length, 1))}m`;
    currentStreak.textContent = userStats.currentStreak;
    bestStreak.textContent = userStats.bestStreak;
    
    // Generate insights
    generateInsights();
}

function formatStudyTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function generateInsights() {
    const insights = [];
    
    // Performance insights
    if (userStats.averageScore < 70) {
        insights.push({
            icon: '📚',
            title: 'Need More Practice',
            text: 'Your average score is below 70%. Focus on your weaker categories.'
        });
    }
    
    if (userStats.currentStreak === 0) {
        insights.push({
            icon: '🔥',
            title: 'Start Your Streak',
            text: 'Begin studying today to start building your learning streak!'
        });
    }
    
    if (userStats.totalStudyTime < 60) {
        insights.push({
            icon: '⏰',
            title: 'More Study Time',
            text: 'You\'ve studied for less than an hour. Regular practice improves retention.'
        });
    }
    
    // Category insights
    const categories = Object.keys(userStats.categoryScores);
    if (categories.length > 0) {
        const worstCategory = categories.reduce((worst, cat) => 
            userStats.categoryScores[cat] < userStats.categoryScores[worst] ? cat : worst
        );
        
        insights.push({
            icon: '🎯',
            title: 'Focus Area',
            text: `Your weakest category is ${getCategoryName(worstCategory)}. Practice more questions in this area.`
        });
    }
    
    // Display insights
    insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.text}</p>
            </div>
        </div>
    `).join('');
}

// Exam Management
function loadExams() {
    if (exams.length === 0) {
        examsList.innerHTML = `
            <div class="empty-state">
                <h3>No exams yet</h3>
                <p>Add previous exam questions to practice with real exam content.</p>
                <button class="btn btn-primary" onclick="showModal(addExamModal)">Add First Exam</button>
            </div>
        `;
        return;
    }
    
    examsList.innerHTML = exams
        .sort((a, b) => b.year - a.year)
        .map(exam => `
            <div class="exam-card" onclick="startExam(${exam.id})">
                <h3>${exam.title}</h3>
                <div class="exam-meta">
                    <span>${exam.year}</span>
                    <span class="exam-level">${exam.level}</span>
                    <span>${exam.questions.length} questions</span>
                </div>
                ${exam.description ? `<p>${exam.description}</p>` : ''}
            </div>
        `).join('');
}

function startExam(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    // Convert exam questions to quiz format
    currentQuiz = exam.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        category: q.category || 'exam',
        explanation: q.explanation
    }));
    
    currentQuestionIndex = 0;
    quizScore = 0;
    
    // Start quiz
    startQuizBtn.style.display = 'none';
    resetQuizBtn.style.display = 'inline-flex';
    exportResultsBtn.style.display = 'inline-flex';
    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    
    showQuizQuestion();
    switchTab('quiz');
}

// Export Results
function exportQuizResults() {
    if (!currentQuiz) return;
    
    const percentage = (quizScore / currentQuiz.length) * 100;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    const results = `
Gaelic Football Rules Quiz Results
Date: ${date} ${time}
Score: ${quizScore}/${currentQuiz.length} (${Math.round(percentage)}%)

Questions Answered:
${currentQuiz.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Performance: ${getPerformanceLevel(percentage)}
    `;
    
    // Create download link
    const blob = new Blob([results], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-results-${date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Results exported successfully!', 'success');
}

function getPerformanceLevel(percentage) {
    if (percentage >= 90) return 'Outstanding';
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
}

// Haptic Feedback
function triggerHapticFeedback(type = 'success') {
    if (navigator.vibrate) {
        if (type === 'success') {
            navigator.vibrate([50, 50, 50]);
        } else {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    // Visual feedback
    const element = document.activeElement || document.body;
    element.classList.add(`haptic-${type}`);
    setTimeout(() => {
        element.classList.remove(`haptic-${type}`);
    }, 300);
}

// Dark Mode Toggle
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('gaaDarkMode', isDarkMode);
    
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        darkModeToggle.textContent = '🌙';
    }
    
    showNotification(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`, 'success');
}

// Smart Search
function setupSmartSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase();
        
        if (query.length < 2) {
            searchSuggestions.classList.remove('active');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            const suggestions = generateSearchSuggestions(query);
            displaySearchSuggestions(suggestions);
        }, 300);
    });
    
    // Voice search
    if (voiceSearchBtn) {
        voiceSearchBtn.addEventListener('click', () => {
            if (isListening) {
                voiceRecognition.stop();
            } else {
                voiceRecognition.start();
                stopVoiceBtn.style.display = 'inline-flex';
                startVoiceBtn.style.display = 'none';
            }
        });
    }
}

function generateSearchSuggestions(query) {
    const suggestions = [];
    
    // Search in questions
    questions.forEach(q => {
        if (q.question.toLowerCase().includes(query)) {
            suggestions.push({
                type: 'question',
                text: q.question.substring(0, 60) + '...',
                action: () => showQuestionDetail(q.id)
            });
        }
    });
    
    // Search in categories
    const categories = ['technical', 'aggressive', 'dissent', 'setplay', 'general', 'scenarios'];
    categories.forEach(cat => {
        if (cat.includes(query)) {
            suggestions.push({
                type: 'category',
                text: `Show ${getCategoryName(cat)} questions`,
                action: () => filterByCategory(cat)
            });
        }
    });
    
    // Common searches
    const commonSearches = [
        { query: 'overcarry', text: 'Search for overcarrying rules' },
        { query: 'penalty', text: 'Search for penalty rules' },
        { query: 'card', text: 'Search for card rules' },
        { query: 'foul', text: 'Search for foul rules' }
    ];
    
    commonSearches.forEach(search => {
        if (search.query.includes(query)) {
            suggestions.push({
                type: 'search',
                text: search.text,
                action: () => {
                    searchInput.value = search.query;
                    handleSearch({ target: { value: search.query } });
                }
            });
        }
    });
    
    return suggestions.slice(0, 5);
}

function displaySearchSuggestions(suggestions) {
    if (suggestions.length === 0) {
        searchSuggestions.classList.remove('active');
        return;
    }
    
    searchSuggestions.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="executeSuggestion(${suggestions.indexOf(suggestion)})">
            ${suggestion.text}
        </div>
    `).join('');
    
    searchSuggestions.classList.add('active');
}

function executeSuggestion(index) {
    const suggestions = generateSearchSuggestions(searchInput.value.toLowerCase());
    if (suggestions[index]) {
        suggestions[index].action();
        searchSuggestions.classList.remove('active');
    }
}

// Save user stats
function saveUserStats() {
    localStorage.setItem('gaaUserStats', JSON.stringify(userStats));
}

// Update quiz tracking
function updateQuizTracking(isCorrect, category) {
    userStats.totalQuizzes++;
    
    if (!userStats.categoryScores[category]) {
        userStats.categoryScores[category] = 0;
    }
    
    if (isCorrect) {
        userStats.categoryScores[category]++;
    }
    
    saveUserStats();
    updateAnalytics();
}

// Core Application Functions
function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    currentMode = 'landing';
}

function showMainApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Only check admin status if not explicitly set to false
    if (isAdmin !== false) {
        checkAdminStatus();
    }
    
    if (isAdmin) {
        showAdminMode();
    } else {
        showUserMode();
    }
    
    currentMode = isAdmin ? 'admin' : 'user';
    loadQuestions();
    updateCategoryCounts();
}

function showAdminMode() {
    showAdminControls();
    switchTab('study');
}

function showUserMode() {
    hideAdminControls();
    switchTab('study');
}

function checkAdminStatus() {
    // Check if user is admin based on stored password
    const storedPassword = localStorage.getItem('gaaAdminPassword');
    const adminPassword = 'cZ8lp41FF1QmzCF';
    
    if (storedPassword === adminPassword) {
        isAdmin = true;
        return true;
    } else {
        isAdmin = false;
        return false;
    }
}

function showAdminControls() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => el.style.display = 'block');
    
    // Show add question button
    if (addQuestionBtn) addQuestionBtn.style.display = 'inline-flex';
}

function hideAdminControls() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => el.style.display = 'none');
    
    // Hide add question button
    if (addQuestionBtn) addQuestionBtn.style.display = 'none';
}

// Modal Functions
function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Tab Navigation
function switchTab(tabName) {
    // Hide all tab contents
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(tabName + 'Mode');
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Add active class to selected tab button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

// Question Management
function loadQuestions(filter = '') {
    const filteredQuestions = filter 
        ? questions.filter(q => 
            q.question.toLowerCase().includes(filter.toLowerCase()) ||
            (q.answer && q.answer.toLowerCase().includes(filter.toLowerCase())) ||
            (q.options && q.options.some(opt => opt.toLowerCase().includes(filter.toLowerCase()))) ||
            q.category.toLowerCase().includes(filter.toLowerCase())
        )
        : questions;
    
    if (filteredQuestions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <h3>No questions found</h3>
                <p>${filter ? 'Try adjusting your search terms.' : 'Add your first question to get started!'}</p>
                ${!filter && isAdmin ? '<button class="btn btn-primary" onclick="showModal(addQuestionModal)">Add Question</button>' : ''}
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = filteredQuestions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(q => {
            // Get answer preview for display
            let answerPreview = '';
            if (q.options && q.correctAnswerIndex !== undefined) {
                answerPreview = q.options[q.correctAnswerIndex];
            } else {
                answerPreview = q.answer || 'No answer provided';
            }
            
            return `
                <div class="question-card" onclick="showQuestionDetail(${q.id})">
                    <h3>${q.question}</h3>
                    <p>${answerPreview.substring(0, 100)}${answerPreview.length > 100 ? '...' : ''}</p>
                    <div class="question-meta">
                        <span class="category-badge">${getCategoryName(q.category)}</span>
                        <span>${new Date(q.createdAt).toLocaleDateString()}</span>
                        ${q.options ? '<span class="format-badge">Multiple Choice</span>' : ''}
                    </div>
                    ${isAdmin ? `
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">
                            💡 Tap to view, edit, or delete
                        </div>
                    ` : `
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">
                            💡 Tap to view
                        </div>
                    `}
                </div>
            `;
        }).join('');
}

function showQuestionDetail(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Handle both old format (single answer) and new format (multiple choice)
    let answerDisplay = '';
    if (question.options && question.correctAnswerIndex !== undefined) {
        // New multiple choice format
        answerDisplay = `
            <div class="answer">
                <strong>Correct Answer:</strong><br>
                ${question.options[question.correctAnswerIndex]}
            </div>
            <div class="all-options">
                <strong>All Options:</strong><br>
                ${question.options.map((option, index) => `
                    <div class="option-display ${index === question.correctAnswerIndex ? 'correct-option' : ''}">
                        ${String.fromCharCode(65 + index)}. ${option}
                        ${index === question.correctAnswerIndex ? ' ✓' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // Old format (backward compatibility)
        answerDisplay = `
            <div class="answer">
                <strong>Answer:</strong><br>
                ${question.answer || 'No answer provided'}
            </div>
        `;
    }
    
    questionDetailContent.innerHTML = `
        <div class="question-detail">
            <h3>Question</h3>
            <p>${question.question}</p>
            
            ${answerDisplay}
            
            ${question.explanation ? `
                <div class="explanation">
                    <strong>Explanation:</strong><br>
                    ${question.explanation}
                </div>
            ` : ''}
            
            <div class="question-meta">
                <span class="category-badge">${getCategoryName(question.category)}</span>
                <span>Added: ${new Date(question.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `;
    
    // Store current question ID for edit/delete
    questionDetailContent.dataset.questionId = questionId;
    
    // Show/hide admin buttons based on admin status
    const editBtn = document.getElementById('editQuestionBtn');
    const deleteBtn = document.getElementById('deleteQuestionBtn');
    
    if (isAdmin) {
        editBtn.style.display = 'inline-flex';
        deleteBtn.style.display = 'inline-flex';
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }
    
    showModal(questionDetailModal);
}

function editQuestion() {
    const questionId = parseInt(questionDetailContent.dataset.questionId);
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Populate form with existing data
    document.getElementById('questionText').value = question.question;
    document.getElementById('questionCategory').value = question.category;
    document.getElementById('questionExplanation').value = question.explanation || '';
    
    // Handle multiple choice options
    if (question.options && question.correctAnswerIndex !== undefined) {
        // Clear existing options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        // Add existing options
        question.options.forEach((option, index) => {
            addOptionField(option, index === question.correctAnswerIndex);
        });
    } else {
        // Handle old format (backward compatibility)
        document.getElementById('questionAnswer').value = question.answer || '';
    }
    
    // Change form to edit mode
    addQuestionForm.dataset.editId = questionId;
    document.querySelector('#addQuestionModal .modal-header h2').textContent = 'Edit Question';
    document.querySelector('#addQuestionModal .form-actions button[type="submit"]').textContent = 'Update Question';
    
    hideModal(questionDetailModal);
    showModal(addQuestionModal);
}

function deleteQuestion() {
    const questionId = parseInt(questionDetailContent.dataset.questionId);
    if (confirm('Are you sure you want to delete this question?')) {
        questions = questions.filter(q => q.id !== questionId);
        localStorage.setItem('gaaQuestions', JSON.stringify(questions));
        loadQuestions();
        updateCategoryCounts();
        hideModal(questionDetailModal);
        showNotification('Question deleted successfully!', 'success');
    }
}

// Quiz Functions
function startQuiz() {
    if (questions.length === 0) {
        showNotification('No questions available. Please add some questions first.', 'error');
        return;
    }
    
    // Shuffle questions and take first 5
    currentQuiz = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
    currentQuestionIndex = 0;
    quizScore = 0;
    
    startQuizBtn.style.display = 'none';
    resetQuizBtn.style.display = 'inline-flex';
    exportResultsBtn.style.display = 'inline-flex';
    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    
    showQuizQuestion();
}

function resetQuiz() {
    currentQuiz = null;
    currentQuestionIndex = 0;
    quizScore = 0;
    
    startQuizBtn.style.display = 'inline-flex';
    resetQuizBtn.style.display = 'none';
    exportResultsBtn.style.display = 'none';
    quizContainer.style.display = 'none';
    quizResults.style.display = 'none';
}

function showQuizQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.length) {
        showQuizResults();
        return;
    }
    
    const question = currentQuiz[currentQuestionIndex];
    
    // Update progress
    quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.length}`;
    progressFill.style.width = `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%`;
    
    // Display question
    quizQuestion.textContent = question.question;
    
    // Handle multiple choice options
    if (question.options && question.correctAnswerIndex !== undefined) {
        // Shuffle options
        const shuffledOptions = [...question.options];
        const correctAnswer = shuffledOptions[question.correctAnswerIndex];
        
        // Fisher-Yates shuffle
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        
        // Find new index of correct answer
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        // Store shuffled options and correct index
        question.shuffledOptions = shuffledOptions;
        question.shuffledCorrectIndex = newCorrectIndex;
        
        // Display options
        quizOptions.innerHTML = shuffledOptions.map((option, index) => `
            <div class="quiz-option" data-index="${index}" onclick="selectAnswer(${index})">
                ${String.fromCharCode(65 + index)}. ${option}
            </div>
        `).join('');
    } else {
        // Single answer format (backward compatibility)
        quizOptions.innerHTML = `
            <div class="quiz-option" onclick="showAnswer()">
                Click to see answer
            </div>
        `;
    }
    
    // Reset button states
    nextQuestionBtn.style.display = 'none';
    showAnswerBtn.style.display = 'inline-flex';
    
    // Remove any previous selection styling
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
    });
}

function selectAnswer(selectedIndex) {
    const question = currentQuiz[currentQuestionIndex];
    
    // Remove previous selections
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Mark selected option
    const selectedOption = document.querySelector(`[data-index="${selectedIndex}"]`);
    selectedOption.classList.add('selected');
    
    // Check if correct
    const isCorrect = selectedIndex === question.shuffledCorrectIndex;
    
    if (isCorrect) {
        selectedOption.classList.add('correct');
        quizScore++;
        triggerHapticFeedback('success');
        showNotification('Correct!', 'success');
    } else {
        selectedOption.classList.add('incorrect');
        // Mark correct answer
        const correctOption = document.querySelector(`[data-index="${question.shuffledCorrectIndex}"]`);
        correctOption.classList.add('correct');
        triggerHapticFeedback('error');
        showNotification('Incorrect. The correct answer is highlighted.', 'error');
    }
    
    // Update tracking
    updateQuizTracking(isCorrect, question.category);
    
    // Show next button
    nextQuestionBtn.style.display = 'inline-flex';
    showAnswerBtn.style.display = 'none';
}

function showAnswer() {
    const question = currentQuiz[currentQuestionIndex];
    
    if (question.options && question.correctAnswerIndex !== undefined) {
        // Multiple choice - show correct answer
        const correctOption = document.querySelector(`[data-index="${question.shuffledCorrectIndex}"]`);
        correctOption.classList.add('correct');
        showNotification('Correct answer highlighted.', 'info');
    } else {
        // Single answer format
        quizOptions.innerHTML = `
            <div class="quiz-option correct">
                <strong>Answer:</strong> ${question.answer || 'No answer provided'}
            </div>
        `;
    }
    
    nextQuestionBtn.style.display = 'inline-flex';
    showAnswerBtn.style.display = 'none';
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= currentQuiz.length) {
        showQuizResults();
    } else {
        showQuizQuestion();
    }
}

function showQuizResults() {
    const percentage = (quizScore / currentQuiz.length) * 100;
    
    quizContainer.style.display = 'none';
    quizResults.style.display = 'block';
    
    quizScoreElement.textContent = `${quizScore}/${currentQuiz.length}`;
    
    // Show performance badge
    const performanceBadge = getPerformanceLevel(percentage);
    quizResults.innerHTML = `
        <h3>Quiz Complete!</h3>
        <div class="score-circle">
            <div class="score-number">${Math.round(percentage)}%</div>
        </div>
        <p>Score: <span id="quizScore">${quizScore}/${currentQuiz.length}</span></p>
        <div class="performance-badge">
            <span class="badge-emoji">${getPerformanceEmoji(percentage)}</span>
            ${performanceBadge}
        </div>
        <button id="retakeQuizBtn" class="btn btn-primary">Take Another Quiz</button>
    `;
    
    // Re-attach event listener
    document.getElementById('retakeQuizBtn').addEventListener('click', retakeQuiz);
}

function retakeQuiz() {
    resetQuiz();
    startQuiz();
}

function getPerformanceEmoji(percentage) {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🎯';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '✅';
    if (percentage >= 40) return '📚';
    return '💪';
}

// Search and Filter Functions
function handleSearch(e) {
    const query = e.target.value.trim();
    loadQuestions(query);
}

function filterByCategory(category) {
    const filteredQuestions = questions.filter(q => q.category === category);
    
    if (filteredQuestions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <h3>No questions in ${getCategoryName(category)}</h3>
                <p>Add some questions to this category to get started!</p>
                ${isAdmin ? '<button class="btn btn-primary" onclick="showModal(addQuestionModal)">Add Question</button>' : ''}
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = filteredQuestions.map(q => {
        let answerPreview = '';
        if (q.options && q.correctAnswerIndex !== undefined) {
            answerPreview = q.options[q.correctAnswerIndex];
        } else {
            answerPreview = q.answer || 'No answer provided';
        }
        
        return `
            <div class="question-card" onclick="showQuestionDetail(${q.id})">
                <h3>${q.question}</h3>
                <p>${answerPreview.substring(0, 100)}${answerPreview.length > 100 ? '...' : ''}</p>
                <div class="question-meta">
                    <span class="category-badge">${getCategoryName(q.category)}</span>
                    <span>${new Date(q.createdAt).toLocaleDateString()}</span>
                    ${q.options ? '<span class="format-badge">Multiple Choice</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updateCategoryCounts() {
    const categoryCounts = {};
    questions.forEach(q => {
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
    });
    
    categoryCards.forEach(card => {
        const category = card.dataset.category;
        const count = categoryCounts[category] || 0;
        const countElement = card.querySelector('.question-count');
        if (countElement) {
            countElement.textContent = `${count} questions`;
        }
    });
}

// PDF Functions
function downloadRulesPDF() {
    const link = document.createElement('a');
    link.href = 'Football Rules.pdf';
    link.download = 'Gaelic_Football_Rules.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('PDF download started!', 'success');
}

function toggleFullscreen() {
    if (pdfContainer.classList.contains('fullscreen')) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

function enterFullscreen() {
    pdfContainer.classList.add('fullscreen');
    fullscreenOverlay.style.display = 'block';
    fullscreenClose.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    fullscreenBtn.textContent = '🔍 Exit Fullscreen';
    fullscreenBtn.classList.remove('btn-primary');
    fullscreenBtn.classList.add('btn-secondary');
}

function exitFullscreen() {
    pdfContainer.classList.remove('fullscreen');
    fullscreenOverlay.style.display = 'none';
    fullscreenClose.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    fullscreenBtn.textContent = '🔍 Fullscreen';
    fullscreenBtn.classList.remove('btn-secondary');
    fullscreenBtn.classList.add('btn-primary');
}

// Question Form Functions
function handleAddQuestion(e) {
    e.preventDefault();
    
    const editId = addQuestionForm.dataset.editId;
    
    // Get form values
    const questionText = document.getElementById('questionText').value.trim();
    const category = document.getElementById('questionCategory').value;
    const explanation = document.getElementById('questionExplanation').value.trim();
    
    // Get multiple choice options
    const options = [];
    const optionInputs = document.querySelectorAll('.option-input');
    let correctAnswerIndex = -1;
    
    optionInputs.forEach((input, index) => {
        const optionText = input.value.trim();
        const isCorrect = document.querySelector(`input[name="correctAnswer"][data-index="${index}"]`).checked;
        
        if (optionText) {
            options.push(optionText);
            if (isCorrect) {
                correctAnswerIndex = index;
            }
        }
    });
    
    // Validation
    if (options.length < 2) {
        showNotification('Please add at least 2 answer options', 'error');
        return;
    }
    
    if (correctAnswerIndex === -1) {
        showNotification('Please select the correct answer', 'error');
        return;
    }
    
    if (editId) {
        // Editing existing question
        const questionIndex = questions.findIndex(q => q.id === parseInt(editId));
        if (questionIndex !== -1) {
            questions[questionIndex] = {
                ...questions[questionIndex],
                question: questionText,
                category: category,
                options: options,
                correctAnswerIndex: correctAnswerIndex,
                explanation: explanation,
                updatedAt: new Date().toISOString()
            };
        }
        
        // Reset form to add mode
        delete addQuestionForm.dataset.editId;
        document.querySelector('#addQuestionModal .modal-header h2').textContent = 'Add Question';
        document.querySelector('#addQuestionModal .form-actions button[type="submit"]').textContent = 'Add Question';
        
        showNotification('Question updated successfully!', 'success');
    } else {
        // Adding new question
        const questionData = {
            id: Date.now(),
            question: questionText,
            category: category,
            options: options,
            correctAnswerIndex: correctAnswerIndex,
            explanation: explanation,
            createdAt: new Date().toISOString()
        };
        
        questions.push(questionData);
        showNotification('Question added successfully!', 'success');
    }
    
    localStorage.setItem('gaaQuestions', JSON.stringify(questions));
    loadQuestions();
    updateCategoryCounts();
    hideModal(addQuestionModal);
    
    // Reset form
    addQuestionForm.reset();
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    initializeQuestionForm();
}

function initializeQuestionForm() {
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    // Add initial option fields
    addOptionField();
    addOptionField();
}

function addOptionField(value = '', isCorrect = false) {
    const optionsContainer = document.getElementById('optionsContainer');
    const optionIndex = optionsContainer.children.length;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-field';
    optionDiv.innerHTML = `
        <div class="option-input-group">
            <input type="text" class="option-input" placeholder="Enter option ${optionIndex + 1}..." value="${value}" required>
            <input type="radio" name="correctAnswer" data-index="${optionIndex}" ${isCorrect ? 'checked' : ''}>
            <label class="correct-label">Correct</label>
            <button type="button" class="remove-option-btn" onclick="removeOptionField(this)">×</button>
        </div>
    `;
    
    optionsContainer.appendChild(optionDiv);
    
    // Add voice input to the new option
    const newInput = optionDiv.querySelector('.option-input');
    addVoiceInputButton(newInput, `option ${optionIndex + 1}`);
    
    // Update option indices
    updateOptionIndices();
}

function removeOptionField(button) {
    const optionField = button.closest('.option-field');
    const optionsContainer = document.getElementById('optionsContainer');
    
    // Don't remove if only 2 options remain
    if (optionsContainer.children.length <= 2) {
        showNotification('You must have at least 2 options', 'error');
        return;
    }
    
    optionField.remove();
    updateOptionIndices();
}

function updateOptionIndices() {
    const optionFields = document.querySelectorAll('.option-field');
    optionFields.forEach((field, index) => {
        const input = field.querySelector('.option-input');
        const radio = field.querySelector('input[type="radio"]');
        const label = field.querySelector('.correct-label');
        
        input.placeholder = `Enter option ${index + 1}...`;
        radio.dataset.index = index;
        label.textContent = 'Correct';
    });
}

// Voice input functionality for questions and answers
function initializeVoiceInput() {
    // Add voice input buttons to form fields
    const questionText = document.getElementById('questionText');
    const questionExplanation = document.getElementById('questionExplanation');
    
    if (questionText) {
        addVoiceInputButton(questionText, 'question');
    }
    if (questionExplanation) {
        addVoiceInputButton(questionExplanation, 'explanation');
    }
}

function addVoiceInputButton(inputField, type) {
    const voiceBtn = document.createElement('button');
    voiceBtn.type = 'button';
    voiceBtn.className = 'voice-input-btn';
    voiceBtn.innerHTML = '🎤';
    voiceBtn.title = `Voice input for ${type}`;
    voiceBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        z-index: 10;
    `;
    
    voiceBtn.addEventListener('click', () => startVoiceInput(inputField, type));
    
    // Make input field container relative
    const container = inputField.parentElement;
    container.style.position = 'relative';
    container.appendChild(voiceBtn);
}

function startVoiceInput(inputField, type) {
    if (!voiceRecognition) {
        showNotification('Voice recognition not available in this browser', 'error');
        return;
    }
    
    voiceInputActive = true;
    voiceInputTarget = inputField;
    
    // Visual feedback
    const voiceBtn = inputField.parentElement.querySelector('.voice-input-btn');
    voiceBtn.style.background = '#22c55e';
    voiceBtn.style.animation = 'pulse 1s infinite';
    
    // Add temporary placeholder
    const originalPlaceholder = inputField.placeholder;
    inputField.placeholder = 'Listening... Speak now';
    
    // Start recognition
    voiceRecognition.start();
    
    // Set up one-time result handler
    const originalOnResult = voiceRecognition.onresult;
    voiceRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Update input field
        if (type === 'question') {
            inputField.value = transcript;
        } else if (type === 'explanation') {
            inputField.value = transcript;
        }
        
        // Reset
        voiceInputActive = false;
        voiceInputTarget = null;
        voiceBtn.style.background = '#dc2626';
        voiceBtn.style.animation = 'none';
        inputField.placeholder = originalPlaceholder;
        
        // Restore original handler
        voiceRecognition.onresult = originalOnResult;
        
        showNotification(`Voice input captured for ${type}`, 'success');
    };
    
    // Set up one-time end handler
    const originalOnEnd = voiceRecognition.onend;
    voiceRecognition.onend = () => {
        if (voiceInputActive) {
            voiceInputActive = false;
            voiceInputTarget = null;
            voiceBtn.style.background = '#dc2626';
            voiceBtn.style.animation = 'none';
            inputField.placeholder = originalPlaceholder;
            showNotification('Voice input stopped', 'info');
        }
        
        // Restore original handler
        voiceRecognition.onend = originalOnEnd;
    };
}

function addVoiceInputToOptions() {
    // Add voice input to option fields
    const optionInputs = document.querySelectorAll('.option-input');
    optionInputs.forEach((input, index) => {
        if (!input.parentElement.querySelector('.voice-input-btn')) {
            addVoiceInputButton(input, `option ${index + 1}`);
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Landing page buttons
    document.querySelector('.admin-btn').addEventListener('click', () => {
        const password = prompt('Enter admin password:');
        if (password === 'cZ8lp41FF1QmzCF') {
            localStorage.setItem('gaaAdminPassword', password);
            isAdmin = true;
            showMainApp();
            showNotification('Admin access granted!', 'success');
        } else if (password !== null) {
            showNotification('Incorrect password!', 'error');
        }
    });
    
    document.querySelector('.user-btn').addEventListener('click', () => {
        isAdmin = false;
        showMainApp();
        showUserMode(); // Ensure user mode is properly set
    });
    
    // Back to Landing button
    const backToLandingBtn = document.getElementById('backToLandingBtn');
    if (backToLandingBtn) {
        backToLandingBtn.addEventListener('click', () => {
            showLandingPage();
        });
    }
    
    // Modal controls
    if (closeModal) closeModal.addEventListener('click', () => hideModal(addQuestionModal));
    if (cancelAdd) cancelAdd.addEventListener('click', () => hideModal(addQuestionModal));
    
    // Add Question button
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => {
        showModal(addQuestionModal);
        initializeQuestionForm();
        // Initialize voice input after a short delay to ensure DOM is ready
        setTimeout(() => {
            initializeVoiceInput();
        }, 100);
    });
    
    // Add Option button
    const addOptionBtn = document.getElementById('addOptionBtn');
    if (addOptionBtn) addOptionBtn.addEventListener('click', () => addOptionField());
    
    // Form submissions
    if (addQuestionForm) addQuestionForm.addEventListener('submit', handleAddQuestion);
    
    // Search functionality
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
            
            // Initialize Quick Reference when tab is switched to
            if (tabName === 'quickref') {
                setTimeout(() => {
                    initializeQuickRef();
                }, 100);
            }
        });
    });
    
    // Quick Reference Navigation
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    
    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', prevQuickRefCard);
    }
    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', nextQuickRefCard);
    }
    
    // Category cards
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            filterByCategory(category);
        });
    });
    
    // Quiz controls
    if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
    if (resetQuizBtn) resetQuizBtn.addEventListener('click', resetQuiz);
    if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', nextQuestion);
    if (showAnswerBtn) showAnswerBtn.addEventListener('click', showAnswer);
    if (retakeQuizBtn) retakeQuizBtn.addEventListener('click', retakeQuiz);
    
    // Question detail modal
    if (closeDetailModal) closeDetailModal.addEventListener('click', () => hideModal(questionDetailModal));
    if (editQuestionBtn) editQuestionBtn.addEventListener('click', editQuestion);
    if (deleteQuestionBtn) deleteQuestionBtn.addEventListener('click', deleteQuestion);
    
    // PDF viewer controls
    if (downloadRulesBtn) downloadRulesBtn.addEventListener('click', downloadRulesPDF);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (fullscreenClose) fullscreenClose.addEventListener('click', exitFullscreen);
    
    // Study Timer Modal
    if (studyTimerBtn) {
        studyTimerBtn.addEventListener('click', () => showModal(studyTimerModal));
    }
    if (closeTimerModal) {
        closeTimerModal.addEventListener('click', () => hideModal(studyTimerModal));
    }
    if (startTimerBtn) {
        startTimerBtn.addEventListener('click', startStudyTimer);
    }
    if (pauseTimerBtn) {
        pauseTimerBtn.addEventListener('click', pauseStudyTimer);
    }
    if (resetTimerBtn) {
        resetTimerBtn.addEventListener('click', resetStudyTimer);
    }
    if (studyDuration) {
        studyDuration.addEventListener('change', () => {
            if (studyTimer) {
                studyTimer.duration = parseInt(studyDuration.value) * 60;
                studyTimer.timeLeft = studyTimer.duration;
                updateTimerDisplay();
            }
        });
    }
    if (breakDuration) {
        breakDuration.addEventListener('change', () => {
            if (studyTimer && studyTimer.isBreak) {
                studyTimer.duration = parseInt(breakDuration.value) * 60;
                studyTimer.timeLeft = studyTimer.duration;
                updateTimerDisplay();
            }
        });
    }
    if (autoStartBreaks) {
        autoStartBreaks.addEventListener('change', () => {
            if (studyTimer && studyTimer.isBreak) {
                if (autoStartBreaks.checked) {
                    startStudySession();
                } else {
                    timerStatus.textContent = 'Break finished';
                    startTimerBtn.style.display = 'inline-flex';
                    pauseTimerBtn.style.display = 'none';
                }
            }
        });
    }

    // Voice Modal
    if (voiceCommandBtn) {
        voiceCommandBtn.addEventListener('click', () => showModal(voiceModal));
    }
    if (closeVoiceModal) {
        closeVoiceModal.addEventListener('click', () => hideModal(voiceModal));
    }
    if (startVoiceBtn) {
        startVoiceBtn.addEventListener('click', () => {
            if (voiceRecognition) {
                voiceRecognition.start();
                stopVoiceBtn.style.display = 'inline-flex';
                startVoiceBtn.style.display = 'none';
            }
        });
    }
    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener('click', () => {
            if (voiceRecognition) {
                voiceRecognition.stop();
            }
        });
    }

    // Rule of Day Modal
    if (ruleOfDayBadge) {
        ruleOfDayBadge.addEventListener('click', () => showModal(ruleOfDayModal));
    }
    if (closeRuleModal) {
        closeRuleModal.addEventListener('click', () => hideModal(ruleOfDayModal));
    }
    if (addToFavoritesBtn) {
        addToFavoritesBtn.addEventListener('click', () => {
            const rule = JSON.parse(localStorage.getItem('gaaRuleOfDay'));
            if (rule) {
                const favorites = JSON.parse(localStorage.getItem('gaaFavorites')) || [];
                if (!favorites.some(f => f.title === rule.title)) {
                    favorites.push(rule);
                    localStorage.setItem('gaaFavorites', JSON.stringify(favorites));
                    addToFavoritesBtn.textContent = 'Added to Favorites';
                    addToFavoritesBtn.disabled = true;
                    showNotification('Rule added to favorites!', 'success');
                } else {
                    showNotification('Rule already in favorites.', 'info');
                }
            }
        });
    }
    if (practiceRuleBtn) {
        practiceRuleBtn.addEventListener('click', () => {
            const rule = JSON.parse(localStorage.getItem('gaaRuleOfDay'));
            if (rule) {
                // Create a practice question based on the rule
                const practiceQuestion = {
                    id: Date.now(),
                    question: `What is the rule for ${rule.title.toLowerCase()}?`,
                    options: [
                        rule.text,
                        'This rule does not exist',
                        'The opposite of what is stated',
                        'No penalty applies'
                    ],
                    correctAnswerIndex: 0,
                    category: 'practice',
                    explanation: rule.example
                };
                
                // Add to questions temporarily for practice
                questions.unshift(practiceQuestion);
                showQuestionDetail(practiceQuestion.id);
                showNotification(`Practicing rule: ${rule.title}`, 'success');
            }
        });
    }

    // Exam Modal
    if (addExamBtn) {
        addExamBtn.addEventListener('click', () => showModal(addExamModal));
    }
    if (closeExamModal) {
        closeExamModal.addEventListener('click', () => hideModal(addExamModal));
    }
    if (addExamQuestionBtn) {
        addExamQuestionBtn.addEventListener('click', addExamQuestion);
    }
    if (addExamForm) {
        addExamForm.addEventListener('submit', handleAddExam);
    }
    if (cancelExam) {
        cancelExam.addEventListener('click', () => hideModal(addExamModal));
    }

    // Dark Mode Toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Voice Search Button
    if (voiceSearchBtn) {
        voiceSearchBtn.addEventListener('click', () => {
            if (isListening) {
                voiceRecognition.stop();
            } else {
                voiceRecognition.start();
                stopVoiceBtn.style.display = 'inline-flex';
                startVoiceBtn.style.display = 'none';
            }
        });
    }

    // Export Results Button
    if (exportResultsBtn) {
        exportResultsBtn.addEventListener('click', exportQuizResults);
    }

    // Smart Search Setup
    setupSmartSearch();

    // Escape key for modals and fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals
            const openModals = document.querySelectorAll('.modal.active');
            openModals.forEach(modal => hideModal(modal));
            
            // Exit fullscreen
            if (pdfContainer.classList.contains('fullscreen')) {
                exitFullscreen();
            }
            
            // Stop voice recognition
            if (isListening && voiceRecognition) {
                voiceRecognition.stop();
            }
        }
    });

    // Click outside modals to close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });
}

// Add exam question field
function addExamQuestion() {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'exam-question-field';
    questionDiv.innerHTML = `
        <div class="form-group">
            <label>Question:</label>
            <textarea class="exam-question-text" placeholder="Enter exam question..." required></textarea>
        </div>
        <div class="form-group">
            <label>Category:</label>
            <select class="exam-question-category" required>
                <option value="">Select category</option>
                <option value="technical">Technical Fouls</option>
                <option value="aggressive">Aggressive Fouls</option>
                <option value="dissent">Dissent</option>
                <option value="setplay">Set Play</option>
                <option value="general">General Rules</option>
                <option value="scenarios">Game Scenarios</option>
            </select>
        </div>
        <div class="form-group">
            <label>Options:</label>
            <div class="exam-options-container">
                <div class="exam-option-field">
                    <input type="text" class="exam-option-input" placeholder="Option A..." required>
                    <input type="radio" name="exam-correct" value="0" required>
                    <label>Correct</label>
                </div>
                <div class="exam-option-field">
                    <input type="text" class="exam-option-input" placeholder="Option B..." required>
                    <input type="radio" name="exam-correct" value="1">
                    <label>Correct</label>
                </div>
                <div class="exam-option-field">
                    <input type="text" class="exam-option-input" placeholder="Option C..." required>
                    <input type="radio" name="exam-correct" value="2">
                    <label>Correct</label>
                </div>
                <div class="exam-option-field">
                    <input type="text" class="exam-option-input" placeholder="Option D..." required>
                    <input type="radio" name="exam-correct" value="3">
                    <label>Correct</label>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label>Explanation (optional):</label>
            <textarea class="exam-question-explanation" placeholder="Explain why this is the correct answer..."></textarea>
        </div>
        <button type="button" class="remove-exam-question-btn" onclick="this.parentElement.remove()">Remove Question</button>
    `;
    
    examQuestionsContainer.appendChild(questionDiv);
}

// Handle add exam form submission
function handleAddExam(e) {
    e.preventDefault();
    
    const examTitle = document.getElementById('examTitle').value.trim();
    const examYear = parseInt(document.getElementById('examYear').value);
    const examLevel = document.getElementById('examLevel').value;
    const examDescription = document.getElementById('examDescription').value.trim();
    
    // Collect questions from the form
    const examQuestions = [];
    const questionFields = document.querySelectorAll('.exam-question-field');
    
    questionFields.forEach(field => {
        const questionText = field.querySelector('.exam-question-text').value.trim();
        const category = field.querySelector('.exam-question-category').value;
        const explanation = field.querySelector('.exam-question-explanation').value.trim();
        
        // Collect options
        const options = [];
        const optionInputs = field.querySelectorAll('.exam-option-input');
        let correctAnswerIndex = -1;
        
        optionInputs.forEach((input, index) => {
            const optionText = input.value.trim();
            const radio = field.querySelector(`input[name="exam-correct"][value="${index}"]`);
            if (optionText) {
                options.push(optionText);
                if (radio && radio.checked) {
                    correctAnswerIndex = index;
                }
            }
        });
        
        if (questionText && options.length >= 2 && correctAnswerIndex !== -1) {
            examQuestions.push({
                id: Date.now() + Math.random(),
                question: questionText,
                category: category,
                options: options,
                correctAnswerIndex: correctAnswerIndex,
                explanation: explanation
            });
        }
    });
    
    if (examQuestions.length === 0) {
        showNotification('Please add at least one question to the exam', 'error');
        return;
    }
    
    // Create exam object
    const exam = {
        id: Date.now(),
        title: examTitle,
        year: examYear,
        level: examLevel,
        description: examDescription,
        questions: examQuestions,
        createdAt: new Date().toISOString()
    };
    
    exams.push(exam);
    saveExams();
    loadExams();
    
    // Reset form
    addExamForm.reset();
    examQuestionsContainer.innerHTML = '';
    
    hideModal(addExamModal);
    showNotification('Exam added successfully!', 'success');
}