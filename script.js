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
    
    // Question generation mode toggle
    document.querySelectorAll('input[name="questionMode"]').forEach(radio => {
        radio.addEventListener('change', toggleQuestionMode);
    });
    
    // Answer text input for question generation
    const answerText = document.getElementById('answerText');
    if (answerText) {
        answerText.addEventListener('input', generateQuestionFromAnswer);
    }
    
    // Regenerate question button
    const regenerateBtn = document.getElementById('regenerateQuestionBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', generateQuestionFromAnswer);
    }
    
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

// Question Generation Functions
function toggleQuestionMode() {
    const manualSection = document.getElementById('manualQuestionSection');
    const generateSection = document.getElementById('generateQuestionSection');
    const questionText = document.getElementById('questionText');
    const answerText = document.getElementById('answerText');
    
    const isGenerateMode = document.querySelector('input[name="questionMode"]:checked').value === 'generate';
    
    if (isGenerateMode) {
        manualSection.style.display = 'none';
        generateSection.style.display = 'block';
        questionText.removeAttribute('required');
        answerText.setAttribute('required', 'required');
    } else {
        manualSection.style.display = 'block';
        generateSection.style.display = 'none';
        questionText.setAttribute('required', 'required');
        answerText.removeAttribute('required');
    }
}

function generateQuestionFromAnswer() {
    const answerText = document.getElementById('answerText');
    const generatedQuestion = document.getElementById('generatedQuestion');
    const questionText = document.getElementById('questionText');
    
    if (!answerText || !generatedQuestion) return;
    
    const answer = answerText.value.trim();
    if (!answer) {
        generatedQuestion.value = '';
        return;
    }
    
    const question = generateQuestionFromAnswerText(answer);
    generatedQuestion.value = question;
    questionText.value = question; // Also populate the manual question field
}

function generateQuestionFromAnswerText(answer) {
    const answerLower = answer.toLowerCase();
    
    // Extract key elements from the answer for better question generation
    const keyElements = extractKeyElements(answer);
    
    // Generate specific questions based on the content
    if (keyElements.type === 'throw-in') {
        return generateThrowInQuestion(keyElements);
    } else if (keyElements.type === 'positioning') {
        return generatePositioningQuestion(keyElements);
    } else if (keyElements.type === 'procedure') {
        return generateProcedureQuestion(keyElements);
    } else if (keyElements.type === 'penalty') {
        return generatePenaltyQuestion(keyElements);
    } else if (keyElements.type === 'free-kick') {
        return generateFreeKickQuestion(keyElements);
    } else if (keyElements.type === 'ball-handling') {
        return generateBallHandlingQuestion(keyElements);
    } else if (keyElements.type === 'scoring') {
        return generateScoringQuestion(keyElements);
    } else if (keyElements.type === 'goalkeeper') {
        return generateGoalkeeperQuestion(keyElements);
    } else if (keyElements.type === 'rule') {
        return generateRuleQuestion(keyElements);
    } else {
        return generateGenericQuestion(keyElements);
    }
}

