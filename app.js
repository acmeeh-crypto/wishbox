/* ==========================================================
   우리 둘의 소원 보관함 - App Logic
   ========================================================== */

// 30 Days in Milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Default Profiles (R & D with Photo Avatars)
const DEFAULT_PROFILES = {
  user1: { name: 'R', avatar: 'avatar_r.png' },
  user2: { name: 'D', avatar: 'avatar_d.png' }
};

// Global State
let appState = {
  profiles: { ...DEFAULT_PROFILES },
  wishes: [],
  selectedAuthor: 'user1',
  filterPerson: 'all',
  filterStatus: 'all',
  supabaseConfig: {
    url: '',
    key: ''
  },
  supabaseClient: null,
  realtimeChannel: null,
  isOnlineSync: false,
  editingWishId: null
};

// DOM Elements
const elements = {
  // Stats
  statActive: document.getElementById('statActive'),
  statActiveSmall: document.getElementById('statActiveSmall'),
  statTotal: document.getElementById('statTotal'),
  statCompleted: document.getElementById('statCompleted'),
  statExpired: document.getElementById('statExpired'),
  user1StatTag: document.getElementById('user1StatTag'),
  user1MiniAvatar: document.getElementById('user1MiniAvatar'),
  user1StatName: document.getElementById('user1StatName'),
  user1StatCount: document.getElementById('user1StatCount'),
  user2StatTag: document.getElementById('user2StatTag'),
  user2MiniAvatar: document.getElementById('user2MiniAvatar'),
  user2StatName: document.getElementById('user2StatName'),
  user2StatCount: document.getElementById('user2StatCount'),
  // Form
  wishForm: document.getElementById('wishForm'),
  wishAuthor: document.getElementById('wishAuthor'),
  wishCreatedAt: document.getElementById('wishCreatedAt'),
  calculatedExpiryPreview: document.getElementById('calculatedExpiryPreview'),
  wishCategory: document.getElementById('wishCategory'),
  wishContent: document.getElementById('wishContent'),
  charCount: document.getElementById('charCount'),
  btnAuthor1: document.getElementById('btnAuthor1'),
  btnAuthor2: document.getElementById('btnAuthor2'),
  avatarPreview1: document.getElementById('avatarPreview1'),
  namePreview1: document.getElementById('namePreview1'),
  avatarPreview2: document.getElementById('avatarPreview2'),
  namePreview2: document.getElementById('namePreview2'),
  // Filters
  filterTabUser1: document.getElementById('filterTabUser1'),
  tabUser1Avatar: document.getElementById('tabUser1Avatar'),
  tabUser1Name: document.getElementById('tabUser1Name'),
  filterTabUser2: document.getElementById('filterTabUser2'),
  tabUser2Avatar: document.getElementById('tabUser2Avatar'),
  tabUser2Name: document.getElementById('tabUser2Name'),
  chipAllCount: document.getElementById('chipAllCount'),
  chipRegCount: document.getElementById('chipRegCount'),
  chipCompCount: document.getElementById('chipCompCount'),
  chipExpCount: document.getElementById('chipExpCount'),
  // List
  wishListContainer: document.getElementById('wishListContainer'),
  emptyState: document.getElementById('emptyState'),
  // Header / Sync
  btnOpenProfiles: document.getElementById('btnOpenProfiles'),
  btnOpenSync: document.getElementById('btnOpenSync'),
  syncStatusText: document.getElementById('syncStatusText'),
  syncIndicator: document.getElementById('syncIndicator'),
  // Modals
  modalProfiles: document.getElementById('modalProfiles'),
  modalSync: document.getElementById('modalSync'),
  inputUser1Name: document.getElementById('inputUser1Name'),
  inputUser2Name: document.getElementById('inputUser2Name'),
  user1EmojiRow: document.getElementById('user1EmojiRow'),
  user2EmojiRow: document.getElementById('user2EmojiRow'),
  btnSaveProfiles: document.getElementById('btnSaveProfiles'),
  supabaseUrl: document.getElementById('supabaseUrl'),
  supabaseKey: document.getElementById('supabaseKey'),
  btnSaveSync: document.getElementById('btnSaveSync'),
  btnDisconnectSync: document.getElementById('btnDisconnectSync'),
  btnCopySql: document.getElementById('btnCopySql'),
  toast: document.getElementById('toast')
};

