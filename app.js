function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadBoard() {
  const paths = ['data/board.json', './data/board.json', '/wakanda-kanban/data/board.json'];
  for (const p of paths) {
    try {
      const r = await fetch(p, { cache: 'no-store' });
      if (r.ok) return r.json();
    } catch {}
  }
  throw new Error('Failed to load data/board.json');
}

function fmtDate(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'now';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
}

function render(data) {
  const cards = data.cards || [];
  const cron = data.cronJobs || [];
  const repos = data.repositories || [];
  const agents = data.agents || [];

  const activeCron = cron.filter((c) => String(c.state || '').toLowerCase() === 'active').length;
  const inProgress = cards.filter((c) => c.column === 'IN PROGRESS').length;
  const done = cards.filter((c) => c.column === 'DONE').length;

  document.getElementById('summary').textContent = `${agents.length} agent · ${activeCron} active cron · ${inProgress} in progress`;
  document.getElementById('last-updated').textContent = fmtDate(data.updatedAt);

  const metrics = [
    ['Agents', agents.length],
    ['Cron', cron.length],
    ['Progress', inProgress],
    ['Done', done]
  ];
  document.getElementById('metrics').innerHTML = metrics
    .map(([label, value]) => `<article class="tile"><p class="label">${escapeHtml(label)}</p><p class="value">${escapeHtml(value)}</p></article>`)
    .join('');

  const opsRows = [
    ...cron.slice(0, 3).map((c) => ({ t: `${c.icon || '⏰'} ${c.name}`, m: `${c.schedule} · ${c.state}` })),
    ...cards.slice(0, 2).map((c) => ({ t: c.title, m: `${c.column} · ${c.status || ''}` }))
  ];
  document.getElementById('ops-list').innerHTML = opsRows
    .map((r) => `<article class="row"><p class="t">${escapeHtml(r.t)}</p><p class="m">${escapeHtml(r.m)}</p></article>`)
    .join('');

  document.getElementById('repos-count').textContent = `${repos.length}`;
  document.getElementById('repos').innerHTML = repos
    .slice(0, 5)
    .map((r) => `<a class="row repo" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer"><p class="t">${escapeHtml(r.name)}</p><p class="m">${escapeHtml(r.status || '')}</p></a>`)
    .join('');
}

async function init() {
  try {
    const data = await loadBoard();
    render(data);
  } catch (e) {
    document.getElementById('summary').textContent = String(e.message || e);
  }
}

document.getElementById('refresh-btn').addEventListener('click', init);
init();
