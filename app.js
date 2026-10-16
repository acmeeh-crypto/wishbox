/* ==========================================================
   우리 둘의 소원 보관함 - App Logic
   ========================================================== */

// 30 Days in Milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Default Profiles (R & D with Emoji Avatars)
const DEFAULT_PROFILES = {
  user1: { name: 'R', avatar: '🐰' },
  user2: { name: 'D', avatar: '🐻' }
};

// Global State
let appState = {
  profiles: { ...DEFAULT_PROFILES },
  wishes: [],
  selectedAuthor: 'user1',
  acquireAuthor: 'user1',
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
  // Home (디데이 10일 이하 소원)
  homeDdayList: document.getElementById('homeDdayList'),
  homeDdayCount: document.getElementById('homeDdayCount'),
  btnOpenMinigame: document.getElementById('btnOpenMinigame'),
  // Stats (사용자별 획득/등록/완료/소멸)
  user1StatAvatar: document.getElementById('user1StatAvatar'),
  user1StatName: document.getElementById('user1StatName'),
  user2StatAvatar: document.getElementById('user2StatAvatar'),
  user2StatName: document.getElementById('user2StatName'),
  // Acquire (소원 획득)
  acquireUser1Avatar: document.getElementById('acquireUser1Avatar'),
  acquireUser1Name: document.getElementById('acquireUser1Name'),
  acquireUser2Avatar: document.getElementById('acquireUser2Avatar'),
  acquireUser2Name: document.getElementById('acquireUser2Name'),
  btnAcquireLamp: document.getElementById('btnAcquireLamp'),
  lampBoard: document.getElementById('lampBoard'),
  // Form
  wishForm: document.getElementById('wishForm'),
  wishAuthor: document.getElementById('wishAuthor'),
  registerLampInfo: document.getElementById('registerLampInfo'),
  btnSubmitWish: document.getElementById('btnSubmitWish'),
  lampCountBadge1: document.getElementById('lampCountBadge1'),
  lampCountBadge2: document.getElementById('lampCountBadge2'),
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
  'screen-acquire':  '✨ 소원 획득',
  'screen-register': '💌 소원 등록',
  'screen-list':     '📜 소원 보기',
};

let currentScreen = 'screen-home';

function navigateToScreen(screenId) {
  if (screenId === currentScreen) return;
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

  // Toggle home screen class
  const isHome = screenId === 'screen-home';
  document.documentElement.classList.toggle('is-home-screen', isHome);
  document.body.classList.toggle('is-home-screen', isHome);
  window.scrollTo(0, 0);

  // Update header UI
  const headerLogo = document.getElementById('headerLogo');
  const headerScreenTitle = document.getElementById('headerScreenTitle');
  const headerActions = document.querySelector('.header-actions');

  if (screenId === 'screen-home') {
    if (headerLogo) headerLogo.classList.remove('hidden');
    if (headerScreenTitle) { headerScreenTitle.classList.add('hidden'); headerScreenTitle.textContent = ''; }
    if (headerActions) headerActions.classList.remove('hidden');
  } else {
    if (headerLogo) headerLogo.classList.add('hidden');
    if (headerScreenTitle) { headerScreenTitle.classList.remove('hidden'); headerScreenTitle.textContent = SCREEN_TITLES[screenId] || ''; }
    if (headerActions) headerActions.classList.add('hidden');
  }

  // Update GNB active tab
  document.querySelectorAll('.bottom-gnb .gnb-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-target-screen') === screenId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function goHome() {
  navigateToScreen('screen-home');
}

function initNavigation() {
  const isHome = currentScreen === 'screen-home';
  document.documentElement.classList.toggle('is-home-screen', isHome);
  document.body.classList.toggle('is-home-screen', isHome);

  const bottomGnb = document.querySelector('.bottom-gnb');
  if (bottomGnb) {
    bottomGnb.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  // GNB tabs and inline dynamic buttons → navigate to screen (delegation)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target-screen]');
    if (!btn) return;
    navigateToScreen(btn.getAttribute('data-target-screen'));
  });
}

// ==========================================================
// Initializer
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadProfilesFromStorage();
  loadSyncConfigFromStorage();
  initEventHandlers();
  initNavigation();
  initSpaceAdventureIntegration();
  initSupabaseIfConfigured();
  if (!appState.isOnlineSync) {
    loadWishesFromStorage();
  }
  startCountdownTicker();
});