// ==========================================================
// SPA Screen Navigation
// ==========================================================
const SCREEN_TITLES = {
  'screen-stats':    '📊 소원 현황판',
  'screen-register': '💌 소원 등록',
  'screen-list':     '📜 소원 보기',
};

let currentScreen = 'screen-home';

function navigateToScreen(screenId) {
  const direction = screenId === 'screen-home' ? -1 : 1;

  // Outgoing screen: slide out
  const outgoing = document.querySelector('.app-screen.active');
  if (outgoing) {
    outgoing.classList.remove('active');
    outgoing.classList.add(direction > 0 ? 'slide-out-left' : 'slide-out-right');
    outgoing.addEventListener('animationend', () => {
      outgoing.classList.remove('slide-out-left', 'slide-out-right');
    }, { once: true });
  }

  // Incoming screen: slide in
  const incoming = document.getElementById(screenId);
  if (incoming) {
    incoming.classList.add(direction > 0 ? 'slide-in-right' : 'slide-in-left');
    incoming.classList.add('active');
    incoming.addEventListener('animationend', () => {
      incoming.classList.remove('slide-in-right', 'slide-in-left');
    }, { once: true });
  }

  currentScreen = screenId;

  // Update header UI
  const btnBack = document.getElementById('btnBack');
  const headerLogo = document.getElementById('headerLogo');
  const headerScreenTitle = document.getElementById('headerScreenTitle');

  if (screenId === 'screen-home') {
    if (btnBack) btnBack.classList.add('hidden');
    if (headerLogo) headerLogo.classList.remove('hidden');
    if (headerScreenTitle) { headerScreenTitle.classList.add('hidden'); headerScreenTitle.textContent = ''; }
  } else {
    if (btnBack) btnBack.classList.remove('hidden');
    if (headerLogo) headerLogo.classList.add('hidden');
    if (headerScreenTitle) { headerScreenTitle.classList.remove('hidden'); headerScreenTitle.textContent = SCREEN_TITLES[screenId] || ''; }
  }
}

function goHome() {
  navigateToScreen('screen-home');
}

function initNavigation() {
  // Home nav buttons → navigate to screen
  document.querySelectorAll('.home-nav-btn[data-target-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target-screen');
      navigateToScreen(target);
    });
  });

  // Back button → home
  const btnBack = document.getElementById('btnBack');
  if (btnBack) {
    btnBack.addEventListener('click', goHome);
  }
}

// ==========================================================
// Initializer
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadProfilesFromStorage();
  loadSyncConfigFromStorage();
  initWishDateField();
  initEventHandlers();
  initNavigation();
  initSupabaseIfConfigured();
  if (!appState.isOnlineSync) {
    loadWishesFromStorage();
  }
  startCountdownTicker();
});

// Helper: Render avatar as img tag if image path, or text/emoji
function renderAvatarHtml(avatarValue, nameStr = '') {
  if (!avatarValue) return '👤';
  if (avatarValue.endsWith('.png') || avatarValue.endsWith('.jpg') || avatarValue.includes('avatar_')) {
    return `<img src="${avatarValue}" class="avatar-img-circle" alt="${escapeHtml(nameStr || '아바타')}">`;
  }
  return escapeHtml(avatarValue);
}

// Helper: Format date for date input (YYYY-MM-DD)
function toLocalDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
}

function initWishDateField() {
  if (!elements.wishCreatedAt) return;
  const now = new Date();
  elements.wishCreatedAt.value = toLocalDateInputValue(now);
  updateExpiryPreview();
}

