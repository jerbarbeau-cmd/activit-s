"use strict";

const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
const runButton = document.querySelector("#run-tests");
let fixtureHtml;
let frame;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function same(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `${message} : attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
}

function loadFrame(element) {
  return new Promise((resolve, reject) => {
    element.addEventListener("load", resolve, { once: true });
    element.addEventListener("error", () => reject(new Error("Impossible de charger la page de test.")), { once: true });
  });
}

async function readFixture() {
  const source = document.createElement("iframe");
  source.hidden = true;
  source.setAttribute("sandbox", "allow-same-origin");
  const loaded = loadFrame(source);
  source.src = "index.html";
  document.body.append(source);
  try {
    await loaded;
    if (!source.contentDocument) throw new Error("Impossible de lire index.html depuis cette page.");
    return source.contentDocument.documentElement.outerHTML;
  } finally {
    source.remove();
  }
}

function environment(saved = null) {
  return {
    saved,
    theme: null,
    systemDark: false,
    failRead: false,
    failWrite: false,
    now: new Date(2026, 10, 24, 23, 59, 50).getTime(),
    timers: []
  };
}

async function openApp(env) {
  if (frame) frame.remove();
  window.testEnvironment = env;
  env.timers = [];
  frame = document.createElement("iframe");
  frame.style.cssText = "position: fixed; left: -10000px; width: 800px; height: 600px;";
  const bootstrap = `<script>
    const env = parent.testEnvironment;
    Object.defineProperty(window, "localStorage", { value: {
      getItem(key) { if (env.failRead) throw new Error("Lecture impossible"); return key === "mes-taches-theme" ? env.theme : env.saved; },
      setItem(key, value) { if (env.failWrite) throw new Error("Écriture impossible"); if (key === "mes-taches-theme") env.theme = value; else env.saved = value; }
    } });
    window.matchMedia = () => ({
      matches: env.systemDark,
      addEventListener(type, callback) { env.themeListener = callback; }
    });
    const RealDate = Date;
    window.Date = class extends RealDate {
      constructor(...args) { if (args.length) super(...args); else super(env.now); }
      static now() { return env.now; }
    };
    window.setTimeout = (callback, delay) => { env.timers.push({ callback, delay }); return env.timers.length; };
  <\/script>`;
  const loaded = loadFrame(frame);
  frame.srcdoc = fixtureHtml.replace("</head>", `${bootstrap}</head>`);
  document.body.append(frame);
  await loaded;
  return frame.contentDocument;
}

function change(element, value) {
  element.value = value;
  element.dispatchEvent(new element.ownerDocument.defaultView.Event("change", { bubbles: true }));
}

function add(doc, text, category = "travail", date = "") {
  const input = doc.querySelector("#task-input");
  input.value = text;
  input.dispatchEvent(new doc.defaultView.Event("input", { bubbles: true }));
  doc.querySelector("#task-category").value = category;
  doc.querySelector("#task-due-date").value = date;
  doc.querySelector("#task-form").requestSubmit();
}

function task(doc, text) {
  return Array.from(doc.querySelectorAll(".task-item"))
    .find(item => item.querySelector(".task-text").textContent === text);
}

function names(doc) {
  return Array.from(doc.querySelectorAll(".task-text"), element => element.textContent);
}

const tests = [
  ["Liste vide et validation du texte", async () => {
    const doc = await openApp(environment());
    assert(!doc.querySelector("#empty-state").hidden, "L'état vide doit être visible");
    add(doc, "   ");
    same(names(doc), [], "Une tâche vide ne doit pas être ajoutée");
    assert(!doc.querySelector("#task-input").validity.valid, "Un message de validation est nécessaire");
    add(doc, "  Acheter du pain  ");
    same(names(doc), ["Acheter du pain"], "Les espaces doivent être retirés");
    assert(!doc.querySelector("#task-input").validity.customError, "L'erreur doit disparaître après saisie");
  }],
  ["Ajout, catégories et sauvegarde", async () => {
    const env = environment();
    let doc = await openApp(env);
    add(doc, "<b>Rapport</b>", "perso", "2026-11-25");
    assert(task(doc, "<b>Rapport</b>").querySelector(".category-perso"), "La catégorie Perso doit être affichée");
    assert(!task(doc, "<b>Rapport</b>").querySelector("b"), "Le texte ne doit pas être interprété comme du HTML");
    doc = await openApp(env);
    same(names(doc), ["<b>Rapport</b>"], "La tâche doit être rechargée");
    same(doc.querySelector(".task-due-date").value, "2026-11-25", "La date doit être rechargée");
    same(JSON.parse(env.saved)[0].category, "perso", "La catégorie doit être sauvegardée");
  }],
  ["Terminer puis rouvrir une tâche", async () => {
    const env = environment();
    let doc = await openApp(env);
    add(doc, "Lire");
    task(doc, "Lire").querySelector(".task-checkbox").click();
    same(doc.querySelector("#task-count").textContent, "0 tâches restantes", "Le compteur doit diminuer");
    doc = await openApp(env);
    assert(task(doc, "Lire").querySelector(".task-checkbox").checked, "L'état terminé doit être sauvegardé");
    task(doc, "Lire").querySelector(".task-checkbox").click();
    doc = await openApp(env);
    assert(!task(doc, "Lire").querySelector(".task-checkbox").checked, "La tâche doit pouvoir être rouverte");
  }],
  ["Suppression dans une liste filtrée", async () => {
    const env = environment();
    let doc = await openApp(env);
    add(doc, "Travail", "travail");
    add(doc, "Perso", "perso");
    change(doc.querySelector("#category-filter"), "perso");
    task(doc, "Perso").querySelector(".delete-button").click();
    assert(!doc.querySelector("#empty-state").hidden, "Le filtre vide doit afficher un message");
    doc = await openApp(env);
    same(names(doc), ["Travail"], "Seule la tâche sélectionnée doit être supprimée");
  }],
  ["Filtre, compteur et ajout dans une autre catégorie", async () => {
    const doc = await openApp(environment());
    add(doc, "A", "travail");
    add(doc, "B", "perso");
    change(doc.querySelector("#category-filter"), "travail");
    same(names(doc), ["A"], "Le filtre doit limiter les tâches");
    same(doc.querySelector("#task-count").textContent, "1 tâche restante", "Le compteur doit suivre le filtre");
    add(doc, "C", "urgent");
    same(doc.querySelector("#category-filter").value, "toutes", "La nouvelle tâche doit être visible");
    same(names(doc), ["A", "B", "C"], "Le filtre doit revenir à toutes les catégories");
  }],
  ["Tri et modification d'échéance", async () => {
    const env = environment();
    let doc = await openApp(env);
    add(doc, "Sans date");
    add(doc, "Plus tard", "travail", "2026-12-01");
    add(doc, "Plus tôt", "perso", "2026-11-25");
    change(doc.querySelector("#task-sort"), "date");
    same(names(doc), ["Plus tôt", "Plus tard", "Sans date"], "Les tâches sans date doivent être en dernier");
    change(task(doc, "Sans date").querySelector(".task-due-date"), "2026-11-24");
    same(names(doc), ["Sans date", "Plus tôt", "Plus tard"], "Le tri doit suivre la nouvelle date");
    assert(doc.activeElement === task(doc, "Sans date").querySelector(".task-due-date"), "Le focus doit rester sur la tâche modifiée");
    doc = await openApp(env);
    same(task(doc, "Sans date").querySelector(".task-due-date").value, "2026-11-24", "La modification doit être sauvegardée");
  }],
  ["Retard, jour courant et tâche terminée", async () => {
    const doc = await openApp(environment());
    add(doc, "Hier", "travail", "2026-11-23");
    add(doc, "Aujourd'hui", "travail", "2026-11-24");
    add(doc, "Demain", "travail", "2026-11-25");
    assert(task(doc, "Hier").classList.contains("overdue"), "Hier doit être en retard");
    assert(task(doc, "Hier").querySelector(".overdue-label"), "Le retard doit aussi être indiqué par du texte");
    const color = doc.defaultView.getComputedStyle(task(doc, "Hier").querySelector(".task-text")).color;
    const components = color.match(/\d+/g).map(Number);
    assert(components[0] > components[1] && components[0] > components[2], "Le texte en retard doit être rouge");
    assert(!task(doc, "Aujourd'hui").classList.contains("overdue"), "Aujourd'hui ne doit pas être en retard");
    assert(!task(doc, "Demain").classList.contains("overdue"), "Demain ne doit pas être en retard");
    task(doc, "Hier").querySelector(".task-checkbox").click();
    assert(!task(doc, "Hier").classList.contains("overdue"), "Une tâche terminée ne doit pas être en retard");
  }],
  ["Effacer une échéance", async () => {
    const env = environment();
    let doc = await openApp(env);
    add(doc, "À modifier", "urgent", "2026-11-23");
    change(task(doc, "À modifier").querySelector(".task-due-date"), "");
    assert(!task(doc, "À modifier").classList.contains("overdue"), "Une tâche sans échéance ne doit pas être en retard");
    doc = await openApp(env);
    same(task(doc, "À modifier").querySelector(".task-due-date").value, "", "La suppression de la date doit être sauvegardée");
  }],
  ["Actualisation du retard à minuit", async () => {
    const env = environment();
    const doc = await openApp(env);
    add(doc, "À minuit", "travail", "2026-11-24");
    assert(!task(doc, "À minuit").classList.contains("overdue"), "La tâche du jour ne doit pas être en retard");
    assert(env.timers.length === 1, "Une actualisation doit être programmée");
    const timer = env.timers.shift();
    env.now += timer.delay;
    timer.callback();
    assert(task(doc, "À minuit").classList.contains("overdue"), "La tâche doit devenir en retard après minuit");
  }],
  ["Anciennes tâches sans catégorie ni date", async () => {
    const env = environment(JSON.stringify([{ text: "Ancienne", completed: false }]));
    let doc = await openApp(env);
    assert(task(doc, "Ancienne").querySelector(".category-sans-categorie"), "L'ancienne tâche doit rester accessible");
    change(task(doc, "Ancienne").querySelector(".task-due-date"), "2026-11-25");
    doc = await openApp(env);
    same(task(doc, "Ancienne").querySelector(".task-due-date").value, "2026-11-25", "L'ancienne tâche doit pouvoir recevoir une date");
  }],
  ["Données invalides protégées contre l'écrasement", async () => {
    const invalid = JSON.stringify([{ text: "Erreur", completed: false, dueDate: "2026-02-30" }]);
    const env = environment(invalid);
    const doc = await openApp(env);
    assert(!doc.querySelector("#storage-warning").hidden, "L'échec de lecture doit être signalé");
    add(doc, "Nouvelle tâche");
    same(env.saved, invalid, "Les données invalides ne doivent pas être écrasées");
  }],
  ["Erreur de lecture du stockage", async () => {
    const env = environment();
    env.failRead = true;
    const doc = await openApp(env);
    assert(!doc.querySelector("#storage-warning").hidden, "L'échec de lecture doit être signalé");
    add(doc, "Non sauvegardée");
    same(env.saved, null, "L'écriture doit rester désactivée");
  }],
  ["Erreur d'écriture du stockage", async () => {
    const env = environment();
    env.failWrite = true;
    const doc = await openApp(env);
    add(doc, "Non sauvegardée");
    assert(task(doc, "Non sauvegardée"), "La tâche doit rester visible en mémoire");
    assert(!doc.querySelector("#storage-warning").hidden, "L'échec d'écriture doit être signalé");
    env.failWrite = false;
    add(doc, "Sauvegardée");
    assert(doc.querySelector("#storage-warning").hidden, "L'avertissement doit disparaître après sauvegarde réussie");
    same(JSON.parse(env.saved).length, 2, "Les deux tâches doivent être sauvegardées");
  }],
  ["Thème système et préférence sauvegardée", async () => {
    const env = environment();
    env.systemDark = true;
    let doc = await openApp(env);
    same(doc.documentElement.dataset.theme, "dark", "Le thème système doit être utilisé par défaut");
    assert(doc.querySelector("#theme-toggle").getAttribute("aria-pressed") === "true", "Le mode sombre doit être annoncé comme actif");
    env.themeListener({ matches: false });
    same(doc.documentElement.dataset.theme, "light", "Le thème système doit être suivi tant qu'aucun choix n'est enregistré");
    doc.querySelector("#theme-toggle").click();
    same(env.theme, "dark", "Le choix doit être sauvegardé");
    env.themeListener({ matches: false });
    same(doc.documentElement.dataset.theme, "dark", "Le choix manuel doit primer sur le système");
    doc = await openApp(env);
    same(doc.documentElement.dataset.theme, "dark", "Le choix doit être rechargé");
    doc.querySelector("#theme-toggle").click();
    same(env.theme, "light", "Le retour au mode clair doit être sauvegardé");
  }],
  ["Échec de sauvegarde du thème", async () => {
    const env = environment();
    const doc = await openApp(env);
    env.failWrite = true;
    doc.querySelector("#theme-toggle").click();
    same(doc.documentElement.dataset.theme, "dark", "Le thème doit changer pour la page courante");
    assert(!doc.querySelector("#theme-warning").hidden, "L'échec de sauvegarde du thème doit être signalé");
    env.failWrite = false;
    doc.querySelector("#theme-toggle").click();
    assert(doc.querySelector("#theme-warning").hidden, "L'avertissement doit disparaître après sauvegarde réussie");
  }],
  ["Tâches et retard en mode sombre", async () => {
    const env = environment();
    env.theme = "dark";
    let doc = await openApp(env);
    add(doc, "En retard", "urgent", "2026-11-23");
    const item = task(doc, "En retard");
    const color = doc.defaultView.getComputedStyle(item.querySelector(".task-text")).color;
    const components = color.match(/\d+/g).map(Number);
    assert(components[0] > components[1] && components[0] > components[2], "Le texte en retard doit rester rouge");
    doc = await openApp(env);
    assert(task(doc, "En retard").classList.contains("overdue"), "La tâche en retard doit rester sauvegardée");
  }]
];

async function runTests() {
  runButton.disabled = true;
  results.replaceChildren();
  summary.textContent = "Tests en cours…";
  let failures = 0;
  try {
    fixtureHtml = await readFixture();
    for (const [name, run] of tests) {
      const result = document.createElement("li");
      try {
        await run();
        result.textContent = `✓ ${name}`;
      } catch (error) {
        failures++;
        result.textContent = `✗ ${name} : ${error.message}`;
        console.error(name, error);
      }
      results.append(result);
    }
    summary.textContent = `${tests.length - failures}/${tests.length} tests réussis.`;
    summary.dataset.status = failures ? "failure" : "success";
  } catch (error) {
    summary.textContent = `Impossible de lancer les tests : ${error.message}`;
    summary.dataset.status = "failure";
    console.error(error);
  } finally {
    if (frame) frame.remove();
    delete window.testEnvironment;
    runButton.disabled = false;
  }
}

runButton.addEventListener("click", runTests);
runTests();
