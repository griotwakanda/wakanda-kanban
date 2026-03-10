const COLUMNS = ['TODO', 'IN PROGRESS', 'DONE'];
const COLUMN_META = {
  TODO: 'New initiatives awaiting action.',
  'IN PROGRESS': 'Active workstreams in motion.',
  DONE: 'Recent wins and completed experiments.'
};

async function loadBoard() {
  const res = await fetch('data/board.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load board data (${res.status})`);
  const data = await res.json();
  return { data, fetchedAt: new Date() };
}

function createStatCard(statTemplate, value, label) {
  const node = statTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('.stat-value').textContent = value;
  node.querySelector('.stat-label').textContent = label;
  return node;
}

function renderMissionSpotlight(data) {
  const cards = data.cards || [];
  const cronJobs = data.cronJobs || [];
  const inProgress = cards.filter((card) => card.column === 'IN PROGRESS').length;
  const done = cards.filter((card) => card.column === 'DONE').length;
  const activeCron = cronJobs.filter((job) => (job.state || '').toLowerCase() === 'active').length;

  const score = Math.max(5, Math.min(100, Math.round(((activeCron * 30) + (inProgress * 20) + (done * 15) + ((data.agents?.length || 0) * 10)) / 1.2)));

  const missionHeadline = document.getElementById('mission-headline');
  const missionSummary = document.getElementById('mission-summary');
  const progressBar = document.getElementById('mission-progress-bar');
  const progressLabel = document.getElementById('mission-progress-label');

  if (missionHeadline) missionHeadline.textContent = score >= 75 ? 'Execution engine running strong' : 'Mission systems warming up';
  if (missionSummary) missionSummary.textContent = `${activeCron} active cron pulse(s), ${inProgress} stream(s) in progress, ${done} completed lane(s).`;
  if (progressBar) progressBar.style.width = `${score}%`;
  if (progressLabel) progressLabel.textContent = `Momentum score: ${score}/100`;

  const miniActiveCron = document.getElementById('mini-active-cron');
  const miniInProgress = document.getElementById('mini-in-progress');
  const miniDone = document.getElementById('mini-done');
  if (miniActiveCron) miniActiveCron.textContent = String(activeCron);
  if (miniInProgress) miniInProgress.textContent = String(inProgress);
  if (miniDone) miniDone.textContent = String(done);
}

function renderStats(data, statTemplate) {
  const container = document.getElementById('stats-grid');
  container.innerHTML = '';

  const stats = [
    { label: 'Agents', value: data.agents?.length ?? 0 },
    { label: 'Cron jobs', value: data.cronJobs?.length ?? 0 },
    { label: 'Repositories', value: data.repositories?.length ?? 0 },
    { label: 'Kanban cards', value: data.cards?.length ?? 0 }
  ];

  stats.forEach((stat) => {
    container.appendChild(createStatCard(statTemplate, stat.value, stat.label));
  });
}

function renderAgents(agents, template) {
  const container = document.getElementById('agent-team');
  container.innerHTML = '';
  if (!agents?.length) {
    container.innerHTML = '<p class="empty">No agents configured.</p>'; 
    return;
  }

  agents.forEach((agent) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.card-emoji').textContent = agent.emoji || '🤖';
    node.querySelector('.card-title').textContent = agent.name;
    node.querySelector('.card-subtitle').textContent = agent.role;
    node.querySelector('.card-description').textContent = agent.specialization;
    container.appendChild(node);
  });
}

function renderCronJobs(cronJobs, template) {
  const container = document.getElementById('cron-jobs');
  container.innerHTML = '';
  if (!cronJobs?.length) {
    container.innerHTML = '<p class="empty">No cron jobs configured.</p>'; 
    return;
  }

  cronJobs.forEach((job) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const state = (job.state || 'Active').trim();
    const isActive = state.toLowerCase() === 'active';

    node.querySelector('.card-emoji').textContent = job.icon || '⏰';
    node.querySelector('.card-title').textContent = job.name;
    node.querySelector('.card-subtitle').textContent = `Schedule: ${job.schedule?.schedule ?? job.schedule}`;

    const statusBadge = node.querySelector('.status-badge');
    statusBadge.textContent = state;
    statusBadge.classList.toggle('status-muted', !isActive);

    const tagBadge = node.querySelector('.tag-badge');
    if (job.tag) {
      tagBadge.textContent = job.tag;
      tagBadge.hidden = false;
    } else {
      tagBadge.hidden = true;
    }

    node.querySelector('.card-description').textContent = job.description;
    container.appendChild(node);
  });
}

function renderRepositories(repositories, template) {
  const container = document.getElementById('repositories');
  container.innerHTML = '';
  if (!repositories?.length) {
    container.innerHTML = '<p class="empty">No repositories configured.</p>'; 
    return;
  }

  repositories.forEach((repo) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.href = repo.url;
    node.querySelector('.card-title').textContent = repo.name;
    node.querySelector('.card-subtitle').textContent = repo.status ? `Status: ${repo.status}` : 'Repository';
    node.querySelector('.card-description').textContent = repo.description;
    container.appendChild(node);
  });
}

function createColumn(columnName, cards, template) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.column = columnName;
  node.classList.add(`column-${columnName.toLowerCase().replace(/\s+/g, '-')}`);
  node.querySelector('.column-name').textContent = columnName;
  node.querySelector('.column-count').textContent = `${cards.length} card${cards.length === 1 ? '' : 's'}`;
  node.querySelector('.column-description').textContent = COLUMN_META[columnName] || '';

  const list = node.querySelector('.column-tasks');
  cards.forEach((card) => {
    const li = document.createElement('li');
    li.textContent = card.title;
    list.appendChild(li);
  });

  return node;
}

function renderKanban(cards, template) {
  const container = document.getElementById('board-columns');
  container.innerHTML = '';
  COLUMNS.forEach((columnName, index) => {
    const columnCards = (cards || []).filter((card) => card.column === columnName);
    const columnNode = createColumn(columnName, columnCards, template);
    columnNode.style.animationDelay = `${index * 80}ms`;
    container.appendChild(columnNode);
  });
}

function formatTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function renderLastUpdated(updatedAt, fallbackDate) {
  const footer = document.getElementById('last-updated');
  const formatted = formatTimestamp(updatedAt) || formatTimestamp(fallbackDate);
  footer.textContent = formatted ? `Last updated ${formatted}` : 'Last updated just now';
}

async function init() {
  const statTemplate = document.getElementById('stat-template');
  const agentTemplate = document.getElementById('agent-template');
  const cronTemplate = document.getElementById('cron-template');
  const repoTemplate = document.getElementById('repo-template');
  const columnTemplate = document.getElementById('column-template');
  const refreshBtn = document.getElementById('refresh-btn');

  const loadAndRender = async () => {
    try {
      const { data, fetchedAt } = await loadBoard();
      renderMissionSpotlight(data);
      renderStats(data, statTemplate);
      renderAgents(data.agents, agentTemplate);
      renderCronJobs(data.cronJobs, cronTemplate);
      renderRepositories(data.repositories, repoTemplate);
      renderKanban(data.cards, columnTemplate);
      renderLastUpdated(data.updatedAt, fetchedAt);
    } catch (error) {
      const message = document.createElement('p');
      message.className = 'empty';
      message.textContent = error.message;
      document.getElementById('mission').appendChild(message);
    }
  };

  refreshBtn.addEventListener('click', () => {
    loadAndRender();
  });

  await loadAndRender();
}

init();