function extractKeyElements(answer) {
    const answerLower = answer.toLowerCase();
    
    // Check for specific rule types based on actual GAA rules
    
    // Throw-in rules (Rule 2.1, 2.9, 2.10, 2.11)
    if (answerLower.includes('throw') && (answerLower.includes('ball') || answerLower.includes('in'))) {
        return {
            type: 'throw-in',
            referee: answerLower.includes('referee'),
            players: answerLower.includes('players'),
            positioning: answerLower.includes('position') || answerLower.includes('45m') || answerLower.includes('halfway') || answerLower.includes('13m'),
            timing: answerLower.includes('half-time') || answerLower.includes('2nd half'),
            sideline: answerLower.includes('sideline'),
            elements: extractPositioningElements(answer)
        };
    }
    
    // Free kick rules (Rule 2.2, 2.5, 2.6, 2.8, 2.9)
    if (answerLower.includes('free kick') || answerLower.includes('45m') || answerLower.includes('solo and go')) {
        return {
            type: 'free-kick',
            distance: extractDistance(answer),
            method: answerLower.includes('hands') ? 'hands' : 
                   answerLower.includes('ground') ? 'ground' : 
                   answerLower.includes('solo') ? 'solo' : null,
            positioning: answerLower.includes('13m') || answerLower.includes('20m'),
            elements: extractFreeKickElements(answer)
        };
    }
    
    // Ball handling rules (Rule 1.2, 1.3, 1.4, 1.5)
    if (answerLower.includes('ball') && (answerLower.includes('hand') || answerLower.includes('foot') || answerLower.includes('carry') || answerLower.includes('bounce'))) {
        return {
            type: 'ball-handling',
            method: answerLower.includes('hand') ? 'hand' : 
                   answerLower.includes('foot') ? 'foot' : 
                   answerLower.includes('carry') ? 'carry' : 
                   answerLower.includes('bounce') ? 'bounce' : null,
            steps: answerLower.includes('four steps') || answerLower.includes('4 steps'),
            elements: extractBallHandlingElements(answer)
        };
    }
    
    // Goalkeeper rules (Rule 1.2, 1.7, 1.10, 2.7)
    if (answerLower.includes('goalkeeper') || answerLower.includes('keeper') || answerLower.includes('small rectangle') || answerLower.includes('large rectangle')) {
        return {
            type: 'goalkeeper',
            rectangle: answerLower.includes('small rectangle') ? 'small' : 
                      answerLower.includes('large rectangle') ? 'large' : null,
            charging: answerLower.includes('charge') || answerLower.includes('challenge'),
            kickout: answerLower.includes('kick-out') || answerLower.includes('kickout'),
            elements: extractGoalkeeperElements(answer)
        };
    }
    
    // Scoring rules (Rule 3)
    if (answerLower.includes('score') || answerLower.includes('goal') || answerLower.includes('point') || answerLower.includes('endline')) {
        return {
            type: 'scoring',
            scoreType: answerLower.includes('goal') ? 'goal' : 
                      answerLower.includes('point') ? 'point' : null,
            restart: answerLower.includes('kick-out') || answerLower.includes('45m'),
            elements: extractScoringElements(answer)
        };
    }
    
    // Penalty rules (Rule 2.4, 4, 5, 6)
    if (answerLower.includes('card') || answerLower.includes('penalty') || answerLower.includes('foul')) {
        return {
            type: 'penalty',
            cardType: answerLower.includes('yellow') ? 'yellow' : 
                     answerLower.includes('red') ? 'red' : 
                     answerLower.includes('black') ? 'black' : null,
            foulType: extractFoulType(answer),
            penalty: extractPenaltyType(answer),
            distance: extractDistance(answer)
        };
    }
    
    // Positioning rules
    if (answerLower.includes('position') || answerLower.includes('stand') || answerLower.includes('line') || answerLower.includes('13m') || answerLower.includes('20m')) {
        return {
            type: 'positioning',
            elements: extractPositioningElements(answer)
        };
    }
    
    // Game procedure rules
    if (answerLower.includes('procedure') || answerLower.includes('start') || answerLower.includes('restart') || answerLower.includes('game')) {
        return {
            type: 'procedure',
            elements: extractProcedureElements(answer)
        };
    }
    
    return {
        type: 'rule',
        elements: extractGeneralElements(answer)
    };
}

function extractDistance(answer) {
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('11m')) return '11m';
    if (answerLower.includes('13m')) return '13m';
    if (answerLower.includes('20m')) return '20m';
    if (answerLower.includes('45m')) return '45m';
    if (answerLower.includes('40m')) return '40m';
    
    return null;
}

function extractPositioningElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('45m')) elements.push('45m line');
    if (answerLower.includes('13m')) elements.push('13m line');
    if (answerLower.includes('20m')) elements.push('20m line');
    if (answerLower.includes('halfway')) elements.push('halfway line');
    if (answerLower.includes('sideline')) elements.push('sideline');
    if (answerLower.includes('defensive')) elements.push('defensive side');
    if (answerLower.includes('opposite')) elements.push('opposite sides');
    if (answerLower.includes('goal-line')) elements.push('goal-line');
    if (answerLower.includes('endline')) elements.push('endline');
    
    return elements;
}

function extractFreeKickElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('hands')) elements.push('from hands');
    if (answerLower.includes('ground')) elements.push('from ground');
    if (answerLower.includes('solo')) elements.push('solo and go');
    if (answerLower.includes('immediate')) elements.push('immediate');
    if (answerLower.includes('consent')) elements.push('referee consent');
    
    return elements;
}

function extractBallHandlingElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('four steps')) elements.push('four steps');
    if (answerLower.includes('bounce')) elements.push('bounce');
    if (answerLower.includes('toe-tap')) elements.push('toe-tap');
    if (answerLower.includes('hand')) elements.push('hand');
    if (answerLower.includes('foot')) elements.push('foot');
    if (answerLower.includes('fist')) elements.push('fist');
    if (answerLower.includes('open hand')) elements.push('open hand');
    
    return elements;
}

function extractGoalkeeperElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('small rectangle')) elements.push('small rectangle');
    if (answerLower.includes('large rectangle')) elements.push('large rectangle');
    if (answerLower.includes('charge')) elements.push('charging');
    if (answerLower.includes('challenge')) elements.push('challenging');
    if (answerLower.includes('kick-out')) elements.push('kick-out');
    if (answerLower.includes('goal-line')) elements.push('goal-line');
    
    return elements;
}

function extractScoringElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('goal')) elements.push('goal');
    if (answerLower.includes('point')) elements.push('point');
    if (answerLower.includes('kick-out')) elements.push('kick-out');
    if (answerLower.includes('45m')) elements.push('45m free');
    if (answerLower.includes('endline')) elements.push('endline');
    
    return elements;
}

function extractFoulType(answer) {
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('overcarry')) return 'overcarrying';
    if (answerLower.includes('handpass')) return 'handpassing';
    if (answerLower.includes('dissent')) return 'dissent';
    if (answerLower.includes('cynical')) return 'cynical behavior';
    if (answerLower.includes('aggressive')) return 'aggressive foul';
    
    return 'foul';
}

function extractPenaltyType(answer) {
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('free kick')) return 'free kick';
    if (answerLower.includes('penalty')) return 'penalty';
    if (answerLower.includes('card')) return 'card';
    
    return 'penalty';
}

function extractProcedureElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('start')) elements.push('game start');
    if (answerLower.includes('restart')) elements.push('game restart');
    if (answerLower.includes('half-time')) elements.push('half-time');
    if (answerLower.includes('throw')) elements.push('throw-in');
    
    return elements;
}

function extractGeneralElements(answer) {
    const elements = [];
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('players')) elements.push('players');
    if (answerLower.includes('referee')) elements.push('referee');
    if (answerLower.includes('team')) elements.push('teams');
    if (answerLower.includes('ball')) elements.push('ball');
    
    return elements;
}

function generateThrowInQuestion(elements) {
    if (elements.referee && elements.positioning) {
        return 'How does the referee conduct the throw-in and where must players be positioned?';
    } else if (elements.timing) {
        return 'What is the procedure for the throw-in at the start of the game and after half-time?';
    } else if (elements.players) {
        return 'What is the correct procedure for the throw-in, including player positioning?';
    } else {
        return 'What is the proper throw-in procedure in Gaelic football?';
    }
}

function generatePositioningQuestion(elements) {
    if (elements.elements.includes('45m line')) {
        return 'Where must players be positioned during the throw-in procedure?';
    } else if (elements.elements.includes('halfway line')) {
        return 'What are the positioning requirements for players at the halfway line during throw-in?';
    } else if (elements.elements.includes('sideline')) {
        return 'What is the rule regarding player positioning on the sidelines during throw-in?';
    } else {
        return 'What are the positioning requirements for this situation?';
    }
}

