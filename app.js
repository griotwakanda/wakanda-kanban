function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadBoard() {
  const candidates = ['data/board.json', './data/board.json', '/wakanda-kanban/data/board.json'];
  let lastErr;
  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (res.ok) return res.json();
      lastErr = new Error(`${path} -> ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Could not load board data');
}

function fmtDate(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Updated now';
  return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)}`;
}

function rowItem(title, meta, desc) {
  return `<article class="item"><p class="title">${escapeHtml(title)}</p><p class="meta">${escapeHtml(meta || '')}</p>${desc ? `<p class="desc">${escapeHtml(desc)}</p>` : ''}</article>`;
}

function render(data) {
  const cards = data.cards || [];
  const cron = data.cronJobs || [];
  const agents = data.agents || [];
  const repos = data.repositories || [];

  const activeCron = cron.filter((c) => String(c.state || '').toLowerCase() === 'active').length;
  const inProgress = cards.filter((c) => c.column === 'IN PROGRESS').length;
  const done = cards.filter((c) => c.column === 'DONE').length;
  const score = Math.min(100, Math.max(20, Math.round((activeCron * 28 + inProgress * 18 + done * 14 + agents.length * 10) / 1.1)));

  document.getElementById('headline').textContent = score >= 75 ? 'High momentum. Ready to ship.' : 'Execution warming up. Focus and move.';
  document.getElementById('summary').textContent = `${activeCron} active cron, ${inProgress} in progress, ${done} done.`;
  document.getElementById('progress').style.width = `${score}%`;
  document.getElementById('score').textContent = `${score} / 100`;
  document.getElementById('last-updated').textContent = fmtDate(data.updatedAt);

  const metricsEl = document.getElementById('metrics');
  metricsEl.innerHTML = [
    ['Agents', agents.length],
    ['Cron', cron.length],
    ['Repos', repos.length],
    ['Cards', cards.length]
  ].map(([label, value]) => `<article class="metric"><p>${label}</p><strong>${value}</strong></article>`).join('');

  document.getElementById('agents-count').textContent = `${agents.length} active`;
  document.getElementById('agents-list').innerHTML = agents
    .map((a) => rowItem(`${a.emoji || '🤖'} ${a.name}`, a.role, a.specialization))
    .join('');

  document.getElementById('cron-count').textContent = `${activeCron}/${cron.length} active`;
  document.getElementById('cron-list').innerHTML = cron
    .map((c) => rowItem(`${c.icon || '⏰'} ${c.name}`, `${c.schedule} · ${c.state}`, c.description))
    .join('');

  document.getElementById('cards-count').textContent = `${cards.length} cards`;
  document.getElementById('pipeline').innerHTML = cards
    .map((c) => rowItem(c.title, c.column, c.status))
    .join('');

  document.getElementById('repos-count').textContent = `${repos.length} repos`;
  document.getElementById('repos').innerHTML = repos
    .map((r) => `<a class="repo" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer"><p class="name">${escapeHtml(r.name)}</p><p class="status">${escapeHtml(r.status || '')}</p></a>`)
    .join('');
}

async function renderAll() {
  try {
    const data = await loadBoard();
    render(data);
  } catch (e) {
    document.getElementById('headline').textContent = 'Board unavailable';
    document.getElementById('summary').textContent = `Failed to load data/board.json (${String(e.message || e)})`;
  }
}

document.getElementById('refresh-btn').addEventListener('click', renderAll);
renderAll();
