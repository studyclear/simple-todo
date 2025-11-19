// GrowDay - offline app logic (localStorage). Dark neon theme.
// Keys
const LS_KEYS = { TODOS: 'growday_todos', GOALS: 'growday_goals', STATS: 'growday_stats', REFL: 'growday_reflections', QUOTE: 'growday_quote' };

/* -------------------------
   Utilities
--------------------------*/
const $ = id => document.getElementById(id);
const toast = (msg) => {
  const toastEl = new bootstrap.Toast($('liveToast'));
  $('toastBody').textContent = msg;
  toastEl.show();
};
const saveLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const loadLS = (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def));

/* -------------------------
   State initial
--------------------------*/
let todos = loadLS(LS_KEYS.TODOS, []);
let goals = loadLS(LS_KEYS.GOALS, []);
let stats = loadLS(LS_KEYS.STATS, { xp: 0, completedToday: 0, streak: 0, lastCompleteDate: null });
let reflections = loadLS(LS_KEYS.REFL, []);
let quotes = [
  "Small steps matter.",
  "Consistency beats intensity.",
  "Focus on progress, not perfection.",
  "One task at a time.",
  "Progress compounds daily."
];
let currentQuote = localStorage.getItem(LS_KEYS.QUOTE) || quotes[0];

/* -------------------------
   DOM Refs
--------------------------*/
const newTaskInput = $('newTaskInput');
const addTaskBtn = $('addTaskBtn');
const todoList = $('todoList');
const tasksSummary = $('tasksSummary');
const xpBadge = $('xpBadge');
const clearCompletedBtn = $('clearCompleted');
const resetAllBtn = $('resetAll');

const goalsList = $('goalsList');
const addGoalBtn = $('addGoalBtn');
const goalSelect = $('goalSelect');

const weekProgressBar = $('weekProgressBar');
const weekProgressText = $('weekProgressText');

const dailyQuote = $('dailyQuote');
const newQuoteBtn = $('newQuoteBtn');

/* -------------------------
   Render functions
--------------------------*/
function renderTodos(){
  todoList.innerHTML = '';
  if (todos.length === 0){
    todoList.innerHTML = `<div class="text-center text-muted py-3">Belum ada tugas. Tambah tugas untuk mulai.</div>`;
  }
  todos.forEach(todo => {
    const item = document.createElement('div');
    item.className = 'list-group-item fade-in';
    item.innerHTML = `
      <div class="todo-item">
        <div>
          <div class="d-flex align-items-center">
            <input type="checkbox" class="form-check-input me-2" data-id="${todo.id}" ${todo.done ? 'checked' : ''}>
            <div>
              <div class="task-title ${todo.done ? 'text-decoration-line-through text-muted' : ''}">${escapeHtml(todo.title)}</div>
              <div class="small text-muted">${todo.goal ? `<span class="goal-pill">${escapeHtml(todo.goal)}</span>` : ''} ${todo.note ? ' • ' + escapeHtml(todo.note) : ''}</div>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <button class="btn btn-sm btn-outline-light edit-btn" data-id="${todo.id}"><i class="bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger del-btn" data-id="${todo.id}"><i class="bi-trash"></i></button>
        </div>
      </div>
    `;
    todoList.appendChild(item);
  });
  updateSummary();
  attachTodoHandlers();
}

function renderGoals(){
  goalsList.innerHTML = '';
  goalSelect.innerHTML = `<option value="">— Goal —</option>`;
  goals.forEach(g => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `<div>${escapeHtml(g.name)}</div><div class="text-muted small">${g.created}</div>`;
    goalsList.appendChild(li);

    const opt = document.createElement('option');
    opt.value = g.name;
    opt.textContent = g.name;
    goalSelect.appendChild(opt);
  });
}

function renderReflections(){
  const list = $('reflectionList');
  list.innerHTML = '';
  if (reflections.length === 0) {
    list.innerHTML = `<li class="list-group-item text-muted">Belum ada reflection</li>`;
    return;
  }
  reflections.slice().reverse().forEach(r => {
    const el = document.createElement('li');
    el.className = 'list-group-item';
    el.innerHTML = `<div class="small text-muted">${r.date}</div><div>${escapeHtml(r.text)}</div>`;
    list.appendChild(el);
  });
}

function renderQuote(){
  dailyQuote.textContent = currentQuote;
}