// Helper: Render avatar as img tag if image path, or text/emoji
function renderAvatarHtml(avatarValue, nameStr = '') {
  if (!avatarValue) return '✨';
  // Fallbacks if previous avatar files were saved in storage
  if (avatarValue === 'avatar_r.png') return '🐰';
  if (avatarValue === 'avatar_d.png') return '🐻';
  if (
    avatarValue.startsWith('data:image/') ||
    avatarValue.endsWith('.png') ||
    avatarValue.endsWith('.jpg') ||
    avatarValue.endsWith('.jpeg') ||
    avatarValue.endsWith('.webp')
  ) {
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

// Helper: 'YYYY-MM-DD' → 해당 날짜 00:00 (로컬) Date
function parseDateInputValue(val) {
  const parsed = new Date(val + 'T00:00:00');
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper: 획득일로부터 30일 뒤 소멸일 계산
function calcLampExpiry(acquiredDate) {
  return new Date(acquiredDate.getTime() + THIRTY_DAYS_MS);
}

// ==========================================================
// Wish Stage Helpers
//   acquired   : 획득(램프 보유 중, 내용 미정)
//   registered : 등록(내용 작성 완료, 진행 중)
//   completed  : 완료
//   expired    : 소멸 (registered_at 없으면 '램프 소멸', 있으면 '등록 소원 소멸')
// ==========================================================
function getAcquiredAt(wish) {
  return wish.acquired_at || wish.created_at;
}

// 램프 단계(획득 또는 미등록 소멸)인지 여부
function isLampRecord(wish) {
  return wish.status === 'acquired' || (wish.status === 'expired' && !wish.registered_at);
}

// 해당 사용자가 보유 중인 램프 (먼저 획득한 순)
function getActiveLamps(authorId) {
  return appState.wishes
    .filter(w => w.status === 'acquired' && (!authorId || w.author_id === authorId))
    .sort((a, b) => new Date(getAcquiredAt(a)) - new Date(getAcquiredAt(b)));
}

// 기존 데이터(획득 단계 도입 이전)를 새 구조로 보정
function normalizeWishes(list) {
  (list || []).forEach(w => {
    if (!w.acquired_at) {
      w.acquired_at = w.created_at;
      if (w.status !== 'acquired' && w.registered_at === undefined) {
        w.registered_at = w.created_at;
      }
    }
  });
  return list;
}

// ==========================================================
// Profile Management
// ==========================================================
function loadProfilesFromStorage() {
  const saved = localStorage.getItem('two_wishes_profiles');
  if (saved) {
    try {
      appState.profiles = JSON.parse(saved);
      // Migrate old defaults to R & D with emojis if user hasn't explicitly customized
      if (appState.profiles.user1.name === '로빈' || appState.profiles.user1.name === '사용자 1' || appState.profiles.user1.name === '대원 1') {
        appState.profiles.user1.name = 'R';
      }
      if (appState.profiles.user1.avatar === 'avatar_r.png') {
        appState.profiles.user1.avatar = '🐰';
      }
      if (appState.profiles.user2.name === '연주' || appState.profiles.user2.name === '사용자 2' || appState.profiles.user2.name === '대원 2') {
        appState.profiles.user2.name = 'D';
      }
      if (appState.profiles.user2.avatar === 'avatar_d.png') {
        appState.profiles.user2.avatar = '🐻';
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
  renderAll();
  showToast('프로필 정보가 저장되었습니다! ✨');
}

function renderProfileUI() {
  const { user1, user2 } = appState.profiles;
  // Form Author buttons
  elements.avatarPreview1.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.namePreview1.textContent = user1.name;
  elements.avatarPreview2.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.namePreview2.textContent = user2.name;

  // Acquire Author buttons
  elements.acquireUser1Avatar.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.acquireUser1Name.textContent = user1.name;
  elements.acquireUser2Avatar.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.acquireUser2Name.textContent = user2.name;

  // Tabs
  elements.tabUser1Avatar.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.tabUser1Name.textContent = `${user1.name}의 소원`;
  elements.tabUser2Avatar.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.tabUser2Name.textContent = `${user2.name}의 소원`;

  // Stats (사용자별 카드)
  elements.user1StatAvatar.innerHTML = renderAvatarHtml(user1.avatar, user1.name);
  elements.user1StatName.textContent = user1.name;
  elements.user2StatAvatar.innerHTML = renderAvatarHtml(user2.avatar, user2.name);
  elements.user2StatName.textContent = user2.name;
}

// 모든 화면 다시 그리기
function renderAll() {
  renderHomeDday();
  renderWishes();
  renderLamps();
  updateRegisterPanel();
  updateStats();
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
        if (w.author_avatar === 'avatar_r.png') {
          w.author_avatar = appState.profiles.user1.avatar || '🐰';
        }
        if (w.author_avatar === 'avatar_d.png') {
          w.author_avatar = appState.profiles.user2.avatar || '🐻';
        }
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
  normalizeWishes(appState.wishes);
  checkAndExpireWishes();
  renderAll();
}

function saveWishesToStorage() {
  localStorage.setItem('two_wishes_list', JSON.stringify(appState.wishes));
}

function getStarterSampleWishes() {
  const DAY = 24 * 60 * 60 * 1000;
  const today = parseDateInputValue(toLocalDateInputValue(new Date()));
  const daysAgo = (n) => new Date(today.getTime() - n * DAY);
  const sample1Acquired = daysAgo(22); // D-8 예시
  const sample2Acquired = daysAgo(5);
  const lamp1Acquired = daysAgo(25);   // D-5 예시
  const lamp2Acquired = daysAgo(1);
  const lamp3Acquired = daysAgo(3);

  const makeLamp = (id, authorId, acquired) => ({
    id,
    author_id: authorId,
    author_name: DEFAULT_PROFILES[authorId].name,
    author_avatar: DEFAULT_PROFILES[authorId].avatar,
    category: '',
    content: '',
    status: 'acquired',
    created_at: acquired.toISOString(),
    acquired_at: acquired.toISOString(),
    registered_at: null,
    expires_at: calcLampExpiry(acquired).toISOString(),
    completed_at: null
  });

  return [
    {
      id: 'wish_sample_1',
      author_id: 'user1',
      author_name: 'R',
      author_avatar: '🐰',
      category: '데이트 / 놀기 🎡',
      content: '이번 주말에 날씨 좋으면 한강 공원에서 피크닉하고 돗자리 펴서 낮잠 자기 🌸',
      status: 'registered',
      created_at: sample1Acquired.toISOString(),
      acquired_at: sample1Acquired.toISOString(),
      registered_at: new Date().toISOString(),
      expires_at: calcLampExpiry(sample1Acquired).toISOString(),
      completed_at: null
    },
    {
      id: 'wish_sample_2',
      author_id: 'user2',
      author_name: 'D',
      author_avatar: '🐻',
      category: '맛있는 음식 먹기 🍰',
      content: '퇴근하고 같이 분위기 좋은 카페 가서 달콤한 딸기 케이크랑 커피 마시기 ☕',
      status: 'registered',
      created_at: sample2Acquired.toISOString(),
      acquired_at: sample2Acquired.toISOString(),
      registered_at: new Date().toISOString(),
      expires_at: calcLampExpiry(sample2Acquired).toISOString(),
      completed_at: null
    },
    makeLamp('lamp_sample_1', 'user1', lamp1Acquired),
    makeLamp('lamp_sample_2', 'user1', lamp2Acquired),
    makeLamp('lamp_sample_3', 'user2', lamp3Acquired)
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
    // URL 정제 (끝부분 공백 및 슬래시 제거)
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = key.trim();

    appState.supabaseClient = window.supabase.createClient(cleanUrl, cleanKey);
    const { data, error } = await appState.supabaseClient
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase connect error:', error);
      setOfflineSyncUI();
      if (error.code === '42P01' || error.message?.includes('wishes') || error.message?.includes('relation')) {
        alert('⚠️ 동기화 실패: DB에 "wishes" 테이블이 없습니다.\nSupabase SQL Editor에서 제공된 SQL을 먼저 실행해주세요!');
      } else if (error.message?.includes('JWT') || error.message?.includes('apiKey') || error.code === 'PGRST301') {
        alert('⚠️ 동기화 실패: Anon Key가 올바르지 않습니다.\neyJ로 시작하는 긴 키를 정확히 입력했는지 확인해주세요.');
      } else {
        alert('⚠️ 동기화 실패: ' + (error.message || '연결에 실패했습니다. URL과 키를 확인해주세요.'));
      }
      return;
    }

    appState.isOnlineSync = true;
    setOnlineSyncUI();
    appState.wishes = normalizeWishes(data || []);
    checkAndExpireWishes();
    renderAll();
    setupSupabaseRealtime();
    showToast('☁️ Supabase 실시간 동기화 연결 완료!');
  } catch (err) {
    console.error(err);
    setOfflineSyncUI();
    alert('⚠️ 연결 오류 발생: ' + (err.message || '인터넷 연결 또는 Supabase URL 형식을 확인해주세요.'));
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
    appState.wishes = normalizeWishes(data);
    checkAndExpireWishes();
    renderAll();
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
    // 획득(램프)·등록 단계 모두 소멸일이 지나면 소멸 처리
    if (wish.status === 'registered' || wish.status === 'acquired') {
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
  return updatedAny;
}

function startCountdownTicker() {
  setInterval(() => {
    if (checkAndExpireWishes()) {
      renderAll();
    } else {
      updateLiveTimers();
      updateStats();
    }
  }, 10000);
}

function updateLiveTimers() {
  // 등록/홈 소원 카드 타이머
  document.querySelectorAll('[data-wish-timer-id]').forEach(el => {
    const wishId = el.getAttribute('data-wish-timer-id');
    const wish = appState.wishes.find(w => w.id === wishId);
    if (!wish || (wish.status !== 'registered' && wish.status !== 'acquired')) return;

    const { dDayStr, timerStr, percentElapsed } = calculateTimeInfo(getAcquiredAt(wish), wish.expires_at);
    const cardEl = el.closest('.wish-card');
    if (cardEl) {
      const ddayBadge = cardEl.querySelector('.countdown-dday-badge');
      const timerLive = cardEl.querySelector('.countdown-timer-live');
      const barFill = cardEl.querySelector('.progress-bar-fill');

      if (ddayBadge) ddayBadge.textContent = dDayStr;
      if (timerLive) timerLive.textContent = timerStr;
      if (barFill) barFill.style.width = `${percentElapsed}%`;
    }
  });

  // 램프 카드 D-Day
  document.querySelectorAll('[data-lamp-timer-id]').forEach(el => {
    const lamp = appState.wishes.find(w => w.id === el.getAttribute('data-lamp-timer-id'));
    if (!lamp || lamp.status !== 'acquired') return;
    el.textContent = calculateTimeInfo(getAcquiredAt(lamp), lamp.expires_at).dDayStr;
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
      daysLeft: -1,
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
    daysLeft,
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
// Persistence Helpers (로컬스토리지 / Supabase 공통)
// ==========================================================
async function persistInsert(wish) {
  if (appState.isOnlineSync && appState.supabaseClient) {
    const { error } = await appState.supabaseClient.from('wishes').insert([wish]);
    if (error) {
      console.error('Supabase insert error:', error);
      showToast('온라인 저장 실패. 다시 시도해주세요.');
    }
  } else {
    saveWishesToStorage();
  }
}

async function persistUpdate(wishId, fields) {
  if (appState.isOnlineSync && appState.supabaseClient) {
    const { error } = await appState.supabaseClient.from('wishes').update(fields).eq('id', wishId);
    if (error) {
      console.error('Supabase update error:', error);
      showToast('온라인 저장 실패. 다시 시도해주세요.');
    }
  } else {
    saveWishesToStorage();
  }
}

async function persistDelete(wishId) {
  if (appState.isOnlineSync && appState.supabaseClient) {
    await appState.supabaseClient.from('wishes').delete().eq('id', wishId);
  } else {
    saveWishesToStorage();
  }
}

// ==========================================================
// Home Screen: 디데이가 10일 이하로 남은 소원 (획득 + 등록 모두)
// ==========================================================
function renderHomeDday() {
  const container = elements.homeDdayList;
  if (!container) return;

  const urgentWishes = appState.wishes
    .filter(w => {
      if (w.status !== 'registered' && w.status !== 'acquired') return false;
      const info = calculateTimeInfo(getAcquiredAt(w), w.expires_at);
      return !info.isExpired && info.daysLeft <= 10;
    })
    .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));

  if (elements.homeDdayCount) {
    elements.homeDdayCount.textContent = `${urgentWishes.length}개`;
  }

  if (urgentWishes.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = urgentWishes.map(wish => {
    const authorProfile = appState.profiles[wish.author_id] || {
      name: wish.author_name,
      avatar: wish.author_avatar
    };
    const timeInfo = calculateTimeInfo(getAcquiredAt(wish), wish.expires_at);
    const acquiredDateStr = formatDate(getAcquiredAt(wish));
    const expiresDateStr = formatDate(wish.expires_at);
    const isAcquired = wish.status === 'acquired';

    const stageClass = isAcquired ? 'acquired' : 'registered';
    const stageIcon = isAcquired ? '✨' : '⏳';
    const stageLabel = isAcquired ? '획득(미등록)' : '등록(진행 중)';
    const categoryText = isAcquired ? '✨ 미등록 소원' : (wish.category || '소원');
    const contentText = isAcquired
      ? '아직 소원 내용이 등록되지 않았어요. 눌러서 소원을 등록해보세요!'
      : (wish.content && wish.content.trim() ? wish.content : '소원 내용을 작성해보세요');
    const gotoHint = isAcquired ? '💌 소원 등록하러 가기 →' : '📜 소원 보기로 이동 →';

    return `
      <article class="wish-card ${wish.status} author-${wish.author_id} home-dday-card"
        data-home-wish-id="${escapeHtml(wish.id)}"
        data-home-wish-status="${escapeHtml(wish.status)}"
        data-home-wish-author="${escapeHtml(wish.author_id)}">
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
          <div class="wish-category-tag">${escapeHtml(categoryText)}</div>
          <div class="wish-content-text">${escapeHtml(contentText)}</div>
        </div>
        <div>
          <div class="countdown-box registered" data-wish-timer-id="${escapeHtml(wish.id)}">
            <div class="countdown-dday-row">
              <span class="countdown-dday-badge">${timeInfo.dDayStr}</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${timeInfo.percentElapsed}%;"></div>
            </div>
            <div class="dates-meta-list">
              <div class="date-meta-item">획득: ${acquiredDateStr}</div>
              <div class="date-meta-item">소멸 예정: ${expiresDateStr}</div>
            </div>
          </div>
          <div class="home-dday-goto-hint">${gotoHint}</div>
        </div>
      </article>
    `;
  }).join('');
}

// ==========================================================
// Rendering Wishes List (등록된 소원만: 등록/완료/소멸)
// ==========================================================
function getRegisteredWishes() {
  return appState.wishes
    .filter(w => !isLampRecord(w))
    .sort((a, b) => new Date(b.registered_at || b.created_at) - new Date(a.registered_at || a.created_at));
}

function renderWishes() {
  const container = elements.wishListContainer;
  container.innerHTML = '';

  const filtered = getRegisteredWishes().filter(w => {
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
  card.className = `wish-card ${wish.status} author-${wish.author_id}`;
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

  // Time & Countdown details (소멸 기한은 램프 획득일 기준)
  const timeInfo = calculateTimeInfo(getAcquiredAt(wish), wish.expires_at);
  const acquiredDateStr = formatDate(getAcquiredAt(wish));
  const registeredDateStr = formatDate(wish.registered_at || wish.created_at);
  const expiresDateStr = formatDate(wish.expires_at);

  let countdownHeaderContent = '';
  let progressBarWidth = '0%';

  if (wish.status === 'registered') {
    countdownHeaderContent = `
      <div class="countdown-dday-row">
        <span class="countdown-dday-badge">${timeInfo.dDayStr}</span>
      </div>
    `;
    progressBarWidth = `${timeInfo.percentElapsed}%`;
  } else if (wish.status === 'completed') {
    countdownHeaderContent = `
      <div class="countdown-dday-row">
        <span class="countdown-dday-badge">소원 이룸! 💖</span>
      </div>
    `;
    progressBarWidth = '100%';
  } else {
    // expired
    countdownHeaderContent = `
      <div class="countdown-dday-row">
        <span class="countdown-dday-badge">기한 종료 💨</span>
      </div>
    `;
    progressBarWidth = '100%';
  }

  // Action Button (소원 완료 및 완료 취소)
  let actionButtonHtml = '';
  if (wish.status === 'registered') {
    actionButtonHtml = `
      <button class="btn-card-action btn-complete-wish" data-action="toggle-complete" data-id="${wish.id}">
        <span>✔️ 소원 완료</span>
      </button>
    `;
  } else if (wish.status === 'completed') {
    actionButtonHtml = `
      <button class="btn-card-action btn-reopen-wish" data-action="toggle-complete" data-id="${wish.id}">
        <span>↩️ 완료 취소</span>
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
        <div class="dates-meta-list">
          <div class="date-meta-item">획득: ${acquiredDateStr}</div>
          <div class="date-meta-item">등록: ${registeredDateStr}</div>
          <div class="date-meta-item">소멸 예정: ${expiresDateStr}</div>
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
// Stats Calculation & Display (사용자별 획득/등록/완료/소멸)
// ==========================================================
function getUserStageCounts(authorId) {
  const mine = appState.wishes.filter(w => w.author_id === authorId);
  return {
    acquired: mine.filter(w => w.status === 'acquired').length,
    registered: mine.filter(w => w.status === 'registered').length,
    completed: mine.filter(w => w.status === 'completed').length,
    expired: mine.filter(w => w.status === 'expired').length
  };
}

function updateStats() {
  ['user1', 'user2'].forEach(uid => {
    const c = getUserStageCounts(uid);
    const set = (key, val) => {
      const el = document.getElementById(`${uid}Stat_${key}`);
      if (el) el.textContent = val;
    };
    set('acquired', c.acquired);
    set('registered', c.registered);
    set('completed', c.completed);
    set('expired', c.expired);
  });

  // 소원 보기 필터 칩 (등록된 소원 기준)
  const registeredWishes = getRegisteredWishes();
  elements.chipAllCount.textContent = registeredWishes.length;
  elements.chipRegCount.textContent = registeredWishes.filter(w => w.status === 'registered').length;
  elements.chipCompCount.textContent = registeredWishes.filter(w => w.status === 'completed').length;
  elements.chipExpCount.textContent = registeredWishes.filter(w => w.status === 'expired').length;
}

// ==========================================================
// 소원 획득
// ==========================================================
function renderLamps() {
  const board = elements.lampBoard;
  if (!board) return;
  const todayStr = toLocalDateInputValue(new Date());

  const lampCardHtml = (lamp, index, isExpired) => {
    const acquiredStr = toLocalDateInputValue(new Date(getAcquiredAt(lamp)));
    const expiresStr = formatDate(lamp.expires_at);
    const timeInfo = calculateTimeInfo(getAcquiredAt(lamp), lamp.expires_at);
    const owner = appState.profiles[lamp.author_id] || { name: lamp.author_name, avatar: lamp.author_avatar };
    const topLeft = isExpired
      ? `<span class="lamp-owner">${renderAvatarHtml(owner.avatar, owner.name)} ${escapeHtml(owner.name)}</span>`
      : `<span class="lamp-order">#${index + 1}${index === 0 ? ' · 다음 사용' : ''}</span>`;
    const ddayHtml = isExpired
      ? `<span class="lamp-dday expired">소멸됨</span>`
      : `<span class="lamp-dday" data-lamp-timer-id="${lamp.id}">${timeInfo.dDayStr}</span>`;

    return `
      <div class="lamp-card ${isExpired ? 'expired' : ''} ${!isExpired && index === 0 ? 'next-up' : ''}" data-id="${lamp.id}">
        <div class="lamp-card-top">
          ${topLeft}
          ${ddayHtml}
        </div>
        <div class="lamp-icon">✨</div>
        <label class="lamp-field">
          <span class="lamp-field-label">획득 날짜</span>
          <input type="date" class="lamp-date-input" data-lamp-date data-id="${lamp.id}" value="${acquiredStr}" max="${todayStr}">
        </label>
        <div class="lamp-field">
          <span class="lamp-field-label">소멸 날짜</span>
          <strong class="lamp-expiry-text">${expiresStr}</strong>
        </div>
        <button type="button" class="lamp-delete-btn" data-lamp-action="delete" data-id="${lamp.id}" title="소원 삭제">🗑️ 삭제</button>
      </div>
    `;
  };

  let html = '';
  ['user1', 'user2'].forEach(uid => {
    const profile = appState.profiles[uid];
    const lamps = getActiveLamps(uid);
    html += `
      <section class="lamp-user-section">
        <div class="lamp-user-header">
          <span class="lamp-user-avatar">${renderAvatarHtml(profile.avatar, profile.name)}</span>
          <span class="lamp-user-name">${escapeHtml(profile.name)}의 소원</span>
          <span class="lamp-count-pill">보유 ${lamps.length}개</span>
        </div>
        ${lamps.length
          ? `<div class="lamp-grid">${lamps.map((l, i) => lampCardHtml(l, i, false)).join('')}</div>`
          : `<div class="lamp-empty">아직 획득한 소원이 없어요 ✨</div>`}
      </section>
    `;
  });

  const expiredLamps = appState.wishes
    .filter(w => w.status === 'expired' && !w.registered_at)
    .sort((a, b) => new Date(b.expires_at) - new Date(a.expires_at));
  if (expiredLamps.length) {
    html += `
      <section class="lamp-user-section lamp-expired-section">
        <div class="lamp-user-header">
          <span class="lamp-user-name">💨 소멸된 소원</span>
          <span class="lamp-count-pill muted">${expiredLamps.length}개</span>
        </div>
        <div class="lamp-grid">${expiredLamps.map((l, i) => lampCardHtml(l, i, true)).join('')}</div>
      </section>
    `;
  }

  board.innerHTML = html;
}

async function handleAcquireLamp() {
  const authorId = appState.acquireAuthor;
  const authorProfile = appState.profiles[authorId];
  const acquired = parseDateInputValue(toLocalDateInputValue(new Date()));

  const lamp = {
    id: 'wish_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    author_id: authorId,
    author_name: authorProfile.name,
    author_avatar: authorProfile.avatar,
    category: '',
    content: '',
    status: 'acquired',
    created_at: new Date().toISOString(),
    acquired_at: acquired.toISOString(),
    registered_at: null,
    expires_at: calcLampExpiry(acquired).toISOString(),
    completed_at: null
  };

  appState.wishes.unshift(lamp);
  await persistInsert(lamp);
  renderAll();
  showToast(`✨ ${authorProfile.name}님이 소원을 획득했어요! 획득 날짜를 확인해주세요.`);
}

async function handleLampDateChange(lampId, dateStr) {
  const lamp = appState.wishes.find(w => w.id === lampId);
  if (!lamp) return;
  const acquired = parseDateInputValue(dateStr);
  if (!acquired) return;
  if (dateStr > toLocalDateInputValue(new Date())) {
    showToast('획득 날짜는 오늘 이후로 설정할 수 없어요.');
    renderLamps();
    return;
  }

  const expires = calcLampExpiry(acquired);
  lamp.acquired_at = acquired.toISOString();
  lamp.expires_at = expires.toISOString();
  // 날짜 변경에 따라 소원 상태 재평가 (보유 ↔ 소멸)
  lamp.status = expires.getTime() > Date.now() ? 'acquired' : 'expired';

  await persistUpdate(lampId, {
    acquired_at: lamp.acquired_at,
    expires_at: lamp.expires_at,
    status: lamp.status
  });
  renderAll();
  showToast(lamp.status === 'acquired'
    ? `소멸 날짜가 ${formatDate(lamp.expires_at)}(으)로 계산되었어요.`
    : '30일이 지나 소멸된 소원으로 이동했어요. 💨');
}

async function handleDeleteLamp(lampId) {
  if (!confirm('이 소원을 삭제하시겠습니까?')) return;
  appState.wishes = appState.wishes.filter(w => w.id !== lampId);
  await persistDelete(lampId);
  renderAll();
  showToast('소원이 삭제되었습니다.');
}

function setAcquireAuthor(authorId) {
  appState.acquireAuthor = authorId;
  document.querySelectorAll('#acquireAuthorGroup .btn-author-select').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-author') === authorId);
  });
}

// ==========================================================
// 소원 등록 (보유 소원 → 등록)
// ==========================================================
function updateRegisterPanel() {
  const c1 = getActiveLamps('user1').length;
  const c2 = getActiveLamps('user2').length;
  if (elements.lampCountBadge1) elements.lampCountBadge1.textContent = `✨ ${c1}개`;
  if (elements.lampCountBadge2) elements.lampCountBadge2.textContent = `✨ ${c2}개`;

  const authorId = appState.selectedAuthor;
  const profile = appState.profiles[authorId];
  const lamps = getActiveLamps(authorId);

  if (elements.registerLampInfo) {
    if (lamps.length) {
      const first = lamps[0];
      elements.registerLampInfo.className = 'register-lamp-info';
      elements.registerLampInfo.innerHTML = `
        <span class="hint-icon">✨</span>
        <span><strong>${escapeHtml(profile.name)}</strong>님이 보유한 소원 <strong>${lamps.length}개</strong> 중
        가장 먼저 획득한 소원이 사용됩니다.<br>
        (획득 ${formatDate(getAcquiredAt(first))} · 소멸 예정 <strong>${formatDate(first.expires_at)}</strong>)</span>
      `;
    } else {
      elements.registerLampInfo.className = 'register-lamp-info empty';
      elements.registerLampInfo.innerHTML = `
        <span class="hint-icon">🌙</span>
        <span><strong>${escapeHtml(profile.name)}</strong>님은 보유 중인 소원이 없어요. 먼저 소원을 획득해주세요.</span>
        <button type="button" class="btn-goto-acquire" data-target-screen="screen-acquire">✨ 소원 획득하러 가기</button>
      `;
    }
  }

  if (elements.btnSubmitWish) {
    elements.btnSubmitWish.disabled = lamps.length === 0;
  }
}

function setRegisterAuthor(authorId) {
  appState.selectedAuthor = authorId;
  elements.btnAuthor1.classList.toggle('active', authorId === 'user1');
  elements.btnAuthor2.classList.toggle('active', authorId === 'user2');
  elements.wishAuthor.value = authorId;
  updateRegisterPanel();
}

// ==========================================================
// Wish Add(등록), Complete, Delete Actions
// ==========================================================
async function handleAddWish(e) {
  e.preventDefault();
  const content = elements.wishContent.value.trim();
  if (!content) {
    showToast('소원 내용을 입력해주세요 ✏️');
    elements.wishContent.focus();
    return;
  }

  const authorId = appState.selectedAuthor;
  const authorProfile = appState.profiles[authorId];
  const lamps = getActiveLamps(authorId);
  if (!lamps.length) {
    showToast('보유 중인 소원이 없어요. 먼저 소원을 획득해주세요 ✨');
    return;
  }

  // 가장 먼저 획득한 소원을 사용 → 등록 단계로 전환 (소멸일은 기존 소멸일을 그대로 유지)
  const lamp = lamps[0];
  lamp.status = 'registered';
  lamp.content = content;
  lamp.category = elements.wishCategory.value;
  lamp.registered_at = new Date().toISOString();
  lamp.author_name = authorProfile.name;
  lamp.author_avatar = authorProfile.avatar;

  await persistUpdate(lamp.id, {
    status: lamp.status,
    content: lamp.content,
    category: lamp.category,
    registered_at: lamp.registered_at,
    author_name: lamp.author_name,
    author_avatar: lamp.author_avatar
  });

  elements.wishContent.value = '';
  elements.charCount.textContent = '0';

  checkAndExpireWishes();
  renderAll();
  showToast(`소원 1개를 사용해 등록되었습니다! (소멸 예정: ${formatDate(lamp.expires_at)}) ✨`);

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

  await persistUpdate(wishId, { content: wish.content });

  renderWishes();
  showToast('소원 내용이 저장되었습니다! 📝');
}

function handleCancelEditWish() {
  appState.editingWishId = null;
  renderWishes();
}

async function handleToggleCompleteWish(wishId) {
  const wish = appState.wishes.find(w => w.id === wishId);
  if (!wish) return;

  if (wish.status === 'completed') {
    // Reopen / cancel completion
    wish.status = 'registered';
    wish.completed_at = null;
    await persistUpdate(wishId, { status: 'registered', completed_at: null });
    renderAll();
    showToast('소원 완료가 취소되었습니다. ↩️');
  } else if (wish.status === 'registered') {
    // Complete
    wish.status = 'completed';
    wish.completed_at = new Date().toISOString();
    await persistUpdate(wishId, { status: 'completed', completed_at: wish.completed_at });
    renderAll();
    showToast('소원을 이루었습니다! 축하합니다 🎉');
  }
}

async function handleDeleteWish(wishId) {
  if (!confirm('이 소원을 정말 삭제하시겠습니까?')) return;

  appState.wishes = appState.wishes.filter(w => w.id !== wishId);
  await persistDelete(wishId);

  renderAll();
  showToast('소원이 삭제되었습니다.');
}

// ==========================================================
// Event Listeners
// ==========================================================
function initEventHandlers() {
  // 소원 등록: 작성자 선택
  elements.btnAuthor1.addEventListener('click', () => setRegisterAuthor('user1'));
  elements.btnAuthor2.addEventListener('click', () => setRegisterAuthor('user2'));

  // 소원 획득: 작성자 선택 / 램프 획득
  document.querySelectorAll('#acquireAuthorGroup .btn-author-select').forEach(btn => {
    btn.addEventListener('click', () => setAcquireAuthor(btn.getAttribute('data-author')));
  });
  elements.btnAcquireLamp.addEventListener('click', handleAcquireLamp);

  // 램프 카드: 날짜 변경 / 삭제
  elements.lampBoard.addEventListener('change', (e) => {
    const input = e.target.closest('[data-lamp-date]');
    if (input) handleLampDateChange(input.getAttribute('data-id'), input.value);
  });
  elements.lampBoard.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lamp-action="delete"]');
    if (btn) handleDeleteLamp(btn.getAttribute('data-id'));
  });

  elements.wishContent.addEventListener('input', (e) => {
    elements.charCount.textContent = e.target.value.length;
  });

  elements.wishForm.addEventListener('submit', handleAddWish);

  elements.wishListContainer.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const wishId = target.getAttribute('data-id');

    if (action === 'toggle-complete' || action === 'complete') {
      handleToggleCompleteWish(wishId);
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

  // 홈 화면 D-Day 카드 클릭 시 해당 화면으로 이동
  if (elements.homeDdayList) {
    elements.homeDdayList.addEventListener('click', (e) => {
      const card = e.target.closest('.home-dday-card');
      if (!card) return;
      const status = card.getAttribute('data-home-wish-status');
      const authorId = card.getAttribute('data-home-wish-author');
      if (status === 'acquired') {
        if (authorId) setRegisterAuthor(authorId);
        navigateToScreen('screen-register');
      } else {
        navigateToScreen('screen-list');
      }
    });
  }

  initEmojiPickers();
}

// ==========================================================
// Space Adventure Mini-Game Integration (GNB + Supabase Score Sync)
// ==========================================================
function initSpaceAdventureIntegration() {
  if (!window.SpaceAdventure) return;

  const LS_KEY = 'space_adventure_scores';
  const normalizePid = (pid) => (pid === 'user2' || pid === 'D' ? 'user2' : 'user1');

  const readLocal = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      const v1 = JSON.parse(localStorage.getItem('space_adventure_scores_v1') || '{}');
      return {
        user1: raw.user1 || v1.user1 || v1.R || { score: 0, stage: 0 },
        user2: raw.user2 || v1.user2 || v1.D || { score: 0, stage: 0 }
      };
    } catch (_) {
      return {
        user1: { score: 0, stage: 0 },
        user2: { score: 0, stage: 0 }
      };
    }
  };
  const writeLocal = (obj) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(obj));
    } catch (_) {}
  };

  window.SpaceAdventure.setScoreStore({
    async load() {
      const result = readLocal();

      if (appState.isOnlineSync && appState.supabaseClient) {
        try {
          const { data, error } = await appState.supabaseClient
            .from('space_scores')
            .select('*');
          if (!error && Array.isArray(data)) {
            data.forEach(row => {
              const key = normalizePid(row.player_id);
              const remoteScore = Number(row.best_score) || 0;
              const remoteStage = Number(row.best_stage) || 0;
              if (remoteScore >= (result[key].score || 0)) {
                result[key] = {
                  score: remoteScore,
                  stage: Math.max(remoteStage, result[key].stage || 0)
                };
              }
            });
            writeLocal(result);
          }
        } catch (err) {
          console.warn('SpaceAdventure score load fallback to local:', err);
        }
      }
      return result;
    },

    async submit(pid, score, stage) {
      const playerKey = normalizePid(pid);
      const cur = await this.load();
      const prev = cur[playerKey] || { score: 0, stage: 0 };
      const numScore = Number(score) || 0;
      const numStage = Number(stage) || 0;
      const isNewRecord = numScore > (prev.score || 0);

      const bestScore = Math.max(prev.score || 0, numScore);
      const bestStage = isNewRecord ? numStage : Math.max(prev.stage || 0, numStage);

      if (isNewRecord || numStage > (prev.stage || 0)) {
        cur[playerKey] = { score: bestScore, stage: bestStage, at: new Date().toISOString() };
        writeLocal(cur);

        if (appState.isOnlineSync && appState.supabaseClient) {
          try {
            await appState.supabaseClient
              .from('space_scores')
              .upsert([{
                player_id: playerKey,
                best_score: bestScore,
                best_stage: bestStage,
                updated_at: new Date().toISOString()
              }], { onConflict: 'player_id' });
          } catch (err) {
            console.warn('SpaceAdventure score save fallback to local:', err);
          }
        }
      }
      return isNewRecord;
    }
  });

  if (elements.btnOpenMinigame) {
    elements.btnOpenMinigame.addEventListener('click', () => {
      window.SpaceAdventure.open();
    });
  }
}

// Helper to place or update a custom photo button in the emoji picker row
function setCustomPhotoInRow(rowId, dataUrl) {
  const row = document.getElementById(rowId);
  if (!row) return;
  let customBtn = row.querySelector('.user-custom-photo');
  if (!customBtn) {
    customBtn = document.createElement('button');
    customBtn.type = 'button';
    customBtn.className = 'emoji-opt user-custom-photo';
    customBtn.title = '내 사진';
    customBtn.innerHTML = `<img src="${dataUrl}" class="avatar-img-circle" alt="사진">`;
    row.prepend(customBtn);
  } else {
    const img = customBtn.querySelector('img');
    if (img) img.src = dataUrl;
  }
  customBtn.setAttribute('data-emoji', dataUrl);
  row.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('active'));
  customBtn.classList.add('active');
}

// Process image file from device camera/gallery with canvas resizing
function handlePhotoFileInput(file, rowId) {
  if (!file || !file.type.startsWith('image/')) {
    alert('이미지 파일만 선택할 수 있습니다.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200; // 200x200 square avatar
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCustomPhotoInRow(rowId, dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function openProfileModal() {
  elements.inputUser1Name.value = appState.profiles.user1.name;
  elements.inputUser2Name.value = appState.profiles.user2.name;

  if (appState.profiles.user1.avatar && appState.profiles.user1.avatar.startsWith('data:image/')) {
    setCustomPhotoInRow('user1EmojiRow', appState.profiles.user1.avatar);
  }
  if (appState.profiles.user2.avatar && appState.profiles.user2.avatar.startsWith('data:image/')) {
    setCustomPhotoInRow('user2EmojiRow', appState.profiles.user2.avatar);
  }

  setSelectedEmoji('user1EmojiRow', appState.profiles.user1.avatar);
  setSelectedEmoji('user2EmojiRow', appState.profiles.user2.avatar);

  elements.modalProfiles.classList.remove('hidden');
}

function setSelectedEmoji(rowId, avatarValue) {
  const row = document.getElementById(rowId);
  if (!row) return;
  let matched = false;
  row.querySelectorAll('.emoji-opt').forEach(opt => {
    if (opt.getAttribute('data-emoji') === avatarValue) {
      opt.classList.add('active');
      matched = true;
    } else {
      opt.classList.remove('active');
    }
  });
  if (!matched && avatarValue && avatarValue.startsWith('data:image/')) {
    setCustomPhotoInRow(rowId, avatarValue);
  }
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

  const photoInput1 = document.getElementById('inputUser1Photo');
  if (photoInput1) {
    photoInput1.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handlePhotoFileInput(file, 'user1EmojiRow');
      photoInput1.value = '';
    });
  }

  const photoInput2 = document.getElementById('inputUser2Photo');
  if (photoInput2) {
    photoInput2.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handlePhotoFileInput(file, 'user2EmojiRow');
      photoInput2.value = '';
    });
  }
}

function handleSaveProfiles() {
  const u1Name = elements.inputUser1Name.value.trim() || 'R';
  const u2Name = elements.inputUser2Name.value.trim() || 'D';

  const u1Avatar = document.querySelector('#user1EmojiRow .emoji-opt.active')?.getAttribute('data-emoji') || '🐰';
  const u2Avatar = document.querySelector('#user2EmojiRow .emoji-opt.active')?.getAttribute('data-emoji') || '🐻';

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