function updateExpiryPreview() {
  if (!elements.calculatedExpiryPreview) return;
  let baseDate = new Date();
  if (elements.wishCreatedAt && elements.wishCreatedAt.value) {
    const val = elements.wishCreatedAt.value;
    const parsed = new Date(val + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }
  const expiry = new Date(baseDate.getTime() + THIRTY_DAYS_MS);
  elements.calculatedExpiryPreview.textContent = formatDate(expiry.toISOString());
}

// ==========================================================
// Profile Management
// ==========================================================
function loadProfilesFromStorage() {
  const saved = localStorage.getItem('two_wishes_profiles');
  if (saved) {
    try {
      appState.profiles = JSON.parse(saved);
      // Migrate old defaults to R & D with photos if user hasn't explicitly customized
      if (appState.profiles.user1.name === '로빈' || appState.profiles.user1.name === '사용자 1' || appState.profiles.user1.name === '대원 1') {
        appState.profiles.user1.name = 'R';
        appState.profiles.user1.avatar = 'avatar_r.png';
      }
      if (appState.profiles.user2.name === '연주' || appState.profiles.user2.name === '사용자 2' || appState.profiles.user2.name === '대원 2') {
        appState.profiles.user2.name = 'D';
        appState.profiles.user2.avatar = 'avatar_d.png';
      }
    } catch (e) {
      appState.profiles = { ...DEFAULT_PROFILES };
    }
  } else {
    appState.profiles = { ...DEFAULT_PROFILES };
  }
  renderProfileUI();
}

function saveProfilesToStorage() {
  localStorage.setItem('two_wishes_profiles', JSON.stringify(appState.profiles));
  renderProfileUI();
  renderWishes();
  showToast('프로필 정보가 저장되었습니다! ✨');
}

function renderProfileUI() {
  const { user1, user2 } = appState.profiles;
  // Form Author buttons
  elements.avatarPreview1.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.namePreview1.textContent = user1.name;
  elements.avatarPreview2.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.namePreview2.textContent = user2.name;

  // Tabs
  elements.tabUser1Avatar.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.tabUser1Name.textContent = `${user1.name}의 소원`;
  elements.tabUser2Avatar.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.tabUser2Name.textContent = `${user2.name}의 소원`;

  // Stats tags
  elements.user1MiniAvatar.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.user1StatName.textContent = user1.name;
  elements.user2MiniAvatar.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.user2StatName.textContent = user2.name;
}

// ==========================================================
// Local Storage for Wishes
// ==========================================================
function loadWishesFromStorage() {
  const saved = localStorage.getItem('two_wishes_list');
  if (saved) {
    try {
      appState.wishes = JSON.parse(saved);
      // Migrate old sample wishes authors if needed
      appState.wishes.forEach(w => {
        if (w.author_id === 'user1' && (w.author_name === '로빈' || w.author_name === '사용자 1')) {
          w.author_name = appState.profiles.user1.name;
          w.author_avatar = appState.profiles.user1.avatar;
        }
        if (w.author_id === 'user2' && (w.author_name === '연주' || w.author_name === '사용자 2')) {
          w.author_name = appState.profiles.user2.name;
          w.author_avatar = appState.profiles.user2.avatar;
        }
      });
    } catch (e) {
      appState.wishes = [];
    }
  } else {
    appState.wishes = getStarterSampleWishes();
    saveWishesToStorage();
  }
  checkAndExpireWishes();
  renderWishes();
  updateStats();
}

function saveWishesToStorage() {
  localStorage.setItem('two_wishes_list', JSON.stringify(appState.wishes));
}

function getStarterSampleWishes() {
  const now = new Date();
  const sample1Created = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const sample2Created = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

  return [
    {
      id: 'wish_sample_1',
      author_id: 'user1',
      author_name: 'R',
      author_avatar: 'avatar_r.png',
      category: '데이트 / 놀기 🎡',
      content: '이번 주말에 날씨 좋으면 한강 공원에서 피크닉하고 돗자리 펴서 낮잠 자기 🌸',
      status: 'registered',
      created_at: sample1Created.toISOString(),
      expires_at: new Date(sample1Created.getTime() + THIRTY_DAYS_MS).toISOString(),
      completed_at: null
    },
    {
      id: 'wish_sample_2',
      author_id: 'user2',
      author_name: 'D',
      author_avatar: 'avatar_d.png',
      category: '맛있는 음식 먹기 🍰',
      content: '퇴근하고 같이 분위기 좋은 카페 가서 달콤한 딸기 케이크랑 커피 마시기 ☕',
      status: 'registered',
      created_at: sample2Created.toISOString(),
      expires_at: new Date(sample2Created.getTime() + THIRTY_DAYS_MS).toISOString(),
      completed_at: null
    }
  ];
}

// ==========================================================
// Supabase Cloud Integration
// ==========================================================
function loadSyncConfigFromStorage() {
  const saved = localStorage.getItem('two_wishes_supabase_config');
  if (saved) {
    try {
      appState.supabaseConfig = JSON.parse(saved);
      elements.supabaseUrl.value = appState.supabaseConfig.url || '';
      elements.supabaseKey.value = appState.supabaseConfig.key || '';
    } catch (e) {
      appState.supabaseConfig = { url: '', key: '' };
    }
  }
}

async function initSupabaseIfConfigured() {
  const { url, key } = appState.supabaseConfig;
  if (!url || !key || !window.supabase) {
    setOfflineSyncUI();
    return;
  }

  try {
    appState.supabaseClient = window.supabase.createClient(url, key);
    const { data, error } = await appState.supabaseClient
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase connect error:', error);
      setOfflineSyncUI();
      return;
    }

    appState.isOnlineSync = true;
    setOnlineSyncUI();
    appState.wishes = data || [];
    checkAndExpireWishes();
    renderWishes();
    updateStats();
    setupSupabaseRealtime();
    showToast('☁️ Supabase 실시간 동기화 연결 완료!');
  } catch (err) {
    console.error(err);
    setOfflineSyncUI();
  }
}