function updateSummary(){
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  tasksSummary.textContent = `${total} tugas • ${done} selesai`;
  xpBadge.textContent = `XP: ${stats.xp}`;
  // weekly progress: simple % of tasks done today vs total
  const pct = total === 0 ? 0 : Math.round((done/Math.max(total,1)) * 100);
  weekProgressBar.style.width = pct + '%';
  weekProgressText.textContent = `Streak: ${stats.streak} hari • ${pct}% selesai`;
}

/* -------------------------
   Todo handlers
--------------------------*/
function attachTodoHandlers(){
  document.querySelectorAll('.del-btn').forEach(b => {
    b.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      todos = todos.filter(t => t.id !== id);
      saveLS(LS_KEYS.TODOS, todos);
      renderTodos();
      toast('Tugas dihapus');
    };
  });
  document.querySelectorAll('.edit-btn').forEach(b => {
    b.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      const t = todos.find(x => x.id === id);
      const newTitle = prompt('Edit tugas', t.title);
      if (newTitle !== null && newTitle.trim() !== ''){
        t.title = newTitle.trim();
        saveLS(LS_KEYS.TODOS, todos);
        renderTodos();
        toast('Tugas diperbarui');
      }
    };
  });
  document.querySelectorAll('.form-check-input').forEach(cb => {
    cb.onchange = (e) => {
      const id = e.currentTarget.dataset.id;
      const t = todos.find(x => x.id === id);
      t.done = e.currentTarget.checked;
      // XP & stats: reward once when toggled to done
      if (t.done){
        stats.xp += (t.goal ? 15 : 8);
        stats.completedToday = (stats.completedToday || 0) + 1;
        stats.lastCompleteDate = (new Date()).toDateString();
        // streak check
        const last = stats.lastCompleteDate;
        // increment handled on app load/save for simplicity
      }
      saveLS(LS_KEYS.TODOS, todos);
      saveLS(LS_KEYS.STATS, stats);
      renderTodos();
    };
  });
}

/* -------------------------
   Add task / goal
--------------------------*/
addTaskBtn.onclick = () => {
  const title = newTaskInput.value.trim();
  const goal = goalSelect.value;
  if (!title){ toast('Tulis tugas dulu'); return; }
  const newTask = {
    id: 't_' + Date.now(),
    title,
    goal: goal || '',
    note: '',
    done: false,
    created: new Date().toISOString()
  };
  todos.push(newTask);
  saveLS(LS_KEYS.TODOS, todos);
  newTaskInput.value = '';
  renderTodos();
  toast('Tugas ditambahkan');
};

addGoalBtn.onclick = () => {
  const name = prompt('Nama goal (contoh: Lulus TOEFL)').trim();
  if (!name) return;
  const g = { id: 'g_' + Date.now(), name: name, created: new Date().toLocaleDateString() };
  goals.push(g);
  saveLS(LS_KEYS.GOALS, goals);
  renderGoals();
  toast('Goal tersimpan');
};

/* -------------------------
   Clear / Reset
--------------------------*/
clearCompletedBtn.onclick = () => {
  const before = todos.length;
  todos = todos.filter(t => !t.done);
  saveLS(LS_KEYS.TODOS, todos);
  renderTodos();
  toast(`Bersihkan selesai (${before - todos.length})`);
};

resetAllBtn.onclick = () => {
  if (!confirm('Reset semua data aplikasi?')) return;
  todos = []; goals = []; stats = { xp: 0, completedToday: 0, streak: 0, lastCompleteDate: null }; reflections = [];
  saveLS(LS_KEYS.TODOS, todos);
  saveLS(LS_KEYS.GOALS, goals);
  saveLS(LS_KEYS.STATS, stats);
  saveLS(LS_KEYS.REFL, reflections);
  renderAll();
  toast('Semua data direset');
};

/* -------------------------
   Reflections
--------------------------*/
$('reflectionText').addEventListener('input', (e) => {
  $('charCount').textContent = `${e.target.value.length} / 300`;
});

$('saveReflection').onclick = () => {
  const text = $('reflectionText').value.trim();
  if (!text) { toast('Tulis reflection sebelum menyimpan'); return; }
  reflections.push({ id: 'r_'+Date.now(), text, date: new Date().toLocaleString() });
  saveLS(LS_KEYS.REFL, reflections);
  $('reflectionText').value = '';
  $('charCount').textContent = '0 / 300';
  renderReflections();
  toast('Reflection tersimpan');
};

