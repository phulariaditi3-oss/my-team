const STORAGE_KEY = 'liferpg-data';

const defaultState = {
  username: 'Adventurer',
  avatar: 'Warrior',
  xp: 0,
  coins: 120,
  streak: 0,
  quests: [
    {
      id: 1,
      title: 'Read 20 minutes',
      difficulty: 'Easy',
      xp: 50,
      coins: 15,
      completed: false
    },
    {
      id: 2,
      title: 'Go for a 30-min walk',
      difficulty: 'Medium',
      xp: 80,
      coins: 20,
      completed: false
    }
  ],
  achievements: [],
  completedQuests: 0,
  theme: 'dark',
  dailyChallenge: null,
  challengeDate: null,
  challengeCompleted: false,
  lastLoginDate: null,
  activity: [3, 5, 2, 7, 4, 6, 5],
  coinsEarnedHistory: [20, 35, 25, 50, 45, 70, 90]
};

const shopItems = [
  { id: 1, name: 'Movie Break', cost: 40, icon: '🎬' },
  { id: 2, name: 'Gaming Session', cost: 70, icon: '🎮' },
  { id: 3, name: 'Pizza Reward', cost: 55, icon: '🍕' },
  { id: 4, name: 'Cheat Day', cost: 90, icon: '🍰' }
];

let state = loadState();
let currentQuestId = null;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(saved);
    return { ...structuredClone(defaultState), ...parsed };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calculateLevel(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }
  return { level, xpForCurrent: xpForLevel(level), xpForNext: xpForLevel(level + 1) };
}

function xpForLevel(level) {
  if (level <= 1) return 0;
  return 100 * (level - 1) + 25 * (level - 2) * (level - 1);
}

function getProgressPercent() {
  const { level, xpForCurrent, xpForNext } = calculateLevel(state.xp);
  const current = state.xp - xpForCurrent;
  const total = xpForNext - xpForCurrent || 1;
  return Math.min(100, Math.round((current / total) * 100));
}

function updateTheme() {
  document.documentElement.dataset.theme = state.theme;
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.textContent = state.theme === 'dark' ? '☀' : state.theme === 'cyberpunk' ? '⚡' : '🌙';
}

function initThemeButtons() {
  const themeButtons = document.querySelectorAll('[data-theme-option]');
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.theme = btn.dataset.themeOption;
      updateTheme();
      saveState();
      toast('Theme updated');
    });
  });
}

function updateUI() {
  const { level, xpForCurrent, xpForNext } = calculateLevel(state.xp);
  const progress = getProgressPercent();

  document.getElementById('profileName').textContent = state.username;
  document.getElementById('profileTitle').textContent = `Level ${level} ${state.avatar}`;
  document.getElementById('profileAvatar').textContent = avatarEmoji(state.avatar);

  document.getElementById('levelDisplay').textContent = level;
  document.getElementById('xpDisplay').textContent = `${state.xp} / ${xpForNext}`;
  document.getElementById('coinDisplay').textContent = state.coins;
  document.getElementById('streakDisplay').textContent = state.streak;
  document.getElementById('completedCount').textContent = state.completedQuests;
  document.getElementById('achievementCount').textContent = state.achievements.length;
  document.getElementById('heroLevel').textContent = level;
  document.getElementById('heroXp').textContent = `${progress}%`;
  document.getElementById('progressText').textContent = `${progress}% to next level`;
  document.getElementById('progressFill').style.width = `${progress}%`;
  document.getElementById('shopCoins').textContent = `Coins: ${state.coins}`;

  document.querySelectorAll('.ring-progress').forEach((el) => {
    const circumference = 2 * Math.PI * 46;
    el.style.strokeDasharray = circumference;
    el.style.strokeDashoffset = circumference * (1 - progress / 100);
  });

  updateQuestList();
  updateShop();
  updateAchievements();
  drawCharts();
}

function avatarEmoji(name) {
  return {
    Warrior: '⚔',
    Mage: '🧙',
    Archer: '🏹',
    Ninja: '🥷'
  }[name] || '🧙';
}

function updateQuestList() {
  const questList = document.getElementById('questList');
  questList.innerHTML = '';

  state.quests.forEach((quest) => {
    const card = document.createElement('div');
    card.className = `quest-card glass-card ${quest.completed ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="quest-top">
        <div>
          <h4>${quest.title}</h4>
          <div class="quest-meta">
            <span class="badge">${quest.difficulty}</span>
            <span class="badge">+${quest.xp} XP</span>
            <span class="badge">+${quest.coins} Coins</span>
          </div>
        </div>
        <div class="quest-actions">
          <button class="quest-action" data-action="edit" data-id="${quest.id}">✎</button>
          <button class="quest-action" data-action="delete" data-id="${quest.id}">🗑</button>
        </div>
      </div>
      <div class="quest-actions" style="margin-top: 0.8rem;">
        <button class="start-btn quest-complete" data-action="complete" data-id="${quest.id}" ${quest.completed ? 'disabled' : ''}>Complete</button>
      </div>
    `;
    questList.appendChild(card);
  });
}