function setupSupabaseRealtime() {
  if (!appState.supabaseClient) return;

  if (appState.realtimeChannel) {
    appState.supabaseClient.removeChannel(appState.realtimeChannel);
  }

  appState.realtimeChannel = appState.supabaseClient
    .channel('public:wishes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wishes' },
      () => {
        fetchWishesFromSupabase();
      }
    )
    .subscribe();
}

async function fetchWishesFromSupabase() {
  if (!appState.supabaseClient) return;
  const { data, error } = await appState.supabaseClient
    .from('wishes')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data) {
    appState.wishes = data;
    checkAndExpireWishes();
    renderWishes();
    updateStats();
  }
}

function setOnlineSyncUI() {
  elements.syncIndicator.classList.remove('offline');
  elements.syncIndicator.classList.add('connected');
  elements.syncStatusText.textContent = '실시간 동기화 중';
}

function setOfflineSyncUI() {
  appState.isOnlineSync = false;
  elements.syncIndicator.classList.remove('connected');
  elements.syncIndicator.classList.add('offline');
  elements.syncStatusText.textContent = '동기화 설정';
}

// ==========================================================
// Wish Lifecycle & 30-Day Expiration Logic
// ==========================================================
function checkAndExpireWishes() {
  const now = Date.now();
  let updatedAny = false;

  appState.wishes.forEach(wish => {
    if (wish.status === 'registered') {
      const expTime = new Date(wish.expires_at).getTime();
      if (now >= expTime) {
        wish.status = 'expired';
        updatedAny = true;
        if (appState.isOnlineSync && appState.supabaseClient) {
          appState.supabaseClient
            .from('wishes')
            .update({ status: 'expired' })
            .eq('id', wish.id);
        }
      }
    }
  });

  if (updatedAny && !appState.isOnlineSync) {
    saveWishesToStorage();
  }
}

function startCountdownTicker() {
  setInterval(() => {
    checkAndExpireWishes();
    updateLiveTimers();
    updateStats();
  }, 10000);
}

function updateLiveTimers() {
  const timerElements = document.querySelectorAll('[data-wish-timer-id]');
  const now = Date.now();

  timerElements.forEach(el => {
    const wishId = el.getAttribute('data-wish-timer-id');
    const wish = appState.wishes.find(w => w.id === wishId);
    if (!wish) return;

    if (wish.status === 'registered') {
      const expTime = new Date(wish.expires_at).getTime();
      const diffMs = expTime - now;

      if (diffMs <= 0) {
        wish.status = 'expired';
        renderWishes();
        updateStats();
        return;
      }

      const { dDayStr, timerStr, percentElapsed } = calculateTimeInfo(wish.created_at, wish.expires_at);
      const cardEl = el.closest('.wish-card');
      if (cardEl) {
        const ddayBadge = cardEl.querySelector('.countdown-dday-badge');
        const timerLive = cardEl.querySelector('.countdown-timer-live');
        const barFill = cardEl.querySelector('.progress-bar-fill');

        if (ddayBadge) ddayBadge.textContent = dDayStr;
        if (timerLive) timerLive.textContent = timerStr;
        if (barFill) barFill.style.width = `${percentElapsed}%`;
      }
    }
  });
}

