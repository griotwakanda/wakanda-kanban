async function loadBoard() {
  const res = await fetch('data/board.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load board data');
  return res.json();
}

function fmtDate(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Updated now';
  return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)}`;
}

function renderMission(data) {
  const cards = data.cards || [];
  const cron = data.cronJobs || [];
  const agents = data.agents || [];

  const activeCron = cron.filter((c) => (c.state || '').toLowerCase() === 'active').length;
  const inProgress = cards.filter((c) => c.column === 'IN PROGRESS').length;
  const done = cards.filter((c) => c.column === 'DONE').length;

  const score = Math.min(100, Math.max(20, Math.round((activeCron * 28 + inProgress * 18 + done * 14 + agents.length * 10) / 1.1)));

  document.getElementById('headline').textContent = score >= 75 ? 'High momentum. Ready to ship.' : 'Execution warming up. Focus and move.';
  document.getElementById('summary').textContent = `${activeCron} active cron, ${inProgress} in progress, ${done} done.`;
  document.getElementById('progress').style.width = `${score}%`;
  document.getElementById('score').textContent = `${score} / 100`;

  document.getElementById('last-updated').textContent = fmtDate(data.updatedAt);

  const metrics = [
    ['Agents', agents.length],
    ['Cron', cron.length],
    ['Repos', (data.repositories || []).length],
    ['Cards', cards.length]
  ];

  const metricsEl = document.getElementById('metrics');
  metricsEl.innerHTML = '';
  metrics.forEach(([label, value]) => {
    const el = document.createElement('article');
    el.className = 'metric';
    el.innerHTML = `<p>${label}</p><strong>${value}</strong>`;
    metricsEl.appendChild(el);
  });

  document.getElementById('mini-active-cron')?.textContent = String(activeCron);
  document.getElementById('mini-in-progress')?.textContent = String(inProgress);
  document.getElementById('mini-done')?.textContent = String(done);
}

function rowItem(title, meta, desc) {
  const el = document.createElement('article');
  el.className = 'item';
  el.innerHTML = `<p class="title">${title}</p><p class="meta">${meta || ''}</p>${desc ? `<p class="desc">${desc}</p>` : ''}`;
  return el;
}

function renderAgents(data) {
  const list = document.getElementById('agents-list');
  const agents = data.agents || [];
  document.getElementById('agents-count').textContent = `${agents.length} active`;
  list.innerHTML = '';
  agents.forEach((a) => list.appendChild(rowItem(`${a.emoji || '🤖'} ${a.name}`, a.role, a.specialization)));
}

function renderCron(data) {
  const list = document.getElementById('cron-list');
  const cron = data.cronJobs || [];
  const active = cron.filter((c) => (c.state || '').toLowerCase() === 'active').length;
  document.getElementById('cron-count').textContent = `${active}/${cron.length} active`;
  list.innerHTML = '';
  cron.forEach((c) => list.appendChild(rowItem(`${c.icon || '⏰'} ${c.name}`, `${c.schedule} · ${c.state}`, c.description)));
}

function renderPipeline(data) {
  const list = document.getElementById('pipeline');
  const cards = data.cards || [];
  document.getElementById('cards-count').textContent = `${cards.length} cards`;
  list.innerHTML = '';
  cards.forEach((c) => list.appendChild(rowItem(c.title, c.column, c.status)));
}

function renderRepos(data) {
  const wrap = document.getElementById('repos');
  const repos = data.repositories || [];
  document.getElementById('repos-count').textContent = `${repos.length} repos`;
  wrap.innerHTML = '';
  repos.forEach((r) => {
    const a = document.createElement('a');
    a.className = 'repo';
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<p class="name">${r.name}</p><p class="status">${r.status}</p>`;
    wrap.appendChild(a);
  });
}

async function renderAll() {
  try {
    const data = await loadBoard();
    renderMission(data);
    renderAgents(data);
    renderCron(data);
    renderPipeline(data);
    renderRepos(data);
  } catch (e) {
    document.getElementById('headline').textContent = 'Board unavailable';
    document.getElementById('summary').textContent = String(e.message || e);
  }
}

document.getElementById('refresh-btn').addEventListener('click', renderAll);
renderAll();