function updateShop() {
  const shopGrid = document.getElementById('shopGrid');
  shopGrid.innerHTML = '';

  shopItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div style="font-size: 2rem;">${item.icon}</div>
      <h4>${item.name}</h4>
      <p>${item.cost} coins</p>
      <button class="shop-btn" data-buy="${item.id}" ${state.coins < item.cost ? 'disabled' : ''}>Buy</button>
    `;
    shopGrid.appendChild(card);
  });
}

function updateAchievements() {
  const achievements = [
    {
      key: 'first-steps',
      title: 'First Steps',
      description: 'Complete your first quest',
      unlocked: state.completedQuests >= 1
    },
    {
      key: 'productive-hero',
      title: 'Productive Hero',
      description: 'Complete 10 quests',
      unlocked: state.completedQuests >= 10
    },
    {
      key: 'quest-master',
      title: 'Quest Master',
      description: 'Complete 50 quests',
      unlocked: state.completedQuests >= 50
    },
    {
      key: 'level-legend',
      title: 'Level Legend',
      description: 'Reach level 10',
      unlocked: calculateLevel(state.xp).level >= 10
    },
    {
      key: 'streak-king',
      title: 'Streak King',
      description: 'Maintain a 7-day streak',
      unlocked: state.streak >= 7
    }
  ];

  if (!state.achievements) state.achievements = [];

  achievements.forEach((achievement) => {
    if (achievement.unlocked && !state.achievements.includes(achievement.key)) {
      state.achievements.push(achievement.key);
      triggerAchievement(achievement);
    }
  });

  const achievementContainer = document.getElementById('achievementContainer') || createAchievementContainer();
  achievementContainer.innerHTML = '';

  achievements.forEach((achievement) => {
    const unlocked = state.achievements.includes(achievement.key);
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'achievement-unlocked' : ''}`;
    card.innerHTML = `
      <h4>${achievement.title}</h4>
      <p>${achievement.description}</p>
      <span>${unlocked ? 'Unlocked' : 'Locked'}</span>
    `;
    achievementContainer.appendChild(card);
  });

  saveState();
}

function createAchievementContainer() {
  const container = document.createElement('div');
  container.id = 'achievementContainer';
  container.className = 'achievement-grid';
  const dashboardPanel = document.querySelector('#dashboard .dashboard-grid');
  if (dashboardPanel) {
    const panel = document.createElement('div');
    panel.className = 'glass-card dashboard-panel';
    panel.innerHTML = '<div class="panel-header"><h3>Achievements</h3></div>';
    panel.appendChild(container);
    const dashboard = document.getElementById('dashboard');
    dashboard.appendChild(panel);
  }
  return container;
}

function triggerAchievement(achievement) {
  toast(`Achievement unlocked: ${achievement.title}`);
  confettiBurst();
  playSound('achievement');
}

function toast(message) {
  const toastContainer = document.getElementById('toastContainer');
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  toastContainer.appendChild(element);
  setTimeout(() => element.remove(), 2500);
}

function confettiBurst() {
  for (let i = 0; i < 50; i += 1) {
    const piece = document.createElement('span');
    piece.style.position = 'fixed';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = '-10px';
    piece.style.width = '8px';
    piece.style.height = '12px';
    piece.style.background = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)];
    piece.style.opacity = '0.9';
    piece.style.zIndex = '350';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animation = `fall 1.5s linear forwards`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1500);
  }
}

function addXP(amount) {
  state.xp += amount;
  saveState();
  showXpPopup(`+${amount} XP`);
  updateUI();
  playSound('quest');
}

function addCoins(amount) {
  state.coins += amount;
  saveState();
  animateCoinsToCounter();
  updateUI();
}

function showXpPopup(text) {
  const popup = document.createElement('div');
  popup.className = 'xp-popup';
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1100);
}

function animateCoinsToCounter() {
  const coinCounter = document.getElementById('coinDisplay');
  const rect = coinCounter.getBoundingClientRect();
  for (let i = 0; i < 6; i += 1) {
    const coin = document.createElement('span');
    coin.className = 'coin-fly';
    coin.style.left = `${window.innerWidth / 2}px`;
    coin.style.top = `${window.innerHeight / 2}px`;
    coin.style.setProperty('--coin-x', `${rect.left - window.innerWidth / 2 + 10}px`);
    coin.style.setProperty('--coin-y', `${rect.top - window.innerHeight / 2}px`);
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 1200);
  }
}