function generateProcedureQuestion(elements) {
    if (elements.elements.includes('game start')) {
        return 'What is the correct procedure for starting the game?';
    } else if (elements.elements.includes('half-time')) {
        return 'What happens at half-time regarding player positioning?';
    } else if (elements.elements.includes('throw-in')) {
        return 'What is the proper throw-in procedure?';
    } else {
        return 'What is the correct procedure for this situation?';
    }
}

function generateFreeKickQuestion(elements) {
    if (elements.distance === '45m') {
        return 'When is a 45m free kick awarded and how is it taken?';
    } else if (elements.method === 'solo') {
        return 'What are the rules for taking a Solo and Go free kick?';
    } else if (elements.method === 'hands') {
        return 'How may a free kick be taken from the hands?';
    } else if (elements.method === 'ground') {
        return 'What are the requirements for taking a free kick from the ground?';
    } else if (elements.elements.includes('immediate')) {
        return 'When may a free kick be taken immediately?';
    } else {
        return 'What are the rules for taking a free kick?';
    }
}

function generateBallHandlingQuestion(elements) {
    if (elements.steps) {
        return 'What are the rules for carrying the ball in Gaelic football?';
    } else if (elements.method === 'bounce') {
        return 'What are the rules for bouncing the ball?';
    } else if (elements.method === 'hand') {
        return 'What are the rules for playing the ball with the hand(s)?';
    } else if (elements.method === 'foot') {
        return 'What are the rules for playing the ball with the foot?';
    } else if (elements.elements.includes('toe-tap')) {
        return 'What is the rule regarding toe-tapping the ball?';
    } else if (elements.elements.includes('fist')) {
        return 'What are the rules for playing the ball with a fist?';
    } else {
        return 'What are the basic ball handling rules in Gaelic football?';
    }
}

function generateScoringQuestion(elements) {
    if (elements.scoreType === 'goal') {
        return 'What is the procedure for scoring a goal?';
    } else if (elements.scoreType === 'point') {
        return 'What is the procedure for scoring a point?';
    } else if (elements.restart) {
        return 'How is play restarted after a score?';
    } else if (elements.elements.includes('endline')) {
        return 'What happens when the ball crosses the endline?';
    } else {
        return 'What are the scoring rules in Gaelic football?';
    }
}

function generateGoalkeeperQuestion(elements) {
    if (elements.rectangle === 'small') {
        return 'What are the goalkeeper\'s privileges within the small rectangle?';
    } else if (elements.rectangle === 'large') {
        return 'What are the rules regarding the goalkeeper in the large rectangle?';
    } else if (elements.charging) {
        return 'When may a goalkeeper be charged or challenged?';
    } else if (elements.kickout) {
        return 'What are the rules for taking a kick-out?';
    } else if (elements.elements.includes('goal-line')) {
        return 'What are the goalkeeper\'s restrictions on the goal-line?';
    } else {
        return 'What are the goalkeeper\'s rights and restrictions?';
    }
}

function generatePenaltyQuestion(elements) {
    if (elements.cardType) {
        return `What type of foul results in a ${elements.cardType} card?`;
    } else if (elements.foulType) {
        return `What is the penalty for ${elements.foulType}?`;
    } else if (elements.penalty) {
        return `What type of infringement results in a ${elements.penalty}?`;
    } else if (elements.distance === '11m') {
        return 'What are the rules for taking a penalty kick?';
    } else {
        return 'What is the penalty for this type of foul?';
    }
}

function generateRuleQuestion(elements) {
    if (elements.elements.includes('players') && elements.elements.includes('referee')) {
        return 'What is the rule regarding player and referee interaction?';
    } else if (elements.elements.includes('teams')) {
        return 'What is the rule regarding team positioning?';
    } else if (elements.elements.includes('ball')) {
        return 'What is the rule regarding ball handling?';
    } else {
        return 'What is the specific rule being described?';
    }
}