/* -------------------------
   Quotes
--------------------------*/
newQuoteBtn.onclick = () => {
  currentQuote = quotes[Math.floor(Math.random() * quotes.length)];
  localStorage.setItem(LS_KEYS.QUOTE, currentQuote);
  renderQuote();
};

/* -------------------------
   Timer (Pomodoro-like)
--------------------------*/
let timer = {
  running: false,
  mode: 'work', // work / break
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  remaining: 25 * 60,
  intervalId: null,
  rounds: 0
};

const timerDisplay = $('timerDisplay');
const startBtn = $('startTimer');
const pauseBtn = $('pauseTimer');
const resetBtn = $('resetTimer');
const timerModeText = $('timerMode');
const roundsCount = $('roundsCount');
const openFocusBtn = $('openFocusBtn');

function formatMMSS(s){
  const m = Math.floor(s/60).toString().padStart(2,'0');
  const sec = (s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

function renderTimer(){
  timerDisplay.textContent = formatMMSS(timer.remaining);
  timerModeText.textContent = timer.mode === 'work' ? 'Work' : 'Break';
  roundsCount.textContent = timer.rounds;
}

function tick(){
  if (!timer.running) return;
  if (timer.remaining <= 0){
    // switch mode
    if (timer.mode === 'work'){
      timer.mode = 'break';
      timer.remaining = timer.breakDuration;
      timer.rounds += 1;
      // reward small XP for completed round
      stats.xp += 5;
      saveLS(LS_KEYS.STATS, stats);
      toast('Selesai sesi kerja. Istirahat sebentar.');
    } else {
      timer.mode = 'work';
      timer.remaining = timer.workDuration;
      toast('Istirahat selesai. Kembali fokus.');
    }
    renderTimer(); updateSummary();
    return;
  }
  timer.remaining -= 1;
  renderTimer();
}

startBtn.onclick = () => {
  if (timer.running) return;
  timer.running = true;
  timer.intervalId = setInterval(tick, 1000);
  renderTimer();
};
pauseBtn.onclick = () => {
  timer.running = false;
  clearInterval(timer.intervalId);
  renderTimer();
};
resetBtn.onclick = () => {
  timer.running = false;
  clearInterval(timer.intervalId);
  timer.mode = 'work';
  timer.remaining = timer.workDuration;
  timer.rounds = 0;
  renderTimer();
  toast('Timer direset');
};

const switchModeBtn = $('switchModeBtn');

switchModeBtn.onclick = () => {
  if (timer.mode === 'work') {
    timer.mode = 'break';
    timer.remaining = timer.breakDuration;
    toast('Mode diubah ke Break');
  } else {
    timer.mode = 'work';
    timer.remaining = timer.workDuration;
    toast('Mode diubah ke Work');
  }
  renderTimer();
};

/* open focus: quick full-screen-ish effect */
openFocusBtn.onclick = async () => {
  // try go fullscreen for chrome-like effect
  const el = document.documentElement;
  if (el.requestFullscreen) await el.requestFullscreen().catch(()=>{});
  // start timer and hide UI minor elements
  startBtn.click();
  toast('Focus mode: fullscreen & timer berjalan');
};

/* -------------------------
   Helpers & init
--------------------------*/
function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function renderAll(){
  renderTodos();
  renderGoals();
  renderReflections();
  renderQuote();
  updateSummary();
  renderTimer();
}

/* Streak update on app load */
function updateStreakOnLoad(){
  // if lastCompleteDate exists and is yesterday then keep streak, if older reset
  if (!stats.lastCompleteDate) return;
  const last = new Date(stats.lastCompleteDate).toDateString();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (last === today) {
    // nothing
  } else if (last === yesterday) {
    // streak preserved
  } else {
    stats.streak = 0;
    saveLS(LS_KEYS.STATS, stats);
  }
}

/* Initial setup: sample goal if empty */
if (goals.length === 0){
  goals.push({ id: 'g_sample', name: 'Belajar 1 jam/hari', created: new Date().toLocaleDateString() });
  saveLS(LS_KEYS.GOALS, goals);
}

/* Initial render */
updateStreakOnLoad();
renderAll();

/* Expose for console debugging (optional) */
window.GrowDay = { todos, goals, stats, reflections };

/* End of file */