function playSound(type) {
  if (!state.soundEnabled) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  const presets = {
    quest: { frequency: 660, duration: 0.08, type: 'sine' },
    achievement: { frequency: 880, duration: 0.18, type: 'triangle' },
    level: { frequency: 523, duration: 0.25, type: 'sawtooth' }
  };
  const preset = presets[type] || presets.quest;
  oscillator.type = preset.type;
  oscillator.frequency.value = preset.frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + preset.duration);
  oscillator.start();
  oscillator.stop(ctx.currentTime + preset.duration);
}

function generateDailyChallenge() {
  const today = new Date().toDateString();
  if (state.challengeDate !== today || !state.dailyChallenge) {
    const challenges = [
      { text: 'Read for 20 minutes', xp: 40, coins: 15 },
      { text: 'Exercise for 30 minutes', xp: 60, coins: 18 },
      { text: 'Learn coding for 25 minutes', xp: 55, coins: 20 },
      { text: 'Drink enough water today', xp: 30, coins: 10 }
    ];
    state.dailyChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    state.challengeDate = today;
    state.challengeCompleted = false;
    saveState();
  }
  document.getElementById('challengeText').textContent = state.dailyChallenge.text;
  document.getElementById('challengeReward').textContent = `+${state.dailyChallenge.xp} XP · +${state.dailyChallenge.coins} Coins`;
  document.getElementById('challengeButton').disabled = state.challengeCompleted;
}

function handleChallengeComplete() {
  if (state.challengeCompleted) return;
  addXP(state.dailyChallenge.xp);
  addCoins(state.dailyChallenge.coins);
  state.challengeCompleted = true;
  saveState();
  confettiBurst();
  playSound('level');
  toast('Daily challenge completed!');
  generateDailyChallenge();
}

function openQuestModal(editing = false, quest = null) {
  const modal = document.getElementById('questModal');
  const title = document.getElementById('modalTitle');
  const questId = document.getElementById('questId');
  const questTitle = document.getElementById('questTitle');
  const questDifficulty = document.getElementById('questDifficulty');
  const questXp = document.getElementById('questXp');
  const questCoins = document.getElementById('questCoins');

  if (editing && quest) {
    title.textContent = 'Edit Quest';
    questId.value = quest.id;
    questTitle.value = quest.title;
    questDifficulty.value = quest.difficulty;
    questXp.value = quest.xp;
    questCoins.value = quest.coins;
  } else {
    title.textContent = 'Add Quest';
    questId.value = '';
    questForm.reset();
  }

  modal.classList.add('active');
}

function closeQuestModal() {
  document.getElementById('questModal').classList.remove('active');
}

function addOrUpdateQuest(event) {
  event.preventDefault();
  const id = document.getElementById('questId').value;
  const title = document.getElementById('questTitle').value.trim();
  const difficulty = document.getElementById('questDifficulty').value;
  const xp = Number(document.getElementById('questXp').value);
  const coins = Number(document.getElementById('questCoins').value);

  if (!title) return;

  if (id) {
    state.quests = state.quests.map((quest) =>
      quest.id === Number(id) ? { ...quest, title, difficulty, xp, coins } : quest
    );
    toast('Quest updated');
  } else {
    const newQuest = {
      id: Date.now(),
      title,
      difficulty,
      xp,
      coins,
      completed: false
    };
    state.quests.push(newQuest);
    toast('Quest added');
  }

  saveState();
  closeQuestModal();
  updateUI();
}

function deleteQuest(id) {
  state.quests = state.quests.filter((quest) => quest.id !== id);
  saveState();
  updateUI();
  toast('Quest deleted');
}

function completeQuest(id) {
  const quest = state.quests.find((q) => q.id === id);
  if (!quest || quest.completed) return;
  quest.completed = true;
  state.completedQuests += 1;
  addXP(quest.xp);
  addCoins(quest.coins);
  updateUI();
  confettiBurst();
  toast(`Quest complete: ${quest.title}`);
  saveState();
}

function drawCharts() {
  drawLineChart('xpChart', state.activity.map((_, i) => i + 1), state.activity);
  drawBarChart('activityChart', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], state.activity);
  drawDoughnutChart('completionChart', [state.completedQuests, Math.max(1, 30 - state.completedQuests)]);
  drawBarChart('coinsChart', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], state.coinsEarnedHistory);
}

function drawLineChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const padding = 18;
  const max = Math.max(...values, 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((val, idx) => {
    const x = padding + (width - padding * 2) * (idx / Math.max(values.length - 1, 1));
    const y = height - padding - ((val / max) * (height - padding * 2));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawBarChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const padding = 18;
  const barWidth = (width - padding * 2) / values.length - 12;
  values.forEach((value, idx) => {
    const x = padding + idx * ((width - padding * 2) / values.length) + 6;
    const barHeight = (value / Math.max(...values, 1)) * (height - padding * 2);
    const y = height - padding - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#38bdf8');
    gradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#22c55e');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
  });
}

function drawDoughnutChart(canvasId, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.scale(ratio, ratio);
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.clearRect(0, 0, width, height);
  let start = -Math.PI / 2;
  const colors = [getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#38bdf8', 'rgba(255,255,255,0.08)'];
  values.forEach((value, idx) => {
    const slice = (Math.PI * 2 * value) / Math.max(values.reduce((a, b) => a + b, 0), 1);
    ctx.beginPath();
    ctx.fillStyle = colors[idx];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.closePath();
    ctx.fill();
    start += slice;
  });
}

function initInteractions() {
  document.getElementById('openAppBtn').addEventListener('click', () => {
    document.getElementById('appShell').classList.add('active');
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('heroStartBtn').addEventListener('click', () => {
    document.getElementById('appShell').classList.add('active');
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelectorAll('.sidebar-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.section;
      document.querySelectorAll('.sidebar-btn').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.section-panel').forEach((panel) => panel.classList.remove('active'));
      document.getElementById(target).classList.add('active');
    });
  });

  document.getElementById('addQuestBtn').addEventListener('click', () => openQuestModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeQuestModal);
  document.getElementById('questForm').addEventListener('submit', addOrUpdateQuest);
  document.getElementById('questList').addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    const id = Number(event.target.dataset.id);
    if (action === 'delete') deleteQuest(id);
    if (action === 'edit') {
      const quest = state.quests.find((q) => q.id === id);
      if (quest) openQuestModal(true, quest);
    }
    if (action === 'complete') completeQuest(id);
  });

  document.getElementById('shopGrid').addEventListener('click', (event) => {
    const buyId = event.target.dataset.buy;
    if (!buyId) return;
    const item = shopItems.find((entry) => entry.id === Number(buyId));
    if (item && state.coins >= item.cost) {
      state.coins -= item.cost;
      toast(`${item.name} purchased!`);
      confettiBurst();
      saveState();
      updateUI();
    } else { toast('Not enough coins'); }
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    const themes = ['dark', 'cyberpunk', 'light'];
    const currentIndex = themes.indexOf(state.theme);
    state.theme = themes[(currentIndex + 1) % themes.length];
    updateTheme();
    saveState();
  });

  document.querySelectorAll('.avatar-option').forEach((button) => {
    button.addEventListener('click', () => {
      state.avatar = button.dataset.avatar;
      saveState();
      updateUI();
      document.querySelectorAll('.avatar-option').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      toast(`Avatar set to ${state.avatar}`);
    });
  });

  document.getElementById('challengeButton').addEventListener('click', handleChallengeComplete);

  document.querySelectorAll('.reveal').forEach((element) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.2 });
    observer.observe(element);
  });

  document.querySelectorAll('.nav-bar nav a').forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('href');
      if (target === '#dashboard') {
        document.getElementById('appShell').classList.add('active');
      }
    });
  });
}

function typeHeroText() {
  const title = document.getElementById('heroTitle');
  const text = 'Level Up Your Real Life';
  let index = 0;
  title.textContent = '';
  const interval = setInterval(() => {
    title.textContent += text[index];
    index += 1;
    if (index >= text.length) clearInterval(interval);
  }, 70);
}

function animateParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function createParticles() {
    particles = Array.from({ length: 110 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.4,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}

function setupLevelUpOverlay() {
  const overlay = document.getElementById('levelUpOverlay');
  let previousLevel = calculateLevel(state.xp).level;
  setInterval(() => {
    const currentLevel = calculateLevel(state.xp).level;
    if (currentLevel > previousLevel) {
      overlay.classList.add('show');
      playSound('level');
      confettiBurst();
      setTimeout(() => overlay.classList.remove('show'), 1600);
      previousLevel = currentLevel;
    }
  }, 500);
}

function setupDailyStreak() {
  const today = new Date().toDateString();
  const lastLogin = state.lastLoginDate;
  if (lastLogin && lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();
    if (lastLogin === yesterdayKey) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }
  } else if (!lastLogin) {
    state.streak = 1;
  }
  state.lastLoginDate = today;
  saveState();
}

function init() {
  setupDailyStreak();
  updateTheme();
  updateUI();
  initInteractions();
  initThemeButtons();
  generateDailyChallenge();
  typeHeroText();
  animateParticles();
  setupLevelUpOverlay();
  window.addEventListener('resize', drawCharts);
}

init();
