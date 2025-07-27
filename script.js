// App State
let questions = JSON.parse(localStorage.getItem('gaaQuestions')) || [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let quizScore = 0;
let isAdmin = false; // Track if user is admin (you)
let currentMode = 'landing'; // Track current mode: 'landing', 'user', 'admin'

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

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showLandingPage();
});

// Navigation functions
function showLandingPage() {
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    currentMode = 'landing';
}

function showMainApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    loadQuestions();
    updateCategoryCounts();
}

function showAdminMode() {
    const password = prompt('Enter admin password:');
    if (password === 'cZ8lp41FF1QmzCF') {
        localStorage.setItem('gaaAdminPassword', password);
        isAdmin = true;
        currentMode = 'admin';
        showMainApp();
        showAdminControls();
        showNotification('Admin access granted!', 'success');
    } else if (password !== null) {
        showNotification('Incorrect password!', 'error');
    }
}

function showUserMode() {
    isAdmin = false;
    currentMode = 'user';
    showMainApp();
    hideAdminControls();
}

// Check if user is admin (you)
function checkAdminStatus() {
    // Simple admin check - you can modify this password
    const adminPassword = 'cZ8lp41FF1QmzCF'; // Updated password
    const storedPassword = localStorage.getItem('gaaAdminPassword');
    
    if (storedPassword === adminPassword) {
        isAdmin = true;
        showAdminControls();
    } else {
        hideAdminControls();
    }
}

function showAdminControls() {
    // Show admin-only elements
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    if (addQuestionBtn) addQuestionBtn.style.display = 'inline-flex';
    
    // Add admin indicator
    const header = document.querySelector('.header');
    if (header && !document.getElementById('adminIndicator')) {
        const adminIndicator = document.createElement('div');
        adminIndicator.id = 'adminIndicator';
        adminIndicator.innerHTML = '👑 Admin Mode';
        adminIndicator.style.cssText = `
            background: #10b981;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-left: 0.5rem;
        `;
        header.appendChild(adminIndicator);
    }
}

function hideAdminControls() {
    // Hide admin-only elements
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    if (addQuestionBtn) addQuestionBtn.style.display = 'none';
    
    // Show admin login button
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) adminLoginBtn.style.display = 'inline-flex';
    
    // Remove admin indicator
    const adminIndicator = document.getElementById('adminIndicator');
    if (adminIndicator) adminIndicator.remove();
}

// Event Listeners
function setupEventListeners() {
    // Modal controls
    addQuestionBtn.addEventListener('click', () => showModal(addQuestionModal));
    closeModal.addEventListener('click', () => hideModal(addQuestionModal));
    cancelAdd.addEventListener('click', () => hideModal(addQuestionModal));
    closeDetailModal.addEventListener('click', () => hideModal(questionDetailModal));
    
    // Landing page buttons
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    const userAccessBtn = document.getElementById('userAccessBtn');
    const backToLandingBtn = document.getElementById('backToLandingBtn');
    
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', showAdminMode);
    }
    
    if (userAccessBtn) {
        userAccessBtn.addEventListener('click', showUserMode);
    }
    
    if (backToLandingBtn) {
        backToLandingBtn.addEventListener('click', showLandingPage);
    }
    
    // Admin login (for existing admin users)
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', showAdminLogin);
    }
    
    // Form submission
    addQuestionForm.addEventListener('submit', handleAddQuestion);
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Category cards
    categoryCards.forEach(card => {
        card.addEventListener('click', () => filterByCategory(card.dataset.category));
    });
    
    // Quiz controls
    startQuizBtn.addEventListener('click', startQuiz);
    resetQuizBtn.addEventListener('click', resetQuiz);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    showAnswerBtn.addEventListener('click', showAnswer);
    retakeQuizBtn.addEventListener('click', startQuiz);
    
    // Question detail modal
    editQuestionBtn.addEventListener('click', editQuestion);
    deleteQuestionBtn.addEventListener('click', deleteQuestion);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });
}

// Modal Functions
function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    if (modal === addQuestionModal) {
        addQuestionForm.reset();
    }
}

// Tab Navigation
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'Mode');
    });
    
    // Load appropriate content
    if (tabName === 'study') {
        loadQuestions();
    } else if (tabName === 'categories') {
        updateCategoryCounts();
    }
}