function generateGenericQuestion(elements) {
    // For complex answers, generate a more specific question
    // We need to get the original answer text from the input field
    const answerText = document.getElementById('answerText');
    const answerLower = answerText ? answerText.value.toLowerCase() : '';
    
    // Handle the specific throw-in rule you mentioned (Rule 2.1)
    if (answerLower.includes('referee') && answerLower.includes('throw') && answerLower.includes('ball') && answerLower.includes('between') && answerLower.includes('halfway')) {
        return 'What is the complete throw-in procedure at the start of the game and after half-time, including referee action, player positioning, and sideline changes?';
    } else if (answerLower.includes('referee') && answerLower.includes('throw') && answerLower.includes('ball')) {
        return 'What is the referee\'s role in conducting the throw-in procedure?';
    } else if (answerLower.includes('players') && answerLower.includes('position') && answerLower.includes('45m')) {
        return 'Where must players be positioned during the throw-in procedure?';
    } else if (answerLower.includes('halfway') && answerLower.includes('line') && answerLower.includes('defensive')) {
        return 'What are the positioning requirements for players at the halfway line during throw-in?';
    } else if (answerLower.includes('45m') && answerLower.includes('line') && answerLower.includes('respective')) {
        return 'What is the significance of the 45m line in player positioning during throw-in?';
    } else if (answerLower.includes('sideline') && answerLower.includes('swap') && answerLower.includes('2nd half')) {
        return 'What happens with sideline positioning between the first and second halves?';
    } else if (answerLower.includes('defensive') && answerLower.includes('side') && answerLower.includes('halfway')) {
        return 'What are the positioning requirements for players on their defensive sides of the halfway line?';
    } else if (answerLower.includes('second player') && answerLower.includes('sideline') && answerLower.includes('opposite')) {
        return 'What is the role and positioning of the second player on the sidelines during throw-in?';
    } else if (answerLower.includes('start') && answerLower.includes('game') && answerLower.includes('restart')) {
        return 'How does the referee start the game and restart it after half-time?';
    } else {
        return 'What is the complete procedure described in this rule?';
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

// Generate intelligent wrong answers based on question context
function generateIntelligentWrongAnswers(currentQuestion) {
    const questionText = currentQuestion.question.toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const category = currentQuestion.category;
    
    // Define context-specific wrong answers
    const wrongAnswerTemplates = {
        // Player count questions
        'how many players': [
            '11 players per team',
            '13 players per team', 
            '16 players per team'
        ],
        'number of players': [
            '11 players per team',
            '13 players per team',
            '16 players per team'
        ],
        
        // Time-related questions
        'how long': [
            '30 minutes per half',
            '45 minutes per half',
            '60 minutes per half'
        ],
        'duration': [
            '30 minutes per half',
            '45 minutes per half', 
            '60 minutes per half'
        ],
        
        // Distance questions
        'how far': [
            '10 meters',
            '20 meters',
            '30 meters'
        ],
        'distance': [
            '10 meters',
            '20 meters',
            '30 meters'
        ],
        
        // Penalty questions
        'penalty': [
            'Yellow card',
            'Red card',
            'Free kick from 45 meters'
        ],
        'penalty for': [
            'Yellow card',
            'Red card', 
            'Free kick from 45 meters'
        ],
        
        // Free kick questions
        'free kick': [
            'Penalty kick',
            'Yellow card',
            'Red card'
        ],
        
        // Card questions
        'yellow card': [
            'Red card',
            'Black card',
            'Free kick to opposition'
        ],
        'red card': [
            'Yellow card',
            'Black card',
            'Free kick to opposition'
        ],
        'black card': [
            'Yellow card',
            'Red card',
            'Free kick to opposition'
        ]
    };
    
    // Category-specific wrong answers
    const categoryWrongAnswers = {
        technical: [
            'Red card',
            'Black card',
            'Penalty kick'
        ],
        aggressive: [
            'Yellow card',
            'Free kick to opposition',
            'Penalty kick'
        ],
        dissent: [
            'Yellow card',
            'Red card',
            'Free kick to opposition'
        ],
        setplay: [
            'Yellow card',
            'Red card',
            'Black card'
        ],
        general: [
            'Yellow card',
            'Red card',
            'Black card'
        ],
        scenarios: [
            'Yellow card',
            'Red card',
            'Free kick to opposition'
        ]
    };
    
    // Try to find context-specific wrong answers
    let wrongAnswers = [];
    
    // Check for specific question patterns
    for (const [pattern, answers] of Object.entries(wrongAnswerTemplates)) {
        if (questionText.includes(pattern)) {
            wrongAnswers = answers.filter(answer => 
                answer.toLowerCase() !== correctAnswer
            );
            break;
        }
    }
    
    // If no specific pattern found, use category-based answers
    if (wrongAnswers.length === 0) {
        wrongAnswers = categoryWrongAnswers[category] || [
            'Yellow card',
            'Red card',
            'Free kick to opposition'
        ];
    }
    
    // Ensure we have exactly 3 wrong answers
    while (wrongAnswers.length < 3) {
        const fallbackAnswers = [
            'Yellow card',
            'Red card',
            'Free kick to opposition',
            'Penalty kick',
            'Black card'
        ];
        
        const randomAnswer = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
        if (!wrongAnswers.includes(randomAnswer) && randomAnswer.toLowerCase() !== correctAnswer) {
            wrongAnswers.push(randomAnswer);
        }
    }
    
    // Return exactly 3 wrong answers
    return wrongAnswers.slice(0, 3);
}

function showQuizQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    if (!question) return;
    
    // Calculate percentage based on completed questions (not current question)
    const completedQuestions = currentQuestionIndex;
    const percentage = completedQuestions > 0 ? (quizScore / completedQuestions) * 100 : 0;
    
    // Show score only if we have completed questions
    const scoreDisplay = completedQuestions > 0 
        ? `<span class="current-score">Score: ${quizScore}/${completedQuestions} (${Math.round(percentage)}%)</span>`
        : '';
    
    quizProgress.innerHTML = `
        <div class="quiz-progress-info">
            <span class="question-counter">Question ${currentQuestionIndex + 1} of ${currentQuiz.length}</span>
            ${scoreDisplay}
        </div>
    `;
    progressFill.style.width = `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%`;
    
    quizQuestion.textContent = question.question;
    
    // Create intelligent wrong answers based on question context
    const wrongAnswers = generateIntelligentWrongAnswers(question);
    
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
    
    // Update the progress display with new score
    const completedQuestions = currentQuestionIndex + 1;
    const percentage = (quizScore / completedQuestions) * 100;
    const progressInfo = document.querySelector('.quiz-progress-info');
    if (progressInfo) {
        progressInfo.innerHTML = `
            <span class="question-counter">Question ${currentQuestionIndex + 1} of ${currentQuiz.length}</span>
            <span class="current-score ${isCorrect ? 'score-correct' : 'score-incorrect'}">Score: ${quizScore}/${completedQuestions} (${Math.round(percentage)}%)</span>
        `;
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
    
    const percentage = (quizScore / currentQuiz.length) * 100;
    const totalQuestions = currentQuiz.length;
    
    // Determine performance level and badge
    let performanceLevel, badge, message, color, emoji;
    
    if (percentage >= 90) {
        performanceLevel = 'Outstanding';
        badge = '🏆 Champion Referee';
        message = 'Exceptional knowledge! You\'re a true GAA rules expert.';
        color = '#fbbf24';
        emoji = '🏆';
    } else if (percentage >= 80) {
        performanceLevel = 'Excellent';
        badge = '🥇 Gold Medal';
        message = 'Excellent work! You\'re ready for any game situation.';
        color = '#fbbf24';
        emoji = '🥇';
    } else if (percentage >= 70) {
        performanceLevel = 'Very Good';
        badge = '🥈 Silver Medal';
        message = 'Very good performance! A bit more practice and you\'ll be perfect.';
        color = '#9ca3af';
        emoji = '🥈';
    } else if (percentage >= 60) {
        performanceLevel = 'Good';
        badge = '🥉 Bronze Medal';
        message = 'Good job! Keep studying to improve your knowledge.';
        color = '#d97706';
        emoji = '🥉';
    } else if (percentage >= 40) {
        performanceLevel = 'Fair';
        badge = '📚 Student';
        message = 'Fair performance. More study time needed before your next game.';
        color = '#6b7280';
        emoji = '📚';
    } else {
        performanceLevel = 'Needs Improvement';
        badge = '🔄 Practice Needed';
        message = 'Keep studying! Review the rules thoroughly before your next game.';
        color = '#ef4444';
        emoji = '🔄';
    }
    
    // Calculate category performance
    const categoryStats = {};
    currentQuiz.forEach((question, index) => {
        const category = question.category;
        if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, correct: 0 };
        }
        categoryStats[category].total++;
        // Note: We don't track individual question results, so this is simplified
    });
    
    // Generate category breakdown HTML
    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => `
        <div class="category-stat">
            <span class="category-name">${getCategoryName(category)}</span>
            <span class="category-score">${stats.total} questions</span>
        </div>
    `).join('');
    
    // Generate study recommendations
    let studyRecommendations = '';
    if (percentage < 80) {
        studyRecommendations = `
            <div class="study-recommendations">
                <h4>📖 Study Recommendations:</h4>
                <ul>
                    <li>Review the questions you missed</li>
                    <li>Focus on your weaker categories</li>
                    <li>Take more practice quizzes</li>
                    <li>Read through the official GAA rules</li>
                </ul>
            </div>
        `;
    }
    
    quizResults.innerHTML = `
        <div class="results-container">
            <div class="results-header">
                <div class="performance-badge" style="background: ${color}">
                    <span class="badge-emoji">${emoji}</span>
                    <span class="badge-text">${badge}</span>
                </div>
                <h3>Quiz Complete!</h3>
                <p class="performance-level">${performanceLevel} Performance</p>
            </div>
            
            <div class="score-section">
                <div class="score-circle" style="border-color: ${color}">
                    <div class="score-number">${quizScore}</div>
                    <div class="score-total">/ ${totalQuestions}</div>
                    <div class="score-percentage">${Math.round(percentage)}%</div>
                </div>
                <p class="score-message">${message}</p>
            </div>
            
            <div class="stats-section">
                <h4>📊 Quiz Statistics:</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Questions Answered</span>
                        <span class="stat-value">${totalQuestions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Correct Answers</span>
                        <span class="stat-value">${quizScore}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Accuracy</span>
                        <span class="stat-value">${Math.round(percentage)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Performance</span>
                        <span class="stat-value">${performanceLevel}</span>
                    </div>
                </div>
            </div>
            
            <div class="category-breakdown">
                <h4>📋 Categories Tested:</h4>
                <div class="category-stats">
                    ${categoryBreakdown}
                </div>
            </div>
            
            ${studyRecommendations}
            
            <div class="results-actions">
                <button id="retakeQuizBtn" class="btn btn-primary">🔄 Take Another Quiz</button>
                <button id="reviewQuestionsBtn" class="btn btn-secondary">📚 Review Questions</button>
                <button id="shareResultsBtn" class="btn btn-support">📤 Share Results</button>
            </div>
        </div>
    `;
    
    // Re-attach event listeners
    document.getElementById('retakeQuizBtn').addEventListener('click', startQuiz);
    document.getElementById('reviewQuestionsBtn').addEventListener('click', () => {
        switchTab('study');
        showNotification('Switch to Study Mode to review all questions', 'info');
    });
    document.getElementById('shareResultsBtn').addEventListener('click', shareResults);
}

function shareResults() {
    const percentage = (quizScore / currentQuiz.length) * 100;
    const shareText = `🏐 GAA Referee Quiz Results: ${quizScore}/${currentQuiz.length} (${Math.round(percentage)}%) - Test your knowledge at https://gally74.github.io/gaelic-football-rules`;
    
    if (navigator.share) {
        navigator.share({
            title: 'GAA Referee Quiz Results',
            text: shareText,
            url: 'https://gally74.github.io/gaelic-football-rules'
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Results copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Share feature not available', 'error');
        });
    }
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