function calculateTimeInfo(createdAtStr, expiresAtStr) {
  const now = Date.now();
  const createdTime = new Date(createdAtStr).getTime();
  const expTime = new Date(expiresAtStr).getTime();
  const diffMs = expTime - now;
  const totalMs = expTime - createdTime || THIRTY_DAYS_MS;

  if (diffMs <= 0) {
    return {
      dDayStr: '소멸됨',
      timerStr: '30일 기한 만료',
      percentElapsed: 100,
      isExpired: true
    };
  }

  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let dDayStr = daysLeft === 0 ? 'D-Day' : `D-${daysLeft}`;
  let timerStr = `${daysLeft}일 ${hoursLeft}시간 ${minsLeft}분 남음`;

  const elapsedMs = Math.max(0, now - createdTime);
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)).toFixed(1);

  return {
    dDayStr,
    timerStr,
    percentElapsed,
    isExpired: false
  };
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// ==========================================================
// Rendering Wishes List
// ==========================================================
function renderWishes() {
  const container = elements.wishListContainer;
  container.innerHTML = '';

  const filtered = appState.wishes.filter(w => {
    if (appState.filterPerson !== 'all' && w.author_id !== appState.filterPerson) {
      return false;
    }
    if (appState.filterStatus !== 'all' && w.status !== appState.filterStatus) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    elements.emptyState.classList.remove('hidden');
    return;
  } else {
    elements.emptyState.classList.add('hidden');
  }

  filtered.forEach(wish => {
    const card = createWishCardElement(wish);
    container.appendChild(card);
  });
}

function createWishCardElement(wish) {
  const card = document.createElement('article');
  card.className = `wish-card ${wish.status}`;
  card.setAttribute('data-id', wish.id);

  // Status Badge Label
  let stageLabel = '등록(진행 중)';
  let stageClass = 'registered';
  let stageIcon = '⏳';
  if (wish.status === 'completed') {
    stageLabel = '완료됨';
    stageClass = 'completed';
    stageIcon = '🎉';
  } else if (wish.status === 'expired') {
    stageLabel = '소멸됨';
    stageClass = 'expired';
    stageIcon = '💨';
  }

  // Author details
  const authorProfile = appState.profiles[wish.author_id] || {
    name: wish.author_name,
    avatar: wish.author_avatar
  };

  // Time & Countdown details
  const timeInfo = calculateTimeInfo(wish.created_at, wish.expires_at);
  const createdDateStr = formatDate(wish.created_at);
  const expiresDateStr = formatDate(wish.expires_at);

  let countdownHeaderContent = '';
  let progressBarWidth = '0%';

  if (wish.status === 'registered') {
    countdownHeaderContent = `
      <div class="countdown-dday-row">
        <span class="countdown-dday-badge">${timeInfo.dDayStr}</span>
        <span class="countdown-timer-live">${timeInfo.timerStr}</span>
      </div>
    `;
    progressBarWidth = `${timeInfo.percentElapsed}%`;
  } else if (wish.status === 'completed') {
    const completedDateStr = formatDate(wish.completed_at || new Date().toISOString());
    countdownHeaderContent = `
      <div class="countdown-dday-row">
        <span class="countdown-dday-badge">소원 이룸! 💖</span>
        <span class="countdown-timer-live">${completedDateStr} 달성</span>
      </div>
    `;
    progressBarWidth = '100%';
  } else {
    // expired
    countdownHeaderContent = `
      <div class="countdown-dday-row">
        <span class="countdown-dday-badge">기한 종료 💨</span>
        <span class="countdown-timer-live">30일 만료되어 소멸</span>
      </div>
    `;
    progressBarWidth = '100%';
  }

  // Action Button
  let actionButtonHtml = '';
  if (wish.status === 'registered') {
    actionButtonHtml = `
      <button class="btn-card-action btn-complete-wish" data-action="complete" data-id="${wish.id}">
        <span>✔️ 소원 이루기(완료)</span>
      </button>
    `;
  } else if (wish.status === 'completed') {
    actionButtonHtml = `
      <button class="btn-card-action btn-reopen-wish" data-action="reopen" data-id="${wish.id}">
        <span>↩️ 다시 진행 중으로</span>
      </button>
    `;
  } else {
    actionButtonHtml = `
      <button class="btn-card-action btn-reopen-wish" data-action="reopen" data-id="${wish.id}">
        <span>✨ 30일 재등록하기</span>
      </button>
    `;
  }

  const isEditing = appState.editingWishId === wish.id;

  let contentHtml = '';
  if (isEditing) {
    contentHtml = `
      <div class="inline-edit-area">
        <textarea class="inline-edit-textarea" id="editContent_${wish.id}" maxlength="300">${escapeHtml(wish.content || '')}</textarea>
        <div class="inline-edit-actions">
          <button type="button" class="btn-inline-cancel" data-action="cancel-edit" data-id="${wish.id}">취소</button>
          <button type="button" class="btn-inline-save" data-action="save-edit" data-id="${wish.id}">저장</button>
        </div>
      </div>
    `;
  } else {
    if (wish.content && wish.content.trim()) {
      contentHtml = `<div class="wish-content-text">${escapeHtml(wish.content)}</div>`;
    } else {
      contentHtml = `
        <div class="wish-content-text empty-prompt" data-action="edit" data-id="${wish.id}" title="클릭하여 소원 내용 작성">
          ✏️ 소원 내용을 작성해보세요
        </div>
      `;
    }
  }

  card.innerHTML = `
    <div>
      <div class="wish-card-header">
        <span class="author-badge">
          <span>${renderAvatarHtml(authorProfile.avatar, authorProfile.name)}</span>
          <span>${escapeHtml(authorProfile.name)}</span>
        </span>
        <span class="stage-badge ${stageClass}">
          <span>${stageIcon}</span>
          <span>${stageLabel}</span>
        </span>
      </div>

      <div class="wish-category-tag">${escapeHtml(wish.category || '소원')}</div>
      ${contentHtml}
    </div>

    <div>
      <!-- 30-Day Countdown Box -->
      <div class="countdown-box ${wish.status}" data-wish-timer-id="${wish.id}">
        ${countdownHeaderContent}
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressBarWidth};"></div>
        </div>
        <div class="dates-meta-row">
          <span>등록: ${createdDateStr}</span>
          <span>소멸 예정: ${expiresDateStr}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-actions-row">
        ${actionButtonHtml}
        <button class="btn-edit-wish" data-action="edit" data-id="${wish.id}" title="소원 내용 작성/수정">
          ✏️
        </button>
        <button class="btn-delete-wish" data-action="delete" data-id="${wish.id}" title="소원 삭제">
          🗑️
        </button>
      </div>
    </div>
  `;

  return card;
}

// ==========================================================
// Stats Calculation & Display
// ==========================================================
function updateStats() {
  const total = appState.wishes.length;
  const active = appState.wishes.filter(w => w.status === 'registered').length;
  const completed = appState.wishes.filter(w => w.status === 'completed').length;
  const expired = appState.wishes.filter(w => w.status === 'expired').length;

  elements.statActive.textContent = active;
  elements.statActiveSmall.textContent = active;
  elements.statTotal.textContent = total;
  elements.statCompleted.textContent = completed;
  elements.statExpired.textContent = expired;

  elements.chipAllCount.textContent = total;
  elements.chipRegCount.textContent = active;
  elements.chipCompCount.textContent = completed;
  elements.chipExpCount.textContent = expired;

  const u1Active = appState.wishes.filter(w => w.author_id === 'user1' && w.status === 'registered').length;
  const u1Comp = appState.wishes.filter(w => w.author_id === 'user1' && w.status === 'completed').length;
  elements.user1StatCount.textContent = `진행 ${u1Active} · 완료 ${u1Comp}`;

  const u2Active = appState.wishes.filter(w => w.author_id === 'user2' && w.status === 'registered').length;
  const u2Comp = appState.wishes.filter(w => w.author_id === 'user2' && w.status === 'completed').length;
  elements.user2StatCount.textContent = `진행 ${u2Active} · 완료 ${u2Comp}`;
}

// ==========================================================
// Wish Add, Complete, Delete Actions
// ==========================================================
async function handleAddWish(e) {
  e.preventDefault();
  const content = elements.wishContent.value.trim();

  // Registration Date from Input (Date only)
  let createdDate = new Date();
  if (elements.wishCreatedAt && elements.wishCreatedAt.value) {
    const val = elements.wishCreatedAt.value;
    const parsed = new Date(val + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      const now = new Date();
      if (toLocalDateInputValue(now) === val) {
        createdDate = now;
      } else {
        createdDate = parsed;
      }
    }
  }
  const expiresAt = new Date(createdDate.getTime() + THIRTY_DAYS_MS);

  const authorId = appState.selectedAuthor;
  const authorProfile = appState.profiles[authorId];

  const newWish = {
    id: 'wish_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    author_id: authorId,
    author_name: authorProfile.name,
    author_avatar: authorProfile.avatar,
    category: elements.wishCategory.value,
    content: content,
    status: 'registered',
    created_at: createdDate.toISOString(),
    expires_at: expiresAt.toISOString(),
    completed_at: null
  };

  appState.wishes.unshift(newWish);

  if (appState.isOnlineSync && appState.supabaseClient) {
    try {
      const { error } = await appState.supabaseClient
        .from('wishes')
        .insert([newWish]);
      if (error) {
        console.error('Supabase insert error:', error);
        showToast('온라인 저장 실패. 로컬에 저장되었습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    saveWishesToStorage();
  }

  elements.wishContent.value = '';
  elements.charCount.textContent = '0';
  initWishDateField();

  checkAndExpireWishes();
  renderWishes();
  updateStats();
  showToast('소원이 성공적으로 등록되었습니다! 30일 카운트다운 시작 ✨');

  // 등록 후 소원 보기 화면으로 자동 이동
  setTimeout(() => navigateToScreen('screen-list'), 600);
}

async function handleSaveEditWish(wishId) {
  const textarea = document.getElementById(`editContent_${wishId}`);
  if (!textarea) return;
  const newContent = textarea.value.trim();

  const wish = appState.wishes.find(w => w.id === wishId);
  if (!wish) return;

  wish.content = newContent;
  appState.editingWishId = null;

  if (appState.isOnlineSync && appState.supabaseClient) {
    await appState.supabaseClient
      .from('wishes')
      .update({ content: wish.content })
      .eq('id', wishId);
  } else {
    saveWishesToStorage();
  }

  renderWishes();
  showToast('소원 내용이 저장되었습니다! 📝');
}

function handleCancelEditWish() {
  appState.editingWishId = null;
  renderWishes();
}

async function handleCompleteWish(wishId) {
  const wish = appState.wishes.find(w => w.id === wishId);
  if (!wish) return;

  wish.status = 'completed';
  wish.completed_at = new Date().toISOString();

  if (appState.isOnlineSync && appState.supabaseClient) {
    await appState.supabaseClient
      .from('wishes')
      .update({ status: 'completed', completed_at: wish.completed_at })
      .eq('id', wishId);
  } else {
    saveWishesToStorage();
  }

  renderWishes();
  updateStats();
  showToast('소원을 이루었습니다! 축하합니다 🎉');
}

async function handleReopenWish(wishId) {
  const wish = appState.wishes.find(w => w.id === wishId);
  if (!wish) return;

  const now = new Date();
  wish.status = 'registered';
  wish.created_at = now.toISOString();
  wish.expires_at = new Date(now.getTime() + THIRTY_DAYS_MS).toISOString();
  wish.completed_at = null;

  if (appState.isOnlineSync && appState.supabaseClient) {
    await appState.supabaseClient
      .from('wishes')
      .update({
        status: 'registered',
        created_at: wish.created_at,
        expires_at: wish.expires_at,
        completed_at: null
      })
      .eq('id', wishId);
  } else {
    saveWishesToStorage();
  }

  renderWishes();
  updateStats();
  showToast('소원이 다시 진행 중으로 등록되었습니다! (새 30일 시작) ⏳');
}

async function handleDeleteWish(wishId) {
  if (!confirm('이 소원을 정말 삭제하시겠습니까?')) return;

  appState.wishes = appState.wishes.filter(w => w.id !== wishId);

  if (appState.isOnlineSync && appState.supabaseClient) {
    await appState.supabaseClient
      .from('wishes')
      .delete()
      .eq('id', wishId);
  } else {
    saveWishesToStorage();
  }

  renderWishes();
  updateStats();
  showToast('소원이 삭제되었습니다.');
}

// ==========================================================
// Event Listeners
// ==========================================================
function initEventHandlers() {
  elements.btnAuthor1.addEventListener('click', () => {
    appState.selectedAuthor = 'user1';
    elements.btnAuthor1.classList.add('active');
    elements.btnAuthor2.classList.remove('active');
    elements.wishAuthor.value = 'user1';
  });

  elements.btnAuthor2.addEventListener('click', () => {
    appState.selectedAuthor = 'user2';
    elements.btnAuthor2.classList.add('active');
    elements.btnAuthor1.classList.remove('active');
    elements.wishAuthor.value = 'user2';
  });

  // Date Picker Change -> Update Expiry preview
  if (elements.wishCreatedAt) {
    elements.wishCreatedAt.addEventListener('change', updateExpiryPreview);
    elements.wishCreatedAt.addEventListener('input', updateExpiryPreview);
  }

  elements.wishContent.addEventListener('input', (e) => {
    elements.charCount.textContent = e.target.value.length;
  });

  elements.wishForm.addEventListener('submit', handleAddWish);

  elements.wishListContainer.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const wishId = target.getAttribute('data-id');

    if (action === 'complete') {
      handleCompleteWish(wishId);
    } else if (action === 'reopen') {
      handleReopenWish(wishId);
    } else if (action === 'delete') {
      handleDeleteWish(wishId);
    } else if (action === 'edit') {
      appState.editingWishId = wishId;
      renderWishes();
      const editArea = document.getElementById(`editContent_${wishId}`);
      if (editArea) editArea.focus();
    } else if (action === 'save-edit') {
      handleSaveEditWish(wishId);
    } else if (action === 'cancel-edit') {
      handleCancelEditWish();
    }
  });

  const personTabs = document.querySelectorAll('#personTabs .tab-btn');
  personTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      personTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      appState.filterPerson = tab.getAttribute('data-person-filter');
      renderWishes();
    });
  });

  const statusChips = document.querySelectorAll('#statusFilters .filter-chip');
  statusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      statusChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.filterStatus = chip.getAttribute('data-status-filter');
      renderWishes();
    });
  });

  elements.btnOpenProfiles.addEventListener('click', openProfileModal);
  elements.btnSaveProfiles.addEventListener('click', handleSaveProfiles);

  elements.btnOpenSync.addEventListener('click', () => {
    elements.modalSync.classList.remove('hidden');
  });

  elements.btnSaveSync.addEventListener('click', handleSaveSync);
  elements.btnDisconnectSync.addEventListener('click', handleDisconnectSync);
  elements.btnCopySql.addEventListener('click', handleCopySql);

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) targetModal.classList.add('hidden');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  initEmojiPickers();
}