// Question Management
function handleAddQuestion(e) {
    e.preventDefault();
    
    const editId = addQuestionForm.dataset.editId;
    
    if (editId) {
        // Editing existing question
        const questionIndex = questions.findIndex(q => q.id === parseInt(editId));
        if (questionIndex !== -1) {
            questions[questionIndex] = {
                ...questions[questionIndex],
                question: document.getElementById('questionText').value.trim(),
                category: document.getElementById('questionCategory').value,
                answer: document.getElementById('questionAnswer').value.trim(),
                explanation: document.getElementById('questionExplanation').value.trim(),
                updatedAt: new Date().toISOString()
            };
        }
        
        // Reset form to add mode
        delete addQuestionForm.dataset.editId;
        document.querySelector('#addQuestionModal .modal-header h2').textContent = 'Add New Question';
        document.querySelector('#addQuestionModal .form-actions button[type="submit"]').textContent = 'Add Question';
        
        showNotification('Question updated successfully!', 'success');
    } else {
        // Adding new question
        const questionData = {
            id: Date.now(),
            question: document.getElementById('questionText').value.trim(),
            category: document.getElementById('questionCategory').value,
            answer: document.getElementById('questionAnswer').value.trim(),
            explanation: document.getElementById('questionExplanation').value.trim(),
            createdAt: new Date().toISOString()
        };
        
        questions.push(questionData);
        showNotification('Question added successfully!', 'success');
    }
    
    saveQuestions();
    loadQuestions();
    updateCategoryCounts();
    hideModal(addQuestionModal);
}

