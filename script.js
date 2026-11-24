"use strict";

const storageKey = "mes-taches";
const themeKey = "mes-taches-theme";
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeWarning = document.querySelector("#theme-warning");
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const categoryInput = document.querySelector("#task-category");
const dueDateInput = document.querySelector("#task-due-date");
const categoryFilter = document.querySelector("#category-filter");
const taskSort = document.querySelector("#task-sort");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const warning = document.querySelector("#storage-warning");
const categories = {
  travail: "Travail",
  perso: "Perso",
  urgent: "Urgent",
  "sans-categorie": "Sans catégorie"
};

let tasks = [];
let canSave = true;
let themeChoice = null;
const darkPreference = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  themeIcon.textContent = theme === "dark" ? "☀" : "☾";
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved !== null && saved !== "light" && saved !== "dark") {
      throw new Error("Préférence de thème invalide");
    }
    themeChoice = saved;
  } catch (error) {
    console.error("Impossible de charger le thème :", error);
    themeWarning.textContent = "Impossible de charger la préférence d’apparence. Le thème du système sera utilisé.";
    themeWarning.hidden = false;
  }
  applyTheme(themeChoice || (darkPreference.matches ? "dark" : "light"));
}

themeToggle.addEventListener("click", () => {
  themeChoice = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(themeChoice);
  try {
    localStorage.setItem(themeKey, themeChoice);
    themeWarning.hidden = true;
  } catch (error) {
    console.error("Impossible d’enregistrer le thème :", error);
    themeWarning.textContent = "Impossible d’enregistrer la préférence d’apparence. Elle sera perdue à l’actualisation.";
    themeWarning.hidden = false;
  }
});

darkPreference.addEventListener("change", event => {
  if (themeChoice === null) applyTheme(event.matches ? "dark" : "light");
});

function validDueDate(value) {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayString() {
  const today = new Date();
  const year = String(today.getFullYear()).padStart(4, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showWarning(message) {
  warning.textContent = message;
  warning.hidden = false;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(task =>
      task !== null && typeof task === "object" &&
      typeof task.text === "string" && typeof task.completed === "boolean" &&
      (task.category === undefined || Object.hasOwn(categories, task.category)) &&
      (task.dueDate === undefined || validDueDate(task.dueDate))
    )) {
      throw new Error("Format des tâches invalide");
    }
    tasks = parsed.map(task => ({
      ...task,
      category: task.category === undefined ? "sans-categorie" : task.category,
      dueDate: task.dueDate === undefined ? "" : task.dueDate
    }));
  } catch (error) {
    console.error("Impossible de charger les tâches :", error);
    canSave = false;
    showWarning("Impossible de charger les tâches enregistrées. Pour éviter de les écraser, les modifications ne seront pas sauvegardées.");
  }
}

function saveTasks() {
  if (!canSave) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    warning.hidden = true;
  } catch (error) {
    console.error("Impossible d’enregistrer les tâches :", error);
    showWarning("Impossible d’enregistrer les tâches. Vos modifications seront perdues en fermant ou en actualisant la page.");
  }
}

function renderTasks(focusTask = null, focusSelector = null) {
  list.replaceChildren();
  const visibleTasks = tasks.filter(task =>
    categoryFilter.value === "toutes" || task.category === categoryFilter.value
  );
  if (taskSort.value === "date") {
    visibleTasks.sort((a, b) => {
      if (!a.dueDate) return b.dueDate ? 1 : 0;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }
  const remaining = visibleTasks.filter(task => !task.completed).length;
  count.textContent = `${remaining} tâche${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}`;
  emptyState.hidden = visibleTasks.length > 0;
  emptyTitle.textContent = tasks.length === 0 ? "Tout est en ordre !" : "Aucune tâche dans cette catégorie.";
  emptyDescription.textContent = tasks.length === 0 ? "Ajoutez une tâche pour commencer." : "Choisissez une autre catégorie ou ajoutez une tâche.";

  const today = todayString();
  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item";
    item.classList.toggle("completed", task.completed);
    const overdue = !task.completed && task.dueDate !== "" && task.dueDate < today;
    item.classList.toggle("overdue", overdue);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Marquer « ${task.text} » comme ${task.completed ? "non terminée" : "terminée"}`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks(task, ".task-checkbox");
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const category = document.createElement("span");
    category.className = `category category-${task.category}`;
    category.textContent = categories[task.category];

    const dateField = document.createElement("div");
    dateField.className = "task-date";
    const dateLabel = document.createElement("span");
    dateLabel.textContent = "Échéance";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "task-due-date";
    dateInput.min = "0001-01-01";
    dateInput.max = "9999-12-31";
    dateInput.value = task.dueDate;
    dateInput.setAttribute("aria-label", `Échéance de « ${task.text} »`);
    dateInput.addEventListener("change", () => {
      if (!dateInput.reportValidity()) return;
      task.dueDate = dateInput.value;
      saveTasks();
      renderTasks(task, ".task-due-date");
    });
    dateField.append(dateLabel, dateInput);
    if (overdue) {
      const overdueLabel = document.createElement("span");
      overdueLabel.className = "overdue-label";
      overdueLabel.textContent = "En retard";
      dateField.append(overdueLabel);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Supprimer « ${task.text} »`);
    remove.addEventListener("click", () => {
      tasks.splice(tasks.indexOf(task), 1);
      saveTasks();
      renderTasks();
      input.focus();
    });

    item.append(checkbox, text, category, remove, dateField);
    list.append(item);
    if (task === focusTask && focusSelector) item.querySelector(focusSelector).focus();
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.setCustomValidity("Veuillez saisir une tâche.");
    input.reportValidity();
    return;
  }
  input.setCustomValidity("");
  const category = categoryInput.value;
  tasks.push({ text, completed: false, category, dueDate: dueDateInput.value });
  if (categoryFilter.value !== "toutes" && categoryFilter.value !== category) {
    categoryFilter.value = "toutes";
  }
  saveTasks();
  renderTasks();
  form.reset();
  input.focus();
});

input.addEventListener("input", () => input.setCustomValidity(""));
categoryFilter.addEventListener("change", renderTasks);
taskSort.addEventListener("change", renderTasks);

function refreshAtMidnight() {
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);
  setTimeout(() => {
    renderTasks();
    refreshAtMidnight();
  }, nextMidnight - Date.now() + 100);
}

loadTheme();
loadTasks();
renderTasks();
refreshAtMidnight();