function openProfileModal() {
  elements.inputUser1Name.value = appState.profiles.user1.name;
  elements.inputUser2Name.value = appState.profiles.user2.name;

  setSelectedEmoji('user1EmojiRow', appState.profiles.user1.avatar);
  setSelectedEmoji('user2EmojiRow', appState.profiles.user2.avatar);

  elements.modalProfiles.classList.remove('hidden');
}

function setSelectedEmoji(rowId, avatarValue) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.querySelectorAll('.emoji-opt').forEach(opt => {
    if (opt.getAttribute('data-emoji') === avatarValue) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

function initEmojiPickers() {
  ['user1EmojiRow', 'user2EmojiRow'].forEach(rowId => {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.addEventListener('click', (e) => {
      const opt = e.target.closest('.emoji-opt');
      if (!opt) return;
      row.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });
}

function handleSaveProfiles() {
  const u1Name = elements.inputUser1Name.value.trim() || 'R';
  const u2Name = elements.inputUser2Name.value.trim() || 'D';

  const u1Avatar = document.querySelector('#user1EmojiRow .emoji-opt.active')?.getAttribute('data-emoji') || 'avatar_r.png';
  const u2Avatar = document.querySelector('#user2EmojiRow .emoji-opt.active')?.getAttribute('data-emoji') || 'avatar_d.png';

  appState.profiles = {
    user1: { name: u1Name, avatar: u1Avatar },
    user2: { name: u2Name, avatar: u2Avatar }
  };

  saveProfilesToStorage();
  elements.modalProfiles.classList.add('hidden');
}

async function handleSaveSync() {
  const url = elements.supabaseUrl.value.trim();
  const key = elements.supabaseKey.value.trim();

  if (!url || !key) {
    alert('Supabase Project URL과 Anon Key를 모두 입력해주세요.');
    return;
  }

  appState.supabaseConfig = { url, key };
  localStorage.setItem('two_wishes_supabase_config', JSON.stringify(appState.supabaseConfig));

  elements.modalSync.classList.add('hidden');
  showToast('Supabase 설정을 저장하고 연결을 시도합니다...');
  await initSupabaseIfConfigured();
}

function handleDisconnectSync() {
  appState.supabaseConfig = { url: '', key: '' };
  localStorage.removeItem('two_wishes_supabase_config');
  if (appState.supabaseClient && appState.realtimeChannel) {
    appState.supabaseClient.removeChannel(appState.realtimeChannel);
  }
  appState.supabaseClient = null;
  setOfflineSyncUI();
  loadWishesFromStorage();
  elements.modalSync.classList.add('hidden');
  showToast('로컬 저장소 전용 모드로 전환되었습니다.');
}

function handleCopySql() {
  const code = document.querySelector('#sqlSnippet code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    showToast('SQL 코드가 클립보드에 복사되었습니다! 📋');
  }).catch(() => {
    showToast('클립보드 복사 실패. 직접 선택하여 복사해주세요.');
  });
}

// ==========================================================
// Utilities
// ==========================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimer = null;
function showToast(message) {
  const toast = elements.toast;
  toast.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}
