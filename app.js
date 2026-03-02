const COLUMNS = ["TODO", "IN PROGRESS", "DONE"];

async function loadBoard() {
  const fetchedAt = new Date();
  const res = await fetch("data/board.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load board data (${res.status})`);
  const data = await res.json();
  return { data, fetchedAt };
}

function createColumn(name, cards, cardTemplate) {
  const column = document.createElement("section");
  column.className = "column";
  column.dataset.column = name;

  const title = document.createElement("h2");
  title.className = "column-header";
  title.textContent = `${name} (${cards.length})`;
  column.appendChild(title);

  const body = document.createElement("div");
  body.className = "column-body";

  if (!cards.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No cards.";
    body.appendChild(empty);
  } else {
    cards.forEach((card) => {
      const node = cardTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".card-title").textContent = card.title;
      node.querySelector(".card-status").textContent = `Current status: ${card.status}`;

      const list = node.querySelector(".card-tasks");
      (card.pendingTasks || []).forEach((task) => {
        const li = document.createElement("li");
        li.textContent = task;
        list.appendChild(li);
      });

      body.appendChild(node);
    });
  }

  column.appendChild(body);
  return column;
}

function formatTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderLastUpdated(updatedAt, fallbackDate) {
  const footer = document.getElementById("last-updated");
  const formatted = formatTimestamp(updatedAt) || formatTimestamp(fallbackDate);

  footer.textContent = formatted ? `Last updated at ${formatted}` : "Last updated just now";
}

async function init() {
  const board = document.getElementById("board");
  const cardTemplate = document.getElementById("card-template");

  try {
    const { data, fetchedAt } = await loadBoard();
    COLUMNS.forEach((columnName) => {
      const cards = (data.cards || []).filter((c) => c.column === columnName);
      board.appendChild(createColumn(columnName, cards, cardTemplate));
    });

    renderLastUpdated(data.updatedAt, fetchedAt);
  } catch (error) {
    board.innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

init();