function loadQuestions(filter = '') {
    const filteredQuestions = filter 
        ? questions.filter(q => 
            q.question.toLowerCase().includes(filter.toLowerCase()) ||
            q.answer.toLowerCase().includes(filter.toLowerCase()) ||
            q.category.toLowerCase().includes(filter.toLowerCase())
        )
        : questions;
    
    if (filteredQuestions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <h3>No questions found</h3>
                <p>${filter ? 'Try adjusting your search terms.' : 'Add your first question to get started!'}</p>
                ${!filter ? '<button class="btn btn-primary" onclick="showModal(addQuestionModal)">Add Question</button>' : ''}
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = filteredQuestions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(q => `
            <div class="question-card" onclick="showQuestionDetail(${q.id})">
                <h3>${q.question}</h3>
                <p>${q.answer.substring(0, 100)}${q.answer.length > 100 ? '...' : ''}</p>
                <div class="question-meta">
                    <span class="category-badge">${getCategoryName(q.category)}</span>
                    <span>${new Date(q.createdAt).toLocaleDateString()}</span>
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
        `).join('');
}

function showQuestionDetail(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    questionDetailContent.innerHTML = `
        <div class="question-detail">
            <h3>Question</h3>
            <p>${question.question}</p>
            
            <div class="answer">
                <strong>Answer:</strong><br>
                ${question.answer}
            </div>
            
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
    document.getElementById('questionAnswer').value = question.answer;
    document.getElementById('questionExplanation').value = question.explanation;
    
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
        saveQuestions();
        loadQuestions();
        updateCategoryCounts();
        hideModal(questionDetailModal);
        showNotification('Question deleted successfully!', 'success');
    }
}

// Search and Filter
function handleSearch(e) {
    loadQuestions(e.target.value);
}

function filterByCategory(category) {
    const filteredQuestions = questions.filter(q => q.category === category);
    loadQuestions();
    
    if (filteredQuestions.length > 0) {
        questionsList.innerHTML = filteredQuestions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(q => `
                <div class="question-card" onclick="showQuestionDetail(${q.id})">
                    <h3>${q.question}</h3>
                    <p>${q.answer.substring(0, 100)}${q.answer.length > 100 ? '...' : ''}</p>
                    <div class="question-meta">
                        <span class="category-badge">${getCategoryName(q.category)}</span>
                        <span>${new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
    }
    
    switchTab('study');
}

// Quiz Functions
function startQuiz() {
    if (questions.length === 0) {
        showNotification('Add some questions first!', 'error');
        return;
    }
    
    // Shuffle questions and take first 5
    currentQuiz = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
    currentQuestionIndex = 0;
    quizScore = 0;
    
    startQuizBtn.style.display = 'none';
    resetQuizBtn.style.display = 'inline-flex';
    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    
    showQuizQuestion();
}

function showQuizQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    if (!question) return;
    
    quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.length}`;
    progressFill.style.width = `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%`;
    
    quizQuestion.textContent = question.question;
    
    // Create options (correct answer + 3 random wrong answers)
    const wrongAnswers = questions
        .filter(q => q.id !== question.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(q => q.answer);
    
    const options = [question.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    quizOptions.innerHTML = options.map((option, index) => `
        <div class="quiz-option" data-answer="${option}" onclick="selectAnswer(this)">
            ${option}
        </div>
    `).join('');
    
    showAnswerBtn.style.display = 'inline-flex';
    nextQuestionBtn.style.display = 'none';
}

function selectAnswer(optionElement) {
    // Remove previous selections
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Mark selected option
    optionElement.classList.add('selected');
    
    const selectedAnswer = optionElement.dataset.answer;
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    if (isCorrect) {
        optionElement.classList.add('correct');
        quizScore++;
    } else {
        optionElement.classList.add('incorrect');
        // Show correct answer
        document.querySelectorAll('.quiz-option').forEach(opt => {
            if (opt.dataset.answer === currentQuestion.answer) {
                opt.classList.add('correct');
            }
        });
    }
    
    showAnswerBtn.style.display = 'none';
    nextQuestionBtn.style.display = 'inline-flex';
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= currentQuiz.length) {
        showQuizResults();
    } else {
        showQuizQuestion();
    }
}

function showAnswer() {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const correctAnswer = currentQuestion.answer;
    
    document.querySelectorAll('.quiz-option').forEach(opt => {
        if (opt.dataset.answer === correctAnswer) {
            opt.classList.add('correct');
        }
    });
    
    showAnswerBtn.style.display = 'none';
    nextQuestionBtn.style.display = 'inline-flex';
}

function showQuizResults() {
    quizContainer.style.display = 'none';
    quizResults.style.display = 'block';
    quizScoreElement.textContent = `${quizScore}/${currentQuiz.length}`;
    
    const percentage = (quizScore / currentQuiz.length) * 100;
    let message = '';
    
    if (percentage >= 80) {
        message = 'Excellent! You\'re ready for the game!';
    } else if (percentage >= 60) {
        message = 'Good job! A bit more practice needed.';
    } else {
        message = 'Keep studying! Review the rules before your game.';
    }
    
    quizResults.innerHTML = `
        <h3>Quiz Complete!</h3>
        <p>Score: <span id="quizScore">${quizScore}/${currentQuiz.length}</span></p>
        <p style="margin-bottom: 1.5rem; font-style: italic;">${message}</p>
        <button id="retakeQuizBtn" class="btn btn-primary">Take Another Quiz</button>
    `;
    
    // Re-attach event listener
    document.getElementById('retakeQuizBtn').addEventListener('click', startQuiz);
}

function resetQuiz() {
    startQuizBtn.style.display = 'inline-flex';
    resetQuizBtn.style.display = 'none';
    quizContainer.style.display = 'none';
    quizResults.style.display = 'none';
    currentQuiz = null;
}

// Utility Functions
function saveQuestions() {
    localStorage.setItem('gaaQuestions', JSON.stringify(questions));
}

function updateCategoryCounts() {
    const counts = {
        technical: 0,
        aggressive: 0,
        dissent: 0,
        setplay: 0,
        general: 0,
        scenarios: 0
    };
    
    questions.forEach(q => {
        if (counts.hasOwnProperty(q.category)) {
            counts[q.category]++;
        }
    });
    
    categoryCards.forEach(card => {
        const category = card.dataset.category;
        const count = counts[category] || 0;
        card.querySelector('.question-count').textContent = `${count} question${count !== 1 ? 's' : ''}`;
    });
}

function getCategoryName(category) {
    const names = {
        technical: 'Technical Fouls',
        aggressive: 'Aggressive Fouls',
        dissent: 'Dissent',
        setplay: 'Set Play',
        general: 'General Rules',
        scenarios: 'Game Scenarios'
    };
    return names[category] || category;
}

function showAdminLogin() {
    const password = prompt('Enter admin password:');
    if (password === 'cZ8lp41FF1QmzCF') { // Updated password
        localStorage.setItem('gaaAdminPassword', password);
        isAdmin = true;
        showAdminControls();
        showNotification('Admin access granted!', 'success');
    } else if (password !== null) {
        showNotification('Incorrect password!', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some sample questions if none exist
if (questions.length === 0) {
    const sampleQuestions = [
        {
            id: 1,
            question: "What is the penalty for overcarrying the ball?",
            category: "technical",
            answer: "Free kick to the opposing team from where the foul occurred.",
            explanation: "Rule 4.1 - A player may carry the ball for a maximum of four consecutive steps or hold it for no longer than the time needed to take four steps.",
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            question: "When can a goalkeeper be charged?",
            category: "general",
            answer: "The goalkeeper may not be charged when within the small rectangle, but may be challenged for possession of the ball.",
            explanation: "Rule 1.7 - The goalkeeper has special protection within the small rectangle but can still be challenged for the ball.",
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            question: "What is the penalty for a cynical foul?",
            category: "aggressive",
            answer: "Black card - player is ordered off for the remainder of the game and may be replaced by a substitute.",
            explanation: "Rule 5.10-5.16 - Cynical behavior includes deliberately pulling down an opponent, tripping, or preventing movement.",
            createdAt: new Date().toISOString()
        }
    ];
    
    questions = sampleQuestions;
    saveQuestions();
} 