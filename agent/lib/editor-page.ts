// Single-page browser editor served by agent/channels/editor.ts.
// Plain HTML/CSS/JS with no build step; the server does all OOXML work.
// Written with String.raw so client-side escapes survive — avoid `${` here.

export const editorPage = String.raw`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Рецензент Word</title>
<link rel="icon" href="data:,">
<style>
  :root {
    --bg: #f3f2ef; --panel: #ffffff; --paper: #ffffff; --ink: #1f2328; --muted: #6b6f76;
    --line: #e2e0db; --accent: #2457c5; --accent-ink: #ffffff; --danger: #b42318;
    --hover: #f6f8fd; --shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bg: #17181b; --panel: #202226; --ink: #e8e8e6; --muted: #a0a3a8; --line: #33363b;
      --accent: #7ea2ff; --accent-ink: #0d1117; --danger: #ff8a7a; --hover: #2a2d33; color-scheme: dark; }
  }
  :root[data-theme="dark"] { --bg: #17181b; --panel: #202226; --ink: #e8e8e6; --muted: #a0a3a8; --line: #33363b;
    --accent: #7ea2ff; --accent-ink: #0d1117; --danger: #ff8a7a; --hover: #2a2d33; color-scheme: dark; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body { margin: 0; background: var(--bg); color: var(--ink);
    font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  button, input, textarea { font: inherit; color: inherit; }
  button { border: 1px solid var(--line); background: var(--panel); border-radius: 8px;
    padding: 6px 12px; cursor: pointer; white-space: nowrap; }
  button:hover:not(:disabled) { background: var(--hover); }
  button:disabled { opacity: .45; cursor: default; }
  button.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  button.primary:hover:not(:disabled) { filter: brightness(1.08); background: var(--accent); }
  button.danger { color: var(--danger); }
  button.small { padding: 3px 8px; font-size: 12px; }
  input[type=text], textarea { border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px;
    background: var(--panel); }
  input[type=text]:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: -1px; }

  header { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 10; display: flex; flex-wrap: wrap; gap: 8px;
    align-items: center; padding: 10px 16px; background: var(--panel); border-bottom: 1px solid var(--line); }
  header .brand { font-weight: 650; margin-right: 8px; }
  header .file { color: var(--muted); max-width: 30ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  header .spacer { flex: 1; }
  header label { display: flex; align-items: center; gap: 6px; color: var(--muted); }
  header input[type=text] { width: 14ch; }
  .seg-toggle { display: inline-flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .seg-toggle button { border: 0; border-radius: 0; }
  .seg-toggle button[aria-pressed=true] { background: var(--accent); color: var(--accent-ink); }

  main { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px;
    max-width: 1240px; margin: 20px auto; padding: 0 16px; }
  @media (max-width: 900px) { main { grid-template-columns: 1fr; } }

  .paper { background: var(--paper); color: #1f2328; box-shadow: var(--shadow); border-radius: 4px;
    padding: 56px 64px; min-height: 70vh; font: 15px/1.6 Georgia, "Times New Roman", serif; }
  @media (max-width: 700px) { .paper { padding: 28px 18px; } }
  .para { position: relative; padding: 2px 6px; margin: 0 -6px 6px; border-radius: 4px;
    white-space: pre-wrap; word-wrap: break-word; cursor: text; min-height: 1.6em; }
  .para:hover { background: #f6f8fd; }
  .para.h1 { font-size: 1.5em; font-weight: 700; margin-top: 10px; }
  .para.h2 { font-size: 1.25em; font-weight: 700; margin-top: 8px; }
  .para.h3 { font-weight: 700; }
  .para.cell { border-left: 3px solid #e2e0db; padding-left: 10px; font-size: .95em; }
  .para .num { position: absolute; left: -44px; top: 3px; width: 32px; text-align: right;
    font: 11px system-ui, sans-serif; color: #a0a3a8; user-select: none; }
  .ins { text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 2px; }
  .del { text-decoration: line-through; opacity: .85; }
  .final .del, .final .cmark { display: none; }
  .final .ins { text-decoration: none; color: inherit !important; }
  .cmark { font: 600 10px system-ui, sans-serif; vertical-align: super; margin: 0 1px; padding: 0 4px;
    border-radius: 6px; background: #fff1b8; color: #6b4e00; cursor: pointer; user-select: none; }
  .para.editing { background: #f6f8fd; cursor: default; }
  .para textarea { width: 100%; min-height: 3em; resize: vertical; border-radius: 6px; padding: 8px 10px;
    font: 15px/1.6 Georgia, "Times New Roman", serif; background: #fff; color: #1f2328; border: 1px solid #c9d4ee; }
  .edit-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font: 13px system-ui, sans-serif; color: #1f2328; }
  .edit-bar input { flex: 1; min-width: 12ch; background: #fff; color: #1f2328; border-color: #d0d4dc; }
  .edit-bar button { background: #fff; color: #1f2328; border-color: #d0d4dc; }
  .edit-bar button.primary { background: #2457c5; color: #fff; border-color: #2457c5; }
  .edit-bar .hint { color: #6b6f76; align-self: center; font-size: 12px; }

  aside { display: flex; flex-direction: column; gap: 16px; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
  .card h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
  .row { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
  .row { flex-wrap: wrap; }
  .row .name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
  .muted { color: var(--muted); }
  .comment { border-left: 3px solid #f5c400; padding: 6px 10px; margin: 8px 0; border-radius: 0 6px 6px 0;
    background: var(--hover); cursor: pointer; }
  .comment.flash { outline: 2px solid var(--accent); }
  .comment .who { font-weight: 600; font-size: 12px; }
  .comment .text { white-space: pre-wrap; }
  .btns { display: flex; flex-wrap: wrap; gap: 6px; }

  .empty { display: grid; place-items: center; text-align: center; min-height: 60vh; border: 2px dashed var(--line);
    border-radius: 12px; background: var(--panel); padding: 24px; }
  .empty.drag { border-color: var(--accent); background: var(--hover); }
  .empty h2 { margin: 0 0 6px; font-size: 20px; }
  .empty p { margin: 0 0 16px; color: var(--muted); max-width: 46ch; }

  #selBtn { position: absolute; z-index: 20; display: none; box-shadow: var(--shadow); }
  #pop { position: absolute; z-index: 21; display: none; width: 300px; background: var(--panel);
    border: 1px solid var(--line); border-radius: 10px; padding: 10px; box-shadow: var(--shadow); }
  #pop textarea { width: 100%; min-height: 70px; margin-bottom: 8px; }
  #pop .quote { font-size: 12px; color: var(--muted); margin-bottom: 6px; max-height: 3.2em; overflow: hidden; }
  #aiTask { width: 100%; resize: vertical; }
  #toast { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 30; display: none;
    max-width: min(560px, calc(100vw - 32px)); padding: 10px 14px; border-radius: 10px; background: #1f2328;
    color: #fff; box-shadow: var(--shadow); }
  #toast.err { background: #b42318; }
  .busy { cursor: progress; }
</style>
</head>
<body>
<header>
  <span class="brand">Рецензент Word</span>
  <button class="primary" id="openBtn">Открыть .docx</button>
  <span class="file" id="fileName"></span>
  <span class="spacer"></span>
  <label>Автор <input type="text" id="author" placeholder="Ваше имя"></label>
  <span class="seg-toggle" role="group" aria-label="Вид">
    <button id="viewMarkup" aria-pressed="true">С исправлениями</button>
    <button id="viewFinal" aria-pressed="false">Итог</button>
  </span>
  <button id="undoBtn" disabled title="Ctrl+Z">Отменить</button>
  <button class="primary" id="saveBtn" disabled>Скачать</button>
  <input type="file" id="fileInput" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden>
</header>

<main>
  <section>
    <div class="empty" id="empty">
      <div>
        <h2>Откройте документ Word</h2>
        <p>Перетащите .docx сюда или нажмите «Открыть». Щёлкните по абзацу, чтобы править его как обычный текст:
          каждое изменение сохранится как исправление Word, которое можно принять или отклонить.
          Выделите текст, чтобы оставить примечание.</p>
        <button class="primary" id="openBtn2">Открыть .docx</button>
      </div>
    </div>
    <div class="paper" id="paper" hidden></div>
  </section>
  <aside id="side" hidden>
    <div class="card" id="aiCard" hidden>
      <h3>Исправить с ИИ</h3>
      <textarea id="aiTask" rows="3" placeholder="Что проверить? По умолчанию: орфография, пунктуация, грамматика, опечатки."></textarea>
      <div class="btns" style="margin-top:8px">
        <button class="primary" id="aiRun">Исправить с ИИ</button>
        <button id="aiStop" hidden>Остановить</button>
      </div>
      <div class="muted" id="aiStatus" style="margin-top:8px"></div>
    </div>
    <div class="card">
      <h3>Исправления</h3>
      <div id="revList"></div>
      <div class="btns" style="margin-top:10px">
        <button id="acceptAll">Принять все</button>
        <button id="rejectAll" class="danger">Отклонить все</button>
      </div>
      <div class="row" style="margin-top:12px">
        <span class="name muted" id="trackState"></span>
        <button class="small" id="trackToggle"></button>
      </div>
    </div>
    <div class="card">
      <h3>Примечания</h3>
      <div id="commentList"></div>
    </div>
  </aside>
</main>

<button id="selBtn" class="primary small">Примечание</button>
<div id="pop">
  <div class="quote" id="popQuote"></div>
  <textarea id="popText" placeholder="Текст примечания"></textarea>
  <div class="btns"><button class="primary small" id="popAdd">Добавить</button><button class="small" id="popCancel">Отмена</button></div>
</div>
<div id="toast"></div>

<script>
(function () {
  var API = location.pathname.replace(/\/$/, "") + "/api/";
  var state = { b64: null, name: "", doc: null, history: [], showMarkup: true, editing: null, selection: null };
  var COLORS = ["#2457c5", "#b4236e", "#0f7b5f", "#a8590a", "#6d3fc0", "#0b7285", "#c2410c"];
  var $ = function (id) { return document.getElementById(id); };

  // ---------- helpers ----------
  function colorFor(author) {
    var h = 0; author = author || "";
    for (var i = 0; i < author.length; i++) h = (h * 31 + author.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = $("toast"); t.textContent = msg; t.className = isErr ? "err" : ""; t.style.display = "block";
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.style.display = "none"; }, isErr ? 7000 : 3000);
  }
  function b64ToBlob(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  function author() { return $("author").value.trim() || "Рецензент"; }
  try { $("author").value = localStorage.getItem("review-author") || ""; } catch (e) {}
  $("author").addEventListener("change", function () { try { localStorage.setItem("review-author", $("author").value); } catch (e) {} });

  // ---------- server calls ----------
  // When the docx library is bundled into the page (standalone build), work
  // locally instead of calling the server.
  function bytesToB64(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(out);
  }
  function localCall(endpoint, fields, blob) {
    var R = window.DocxReview, extra = {};
    document.body.classList.add("busy");
    return (blob || b64ToBlob(state.b64)).arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      if (endpoint === "apply") {
        return R.applyReview(bytes, JSON.parse(fields.operations), { author: fields.author, enableTracking: true })
          .then(function (r) { extra.results = r.results; return r.bytes; });
      }
      if (endpoint === "resolve") {
        if (fields.mode === "accept" || fields.mode === "reject") {
          return R.resolveRevisions(bytes, { mode: fields.mode, author: fields.author || undefined }).then(function (r) { return r.bytes; });
        }
        return R.setTracking(bytes, fields.mode === "tracking-on");
      }
      return bytes;
    }).then(function (bytes) {
      return R.readDocx(bytes).then(function (doc) {
        return Object.assign({ ok: true, document: doc, docx: bytesToB64(bytes) }, extra);
      });
    }).finally(function () { document.body.classList.remove("busy"); });
  }
  function call(endpoint, fields, blob) {
    if (window.DocxReview) return localCall(endpoint, fields, blob);
    var form = new FormData();
    form.append("file", blob || b64ToBlob(state.b64), state.name || "document.docx");
    Object.keys(fields || {}).forEach(function (k) { if (fields[k] != null) form.append(k, fields[k]); });
    document.body.classList.add("busy");
    return fetch(API + endpoint, { method: "POST", body: form, credentials: "same-origin" })
      .then(function (r) {
        return r.json().catch(function () { throw new Error("Сервер вернул " + r.status); }).then(function (j) {
          if (!r.ok || !j.ok) throw new Error(j.error || ("Ошибка " + r.status));
          return j;
        });
      })
      .finally(function () { document.body.classList.remove("busy"); });
  }
  function commit(res, keepHistory) {
    if (keepHistory && state.b64) state.history.push({ b64: state.b64, doc: state.doc });
    state.b64 = res.docx; state.doc = res.document; state.editing = null;
    render();
    var failed = (res.results || []).filter(function (r) { return !r.ok; });
    if (failed.length) toast(failed.map(function (r) { return r.message; }).join("\n"), true);
  }
  function apply(ops) {
    return call("apply", { operations: JSON.stringify(ops), author: author() })
      .then(function (res) { commit(res, true); return true; })
      .catch(function (e) { toast(e.message, true); return false; });
  }
  function resolve(mode, who) {
    return call("resolve", { mode: mode, author: who })
      .then(function (res) { commit(res, true); })
      .catch(function (e) { toast(e.message, true); });
  }

  // ---------- open / save ----------
  function openFile(file) {
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) { toast("Нужен файл .docx. Старый .doc сохраните в Word как .docx.", true); return; }
    state.name = file.name;
    call("open", {}, file).then(function (res) {
      state.history = []; commit(res, false);
      $("fileName").textContent = file.name;
    }).catch(function (e) { toast(e.message, true); });
  }
  $("openBtn").onclick = $("openBtn2").onclick = function () { $("fileInput").click(); };
  $("fileInput").onchange = function () { openFile(this.files[0]); this.value = ""; };
  var drop = $("empty");
  ["dragenter", "dragover"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("drag"); }); });
  document.addEventListener("drop", function (e) { openFile(e.dataTransfer.files[0]); });
  var downloads = null;
  if (window.claude && window.claude.use) {
    window.claude.use("downloads").then(function (d) { downloads = d; }, function () {});
  }
  $("saveBtn").onclick = function () {
    var filename = state.name.replace(/\.docx$/i, "").replace(/_рецензия$/, "") + "_рецензия.docx";
    if (downloads) {
      downloads.save({ filename: filename, data: b64ToBlob(state.b64) })
        .then(function () { toast("Файл сохранён"); })
        .catch(function (e) { if (e && e.code !== "declined") toast("Не удалось сохранить файл: " + (e.message || e.code), true); });
      return;
    }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b64ToBlob(state.b64));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  function undo() {
    var prev = state.history.pop(); if (!prev) return;
    state.b64 = prev.b64; state.doc = prev.doc; state.editing = null; render();
  }
  $("undoBtn").onclick = undo;
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !state.editing && state.history.length) { e.preventDefault(); undo(); }
  });
  function setView(markup) {
    state.showMarkup = markup;
    $("viewMarkup").setAttribute("aria-pressed", String(markup));
    $("viewFinal").setAttribute("aria-pressed", String(!markup));
    $("paper").classList.toggle("final", !markup);
  }
  $("viewMarkup").onclick = function () { setView(true); };
  $("viewFinal").onclick = function () { setView(false); };

  // ---------- rendering ----------
  function headingClass(style) {
    if (!style) return "";
    var s = style.toLowerCase();
    if (/^(title|заголовок)$/.test(s) || /heading1|заголовок1|^1$/.test(s)) return "h1";
    if (/heading2|заголовок2/.test(s)) return "h2";
    if (/heading[3-9]|заголовок[3-9]/.test(s)) return "h3";
    return "";
  }
  function renderParagraph(p) {
    var div = el("div", "para " + headingClass(p.style) + (p.inTable ? " cell" : ""));
    div.dataset.i = p.index;
    div.appendChild(el("span", "num", String(p.index + 1)));
    p.segments.forEach(function (s) {
      if (s.kind === "comment") {
        var m = el("span", "cmark", "#" + s.id); m.dataset.cid = s.id; div.appendChild(m); return;
      }
      var span = el("span", s.kind === "text" ? "" : s.kind, s.text);
      if (s.kind !== "text") { span.style.color = colorFor(s.author); span.title = (s.kind === "ins" ? "Вставлено: " : "Удалено: ") + (s.author || ""); }
      div.appendChild(span);
    });
    return div;
  }
  function render() {
    var has = !!state.doc;
    $("empty").hidden = has; $("paper").hidden = !has; $("side").hidden = !has;
    $("saveBtn").disabled = !has; $("undoBtn").disabled = !state.history.length;
    $("aiCard").hidden = !sample;
    if (!has) return;
    var paper = $("paper"); paper.textContent = "";
    state.doc.paragraphs.forEach(function (p) { paper.appendChild(renderParagraph(p)); });
    renderSide();
  }
  function renderSide() {
    var doc = state.doc, byAuthor = {};
    doc.revisions.forEach(function (r) { byAuthor[r.author] = (byAuthor[r.author] || 0) + 1; });
    var list = $("revList"); list.textContent = "";
    var authors = Object.keys(byAuthor);
    if (!authors.length) list.appendChild(el("div", "muted", "Исправлений нет"));
    authors.forEach(function (a) {
      var row = el("div", "row");
      var dot = el("span", "dot"); dot.style.background = colorFor(a);
      row.appendChild(dot);
      row.appendChild(el("span", "name", (a || "Без имени") + " · " + byAuthor[a]));
      var ok = el("button", "small", "Принять"); ok.title = "Принять исправления автора";
      ok.onclick = function () { resolve("accept", a); };
      var no = el("button", "small danger", "Отклонить"); no.title = "Отклонить исправления автора";
      no.onclick = function () { resolve("reject", a); };
      row.appendChild(ok); row.appendChild(no); list.appendChild(row);
    });
    $("acceptAll").disabled = $("rejectAll").disabled = !authors.length;
    $("trackState").textContent = doc.trackRevisionsEnabled ? "Запись исправлений в Word: вкл." : "Запись исправлений в Word: выкл.";
    $("trackToggle").textContent = doc.trackRevisionsEnabled ? "Выключить" : "Включить";
    var cl = $("commentList"); cl.textContent = "";
    if (!doc.comments.length) cl.appendChild(el("div", "muted", "Примечаний нет"));
    doc.comments.forEach(function (c) {
      var box = el("div", "comment"); box.dataset.cid = c.id;
      box.appendChild(el("div", "who", "#" + c.id + " · " + (c.author || "")));
      box.appendChild(el("div", "text", c.text));
      box.onclick = function () {
        var m = document.querySelector('.cmark[data-cid="' + c.id + '"]');
        if (m) m.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      cl.appendChild(box);
    });
  }
  $("acceptAll").onclick = function () { resolve("accept"); };
  var rejectArmed = null;
  $("rejectAll").onclick = function () {
    var btn = $("rejectAll");
    if (!rejectArmed) {
      btn.textContent = "Точно отклонить все?";
      rejectArmed = setTimeout(function () { rejectArmed = null; btn.textContent = "Отклонить все"; }, 4000);
      return;
    }
    clearTimeout(rejectArmed); rejectArmed = null; btn.textContent = "Отклонить все";
    resolve("reject");
  };
  $("trackToggle").onclick = function () { resolve(state.doc.trackRevisionsEnabled ? "tracking-off" : "tracking-on"); };

  // ---------- AI review (Claude, via the artifact "sample" capability) ----------
  var sample = null, aiCtl = null;
  var AI_AUTHOR = "ИИ-рецензент";
  if (window.claude && window.claude.use) {
    window.claude.use("sample").then(function (fn) { sample = fn; render(); }, function () {});
  }
  function aiStatus(text) { $("aiStatus").textContent = text; }
  function aiChunks(paragraphs) {
    var chunks = [], cur = [], size = 0;
    paragraphs.forEach(function (p) {
      if (!p.plain.trim()) return;
      if (size + p.plain.length > 12000 && cur.length) { chunks.push(cur); cur = []; size = 0; }
      cur.push(p); size += p.plain.length;
    });
    if (cur.length) chunks.push(cur);
    return chunks;
  }
  function aiPrompt(task, chunk) {
    return [
      "Ты — профессиональный редактор и корректор документов на русском языке (и на языке документа, если он другой).",
      "Задание рецензента: " + (task || "вычитка: исправь орфографию, пунктуацию, грамматику, опечатки, явные ошибки согласования. Смысл, термины, цифры, названия и юридические формулировки не меняй."),
      "",
      "Ниже абзацы документа в формате JSON: i — номер абзаца, t — текст. Символ табуляции внутри текста сохраняй как есть.",
      JSON.stringify(chunk.map(function (p) { return { i: p.index, t: p.plain }; })),
      "",
      "Верни ТОЛЬКО JSON такого вида:",
      '{"edits":[{"i":3,"text":"полный исправленный текст абзаца","why":"короткое пояснение или пустая строка"}],"comments":[{"i":5,"quote":"точная цитата из абзаца","comment":"замечание"}]}',
      "Правила:",
      "- В edits включай только абзацы, которые действительно нужно изменить; text — весь абзац целиком после правки, меняй минимум слов.",
      "- why заполняй, когда правка неочевидна (не для простых опечаток).",
      "- comments — для замечаний, которые нельзя исправить без автора (противоречия, неясности, вопросы). quote копируй символ в символ.",
      "- Если исправлять нечего, верни {\"edits\":[],\"comments\":[]}."
    ].join("\n");
  }
  function aiRun() {
    if (!sample || !state.doc) return;
    var task = $("aiTask").value.trim();
    var chunks = aiChunks(state.doc.paragraphs);
    if (!chunks.length) { toast("В документе нет текста для проверки", true); return; }
    var byIndex = {}; state.doc.paragraphs.forEach(function (p) { byIndex[p.index] = p; });
    var comments = [], edits = [];
    aiCtl = new AbortController();
    $("aiRun").disabled = true; $("aiStop").hidden = false;
    var step = Promise.resolve();
    chunks.forEach(function (chunk, n) {
      step = step.then(function () {
        aiStatus("Claude читает документ" + (chunks.length > 1 ? " (часть " + (n + 1) + " из " + chunks.length + ")" : "") + "…");
        return sample.json(aiPrompt(task, chunk), {
          signal: aiCtl.signal, modelTier: "default",
          onText: function () { aiStatus("Claude пишет правки" + (chunks.length > 1 ? " (часть " + (n + 1) + " из " + chunks.length + ")" : "") + "…"); }
        }).then(function (res) {
          (res && res.edits || []).forEach(function (e) {
            var p = byIndex[e.i];
            if (!p || typeof e.text !== "string" || !e.text.trim() || e.text === p.plain) return;
            edits.push({ action: "edit_paragraph", paragraph: p.index, text: e.text.replace(/\r?\n+/g, " "), comment: (e.why || "").trim() || undefined });
          });
          (res && res.comments || []).forEach(function (c) {
            var p = byIndex[c.i];
            if (!p || !c.comment) return;
            var at = c.quote ? p.plain.indexOf(c.quote) : -1;
            var start = at >= 0 ? at : 0, end = at >= 0 ? at + c.quote.length : p.plain.length;
            if (end > start) comments.push({ action: "comment_range", paragraph: p.index, start: start, end: end, comment: String(c.comment) });
          });
        });
      });
    });
    step.then(function () {
      if (!edits.length && !comments.length) { aiStatus("Claude не нашёл, что исправить."); return; }
      aiStatus("Вношу правки…");
      // Comments first: their offsets refer to the text before the edits.
      return call("apply", { operations: JSON.stringify(comments.concat(edits)), author: AI_AUTHOR }).then(function (res) {
        commit(res, true);
        var ok = (res.results || []).filter(function (r) { return r.ok; }).length;
        aiStatus("Готово. Исправлено абзацев: " + edits.length + ", примечаний: " + comments.length + ". Проверьте правки и примите или отклоните их.");
        if (ok < comments.length + edits.length) toast("Часть правок ИИ не удалось внести", true);
      });
    }).catch(function (e) {
      var code = e && e.code;
      if (code === "cancelled") aiStatus("Остановлено.");
      else if (code === "not_granted") aiStatus("Доступ к Claude не разрешён для этой страницы.");
      else if (code === "rate_limited") aiStatus("Слишком много запросов. Подождите минуту и попробуйте снова.");
      else aiStatus("Не получилось: " + ((e && e.message) || code || e));
    }).finally(function () {
      $("aiRun").disabled = false; $("aiStop").hidden = true; aiCtl = null;
    });
  }
  $("aiRun").onclick = aiRun;
  $("aiStop").onclick = function () { if (aiCtl) aiCtl.abort(); };

  // ---------- paragraph editing ----------
  function startEdit(div, opts) {
    if (state.editing) return;
    var i = Number(div.dataset.i), p = state.doc.paragraphs[i];
    var isNew = !!(opts && opts.newAfter);
    var host = div;
    if (isNew) { host = el("div", "para"); div.parentNode.insertBefore(host, div.nextSibling); }
    state.editing = host;
    var original = isNew ? "" : p.plain;
    var saved = host.cloneNode(true);
    host.classList.add("editing"); host.textContent = "";
    var ta = el("textarea"); ta.value = original; host.appendChild(ta);
    var bar = el("div", "edit-bar");
    var note = el("input"); note.type = "text"; note.placeholder = "Пояснение к правке (необязательно)";
    var save = el("button", "primary", "Сохранить");
    var cancel = el("button", "", "Отмена");
    bar.appendChild(note); bar.appendChild(save); bar.appendChild(cancel);
    if (!isNew) {
      var addAfter = el("button", "", "+ Абзац после");
      var del = el("button", "danger", "Удалить абзац");
      bar.appendChild(addAfter); bar.appendChild(del);
      addAfter.onclick = function () { finish(); startEdit(saved, { newAfter: true }); };
      del.onclick = function () { send([{ action: "delete_paragraph", paragraph: i, comment: note.value.trim() || undefined }]); };
    }
    bar.appendChild(el("span", "hint", "Ctrl+Enter — сохранить, Esc — отмена"));
    host.appendChild(bar);
    function grow() { ta.style.height = "auto"; ta.style.height = (ta.scrollHeight + 2) + "px"; }
    ta.addEventListener("input", grow); grow(); ta.focus();
    function finish() {
      state.editing = null;
      if (isNew) host.remove(); else host.replaceWith(saved);
    }
    function send(ops) {
      save.disabled = true;
      apply(ops).then(function (ok) { if (!ok) save.disabled = false; });
    }
    save.onclick = function () {
      var text = ta.value.replace(/\r/g, "").replace(/\n+/g, " ");
      var comment = note.value.trim() || undefined;
      if (isNew) {
        if (!text.trim()) { finish(); return; }
        send([{ action: "insert_paragraph", paragraph: i, position: "after", text: text, comment: comment }]);
      } else if (text === original) {
        if (comment) send([{ action: "comment_range", paragraph: i, start: 0, end: original.length, comment: comment }]);
        else finish();
      } else {
        send([{ action: "edit_paragraph", paragraph: i, text: text, comment: comment }]);
      }
    };
    cancel.onclick = finish;
    host.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); finish(); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save.click(); }
    });
  }

  // ---------- selection comments ----------
  function plainOffset(para, node, offset) {
    var r = document.createRange();
    r.setStart(para, 0); r.setEnd(node, offset);
    var frag = r.cloneContents();
    frag.querySelectorAll(".del, .cmark, .num").forEach(function (n) { n.remove(); });
    return frag.textContent.length;
  }
  function hideSel() { $("selBtn").style.display = "none"; }
  $("paper").addEventListener("mouseup", function (e) {
    if (state.editing) return;
    setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        hideSel();
        var cm = e.target.closest && e.target.closest(".cmark");
        if (cm) {
          var box = document.querySelector('.comment[data-cid="' + cm.dataset.cid + '"]');
          if (box) { box.scrollIntoView({ behavior: "smooth", block: "nearest" }); box.classList.add("flash"); setTimeout(function () { box.classList.remove("flash"); }, 1200); }
          return;
        }
        var para = e.target.closest && e.target.closest(".para");
        if (para && para.dataset.i != null) startEdit(para);
        return;
      }
      var range = sel.getRangeAt(0);
      var a = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
      var b = range.endContainer.nodeType === 1 ? range.endContainer : range.endContainer.parentElement;
      var pa = a.closest(".para"), pb = b.closest(".para");
      if (!pa || pa !== pb) { hideSel(); toast("Выделяйте текст в пределах одного абзаца", true); return; }
      var start = plainOffset(pa, range.startContainer, range.startOffset);
      var end = plainOffset(pa, range.endContainer, range.endOffset);
      if (end <= start) { hideSel(); return; }
      state.selection = { paragraph: Number(pa.dataset.i), start: start, end: end, text: sel.toString() };
      var rect = range.getBoundingClientRect();
      var btn = $("selBtn");
      btn.style.display = "block";
      btn.style.left = (window.scrollX + rect.right - btn.offsetWidth) + "px";
      btn.style.top = (window.scrollY + rect.top - btn.offsetHeight - 6) + "px";
    }, 0);
  });
  $("selBtn").addEventListener("mousedown", function (e) { e.preventDefault(); });
  $("selBtn").onclick = function () {
    var btn = $("selBtn"), pop = $("pop");
    pop.style.display = "block";
    pop.style.left = Math.max(8, Math.min(parseFloat(btn.style.left), window.scrollX + document.documentElement.clientWidth - 310)) + "px";
    pop.style.top = (parseFloat(btn.style.top) + btn.offsetHeight + 8) + "px";
    $("popQuote").textContent = "«" + state.selection.text + "»";
    $("popText").value = ""; $("popText").focus(); hideSel();
  };
  $("popCancel").onclick = function () { $("pop").style.display = "none"; };
  $("popAdd").onclick = function () {
    var text = $("popText").value.trim(); if (!text) return;
    var s = state.selection;
    $("pop").style.display = "none";
    apply([{ action: "comment_range", paragraph: s.paragraph, start: s.start, end: s.end, comment: text }]);
  };
  $("popText").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("popAdd").click();
    if (e.key === "Escape") $("popCancel").click();
  });
  document.addEventListener("mousedown", function (e) {
    if (!e.target.closest("#pop") && !e.target.closest("#selBtn")) { $("pop").style.display = "none"; }
  });

  render();
})();
</script>
</body>
</html>`;
