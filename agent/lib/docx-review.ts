// Word "review mode" (track changes) helpers.
//
// Everything here works on raw .docx bytes so the tools can stay thin: they
// read the file from the sandbox, call one of these functions, and write the
// result back. Edits are written as real OOXML revisions (<w:ins>/<w:del>)
// and comments, so Word shows them in the Review pane where the author can
// accept or reject each one.

import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types";
const COMMENTS_REL =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments";
const COMMENTS_CT =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml";

type XDoc = ReturnType<DOMParser["parseFromString"]>;
type XNode = NonNullable<XDoc["documentElement"]>["firstChild"] & {};
type XEl = NonNullable<XDoc["documentElement"]>;

// ---------------------------------------------------------------------------
// Public types

export interface ParagraphSegment {
  text: string;
  kind: "text" | "ins" | "del" | "comment";
  author?: string;
  /** Comment id for `comment` segments. */
  id?: string;
}

export interface ParagraphInfo {
  index: number;
  text: string;
  /** Current text with deletions removed — what edit_paragraph and comment_range offsets refer to. */
  plain: string;
  segments: ParagraphSegment[];
  style?: string;
  inTable: boolean;
}

export interface CommentInfo {
  id: string;
  author: string;
  date?: string;
  text: string;
}

export interface RevisionInfo {
  type: "insertion" | "deletion" | "formatting" | "paragraph";
  author: string;
  date?: string;
  text: string;
  paragraph: number;
}

export interface DocxOverview {
  paragraphCount: number;
  paragraphs: ParagraphInfo[];
  comments: CommentInfo[];
  revisions: RevisionInfo[];
  trackRevisionsEnabled: boolean;
}

interface Located {
  find: string;
  /** Restrict the search to one paragraph (index from readDocx). */
  paragraph?: number;
  /** 1-based occurrence when `find` matches more than once. */
  occurrence?: number;
}

export type ReviewOperation =
  | ({ action: "replace"; replace: string; comment?: string } & Located)
  | ({ action: "delete"; comment?: string } & Located)
  | ({
      action: "insert";
      position: "before" | "after";
      text: string;
      comment?: string;
    } & Located)
  | ({ action: "comment"; comment: string } & Located)
  | {
      action: "insert_paragraph";
      paragraph: number;
      position: "before" | "after";
      text: string;
      comment?: string;
    }
  | { action: "delete_paragraph"; paragraph: number; comment?: string }
  /** Rewrite a paragraph; only the words that differ become tracked changes. */
  | { action: "edit_paragraph"; paragraph: number; text: string; comment?: string }
  /** Comment on a character range of a paragraph's current text. */
  | { action: "comment_range"; paragraph: number; start: number; end: number; comment: string };

export interface ReviewOptions {
  author: string;
  initials?: string;
  /** Turn on Word's "Track Changes" so the recipient's own edits are tracked too. */
  enableTracking?: boolean;
  date?: Date;
}

export interface OperationResult {
  index: number;
  action: ReviewOperation["action"];
  ok: boolean;
  message: string;
}

export interface ResolveOptions {
  mode: "accept" | "reject";
  /** Only resolve revisions by this author. */
  author?: string;
}

// ---------------------------------------------------------------------------
// Package helpers

interface DocxPackage {
  zip: JSZip;
  doc: XDoc;
}

async function openDocx(bytes: Uint8Array): Promise<DocxPackage> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error("File is not a valid .docx (zip) archive. Legacy .doc files are not supported.");
  }
  const doc = await readXml(zip, "word/document.xml");
  if (!doc) throw new Error("word/document.xml is missing — this is not a Word document.");
  return { zip, doc };
}

async function readXml(zip: JSZip, path: string): Promise<XDoc | null> {
  const file = zip.file(path);
  if (!file) return null;
  const text = await file.async("string");
  return new DOMParser().parseFromString(text, "text/xml");
}

function writeXml(zip: JSZip, path: string, doc: XDoc) {
  let xml = new XMLSerializer().serializeToString(doc);
  if (!xml.startsWith("<?xml")) {
    xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`;
  }
  zip.file(path, xml);
}

async function saveDocx(zip: JSZip): Promise<Uint8Array> {
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

// ---------------------------------------------------------------------------
// DOM helpers

function isW(node: XNode | null | undefined, local?: string): node is XEl {
  return (
    !!node &&
    node.nodeType === 1 &&
    (node as XEl).namespaceURI === W &&
    (local === undefined || (node as XEl).localName === local)
  );
}

function elementChildren(el: XEl): XEl[] {
  const out: XEl[] = [];
  for (let c = el.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1) out.push(c as XEl);
  }
  return out;
}

function child(el: XEl, local: string): XEl | undefined {
  return elementChildren(el).find((c) => isW(c, local));
}

function wAttr(el: XEl, name: string): string | undefined {
  const v = el.getAttributeNS(W, name);
  return v === null || v === "" ? undefined : v;
}

function setW(el: XEl, name: string, value: string) {
  el.setAttributeNS(W, `w:${name}`, value);
}

function createW(doc: XDoc, local: string): XEl {
  return doc.createElementNS(W, `w:${local}`) as XEl;
}

function insertAfter(node: XNode, ref: XNode) {
  ref.parentNode!.insertBefore(node, ref.nextSibling);
}

function hasAncestor(node: XNode, locals: string[], stop: XEl): boolean {
  for (let p = node.parentNode; p && p !== stop; p = p.parentNode) {
    if (isW(p as XNode) && locals.includes((p as XEl).localName!)) return true;
  }
  return false;
}

function allW(root: XDoc | XEl, local: string): XEl[] {
  return Array.from(root.getElementsByTagNameNS(W, local)) as XEl[];
}

/** Body paragraphs in document order, including table cells; skips VML fallbacks. */
function bodyParagraphs(doc: XDoc): XEl[] {
  const body = allW(doc, "body")[0];
  if (!body) return [];
  return allW(body, "p").filter((p) => {
    for (let a = p.parentNode; a && a !== body; a = a.parentNode) {
      if ((a as XEl).localName === "Fallback") return false;
      // Paragraphs inside text boxes live inside a run; don't count them twice.
      if (isW(a as XNode, "p")) return false;
    }
    return true;
  });
}

const CONTAINERS = new Set([
  "ins",
  "hyperlink",
  "smartTag",
  "sdt",
  "sdtContent",
  "customXml",
  "moveTo",
  "fldSimple",
  "dir",
  "bdo",
]);
const REVISION_CONTAINERS = new Set(["ins", "moveTo"]);

/** Runs that make up the current (non-deleted) text of a paragraph. */
function liveRuns(p: XEl): XEl[] {
  const out: XEl[] = [];
  const walk = (el: XEl) => {
    for (const c of elementChildren(el)) {
      if (!isW(c)) continue;
      if (c.localName === "r") out.push(c);
      else if (CONTAINERS.has(c.localName!)) walk(c);
    }
  };
  walk(p);
  return out;
}

function runContentText(el: XEl): string {
  switch (el.localName) {
    case "t":
      return el.textContent ?? "";
    case "tab":
    case "ptab":
      return "\t";
    case "br":
    case "cr":
      return "\n";
    case "noBreakHyphen":
      return "-";
    case "softHyphen":
      return "";
    case "sym":
      return wAttr(el, "char") ? String.fromCharCode(parseInt(wAttr(el, "char")!, 16)) : "";
    default:
      return "";
  }
}

function runText(r: XEl): string {
  return elementChildren(r)
    .filter((c) => isW(c) && c.localName !== "rPr")
    .map(runContentText)
    .join("");
}

function paragraphText(p: XEl): string {
  return liveRuns(p).map(runText).join("");
}

// ---------------------------------------------------------------------------
// Reading

/** Paragraph text including existing revisions as [+inserted+] / [-deleted-] markers. */
function annotatedText(p: XEl): string {
  let out = "";
  const walk = (el: XEl, mode: "" | "ins" | "del") => {
    for (const c of elementChildren(el)) {
      if (!isW(c)) continue;
      const local = c.localName!;
      if (local === "r") {
        let t = "";
        for (const rc of elementChildren(c)) {
          if (!isW(rc)) continue;
          if (rc.localName === "delText") t += rc.textContent ?? "";
          else if (rc.localName === "commentReference") t += `[comment #${wAttr(rc, "id")}]`;
          else t += runContentText(rc);
        }
        out += t;
      } else if (local === "ins" || local === "moveTo") {
        if (mode) walk(c, mode);
        else {
          out += "[+";
          walk(c, "ins");
          out += "+]";
        }
      } else if (local === "del" || local === "moveFrom") {
        if (mode === "del") walk(c, mode);
        else {
          out += "[-";
          walk(c, "del");
          out += "-]";
        }
      } else if (CONTAINERS.has(local)) {
        walk(c, mode);
      }
    }
  };
  walk(p, "");
  return out;
}

function paragraphSegments(p: XEl): ParagraphSegment[] {
  const out: ParagraphSegment[] = [];
  const push = (text: string, kind: ParagraphSegment["kind"], author?: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.kind === kind && last.author === author && kind !== "comment") last.text += text;
    else out.push({ text, kind, ...(author ? { author } : {}) });
  };
  const walk = (el: XEl, kind: "text" | "ins" | "del", author?: string) => {
    for (const c of elementChildren(el)) {
      if (!isW(c)) continue;
      const local = c.localName!;
      if (local === "r") {
        for (const rc of elementChildren(c)) {
          if (!isW(rc)) continue;
          if (rc.localName === "commentReference") {
            out.push({ text: "", kind: "comment", id: wAttr(rc, "id") });
          } else {
            push(rc.localName === "delText" ? (rc.textContent ?? "") : runContentText(rc), kind, author);
          }
        }
      } else if (local === "ins" || local === "moveTo") {
        walk(c, kind === "del" ? "del" : "ins", kind === "text" ? wAttr(c, "author") : author);
      } else if (local === "del" || local === "moveFrom") {
        walk(c, "del", kind === "del" ? author : wAttr(c, "author"));
      } else if (CONTAINERS.has(local)) {
        walk(c, kind, author);
      }
    }
  };
  walk(p, "text");
  return out;
}

/** Word-level diff of `a` → `b` as [start, end, replacement] hunks over `a`. */
function diffHunks(a: string, b: string): [number, number, string][] {
  const tok = (s: string) => s.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
  const x = tok(a);
  const y = tok(b);
  // Trim common prefix/suffix so the LCS table stays small for typical edits.
  let pre = 0;
  while (pre < x.length && pre < y.length && x[pre] === y[pre]) pre++;
  let suf = 0;
  while (suf < x.length - pre && suf < y.length - pre && x[x.length - 1 - suf] === y[y.length - 1 - suf]) suf++;
  const xs = x.slice(pre, x.length - suf);
  const ys = y.slice(pre, y.length - suf);
  if (xs.length * ys.length > 4_000_000) {
    const start = x.slice(0, pre).join("").length;
    return [[start, start + xs.join("").length, ys.join("")]];
  }
  const n = xs.length;
  const m = ys.length;
  const lcs: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = xs[i] === ys[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const hunks: [number, number, string][] = [];
  let pos = x.slice(0, pre).join("").length;
  let i = 0;
  let j = 0;
  let cur: [number, number, string] | null = null;
  const flush = () => {
    if (cur) hunks.push(cur);
    cur = null;
  };
  while (i < n || j < m) {
    if (i < n && j < m && xs[i] === ys[j]) {
      flush();
      pos += xs[i].length;
      i++;
      j++;
    } else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      cur ??= [pos, pos, ""];
      cur[2] += ys[j++];
    } else {
      cur ??= [pos, pos, ""];
      pos += xs[i].length;
      cur[1] = pos;
      i++;
    }
  }
  flush();
  // Merge hunks separated only by whitespace: "[-течении 10-][+течение 15+]" reads
  // better than two edits around an unchanged space.
  const merged: [number, number, string][] = [];
  for (const h of hunks) {
    const prev = merged[merged.length - 1];
    const gap = prev ? a.slice(prev[1], h[0]) : "";
    if (prev && /^\s*$/.test(gap)) {
      prev[1] = h[1];
      prev[2] += gap + h[2];
    } else merged.push([...h]);
  }
  return merged;
}

function paragraphStyle(p: XEl): string | undefined {
  const pPr = child(p, "pPr");
  const style = pPr && child(pPr, "pStyle");
  return style ? wAttr(style, "val") : undefined;
}

function collectRevisions(paragraphs: XEl[]): RevisionInfo[] {
  const out: RevisionInfo[] = [];
  paragraphs.forEach((p, index) => {
    for (const el of [
      ...allW(p, "ins"),
      ...allW(p, "del"),
      ...allW(p, "moveTo"),
      ...allW(p, "moveFrom"),
      ...allW(p, "rPrChange"),
      ...allW(p, "pPrChange"),
    ]) {
      const local = el.localName!;
      const parentLocal = (el.parentNode as XEl).localName;
      let type: RevisionInfo["type"];
      let text = "";
      if (local.endsWith("Change")) {
        type = "formatting";
        text = runText((el.parentNode!.parentNode as XEl) ?? el);
      } else if (parentLocal === "rPr") {
        type = "paragraph";
        text = local === "ins" ? "(paragraph break inserted)" : "(paragraph break deleted)";
      } else {
        type = local === "ins" || local === "moveTo" ? "insertion" : "deletion";
        text = allW(el, "r")
          .map((r) =>
            elementChildren(r)
              .map((c) => (isW(c, "delText") ? (c.textContent ?? "") : runContentText(c)))
              .join(""),
          )
          .join("");
      }
      out.push({
        type,
        author: wAttr(el, "author") ?? "",
        date: wAttr(el, "date"),
        text,
        paragraph: index,
      });
    }
  });
  return out;
}

async function readComments(zip: JSZip): Promise<CommentInfo[]> {
  const doc = await readXml(zip, "word/comments.xml");
  if (!doc) return [];
  return allW(doc, "comment").map((c) => ({
    id: wAttr(c, "id") ?? "",
    author: wAttr(c, "author") ?? "",
    date: wAttr(c, "date"),
    text: allW(c, "p")
      .map((p) => allW(p, "t").map((t) => t.textContent ?? "").join(""))
      .join("\n"),
  }));
}

export async function readDocx(bytes: Uint8Array): Promise<DocxOverview> {
  const { zip, doc } = await openDocx(bytes);
  const paragraphs = bodyParagraphs(doc);
  const settings = await readXml(zip, "word/settings.xml");
  return {
    paragraphCount: paragraphs.length,
    paragraphs: paragraphs.map((p, index) => ({
      index,
      text: annotatedText(p),
      plain: paragraphText(p),
      segments: paragraphSegments(p),
      style: paragraphStyle(p),
      inTable: hasAncestor(p, ["tc"], doc.documentElement as XEl),
    })),
    comments: await readComments(zip),
    revisions: collectRevisions(paragraphs),
    trackRevisionsEnabled: !!settings && allW(settings, "trackRevisions").length > 0,
  };
}

// ---------------------------------------------------------------------------
// Writing revisions

class Reviewer {
  private nextId: number;
  private readonly date: string;
  private commentsDoc: XDoc | null = null;
  private readonly paragraphs: XEl[];
  private readonly pkg: DocxPackage;
  private readonly opts: ReviewOptions;

  constructor(pkg: DocxPackage, existingComments: XDoc | null, opts: ReviewOptions) {
    this.pkg = pkg;
    this.opts = opts;
    this.commentsDoc = existingComments;
    this.date = (opts.date ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
    this.paragraphs = bodyParagraphs(pkg.doc);
    let max = 0;
    for (const d of [pkg.doc, existingComments]) {
      if (!d) continue;
      for (const local of [
        "ins",
        "del",
        "moveFrom",
        "moveTo",
        "rPrChange",
        "pPrChange",
        "comment",
        "commentRangeStart",
        "commentRangeEnd",
        "commentReference",
        "bookmarkStart",
      ]) {
        for (const el of allW(d, local)) {
          const id = Number(wAttr(el, "id"));
          if (Number.isFinite(id) && id > max) max = id;
        }
      }
    }
    this.nextId = max + 1;
  }

  get doc() {
    return this.pkg.doc;
  }

  get comments() {
    return this.commentsDoc;
  }

  private revision(local: "ins" | "del"): XEl {
    const el = createW(this.doc, local);
    setW(el, "id", String(this.nextId++));
    setW(el, "author", this.opts.author);
    setW(el, "date", this.date);
    return el;
  }

  // ---- locating text --------------------------------------------------------

  locate(op: Located): { p: XEl; start: number; end: number } {
    if (!op.find) throw new Error("`find` must not be empty.");
    const candidates =
      op.paragraph === undefined ? this.paragraphs.map((p, i) => [p, i] as const) : [[this.paragraph(op.paragraph), op.paragraph] as const];
    const hits: { p: XEl; index: number; start: number }[] = [];
    for (const [p, index] of candidates) {
      const text = paragraphText(p);
      for (let at = text.indexOf(op.find); at !== -1; at = text.indexOf(op.find, at + 1)) {
        hits.push({ p, index, start: at });
      }
    }
    if (hits.length === 0) {
      const norm = (s: string) =>
        s.replace(/[   ]/g, " ").replace(/[«»„“”"]/g, '"').replace(/[‘’']/g, "'").replace(/[–—]/g, "-");
      const loose = candidates.some(([p]) => norm(paragraphText(p)).includes(norm(op.find)));
      throw new Error(
        `Text not found: "${op.find}".` +
          (loose
            ? " A near match exists that differs in spaces, quotes or dashes — copy the exact characters from read_docx."
            : " Text must be copied exactly from read_docx and stay inside one paragraph."),
      );
    }
    if (op.occurrence !== undefined) {
      const hit = hits[op.occurrence - 1];
      if (!hit) throw new Error(`Only ${hits.length} occurrence(s) of "${op.find}" found.`);
      return { p: hit.p, start: hit.start, end: hit.start + op.find.length };
    }
    if (hits.length > 1) {
      const where = [...new Set(hits.map((h) => h.index))].join(", ");
      throw new Error(
        `"${op.find}" occurs ${hits.length} times (paragraphs ${where}). Add surrounding words, or pass \`paragraph\` / \`occurrence\`.`,
      );
    }
    return { p: hits[0].p, start: hits[0].start, end: hits[0].start + op.find.length };
  }

  paragraph(index: number): XEl {
    const p = this.paragraphs[index];
    if (!p) throw new Error(`Paragraph ${index} does not exist (document has ${this.paragraphs.length}).`);
    return p;
  }

  // ---- run surgery ----------------------------------------------------------

  /** Split runs so each holds one content element; returns [run, start, end] spans. */
  private atomize(p: XEl): { run: XEl; start: number; end: number }[] {
    for (const r of liveRuns(p)) {
      const rPr = child(r, "rPr");
      const content = elementChildren(r).filter((c) => !isW(c, "rPr"));
      if (content.length <= 1) continue;
      let anchor: XEl = r;
      for (const c of content.slice(1)) {
        const nr = createW(this.doc, "r");
        if (rPr) nr.appendChild(rPr.cloneNode(true));
        nr.appendChild(c);
        insertAfter(nr, anchor);
        anchor = nr;
      }
    }
    let pos = 0;
    return liveRuns(p).map((run) => {
      const len = runText(run).length;
      const span = { run, start: pos, end: pos + len };
      pos += len;
      return span;
    });
  }

  /** Ensure a run boundary exists at `offset`; returns the spans after splitting. */
  private splitAt(p: XEl, offset: number) {
    const spans = this.atomize(p);
    const span = spans.find((s) => s.start < offset && offset < s.end);
    if (!span) return spans;
    const t = child(span.run, "t");
    if (!t) return spans;
    const text = t.textContent ?? "";
    const k = offset - span.start;
    const clone = span.run.cloneNode(true) as XEl;
    setText(t, text.slice(0, k));
    setText(child(clone, "t")!, text.slice(k));
    insertAfter(clone, span.run);
    return this.atomize(p);
  }

  private runsIn(p: XEl, start: number, end: number): { inside: XEl[]; spans: ReturnType<Reviewer["atomize"]> } {
    this.splitAt(p, start);
    const spans = this.splitAt(p, end);
    const inside = spans
      .filter((s) => (s.end > s.start ? s.start >= start && s.end <= end : s.start > start && s.start < end))
      .map((s) => s.run);
    return { inside, spans };
  }

  /**
   * Find where a new sibling can be placed next to `node` without nesting our
   * revision inside someone else's <w:ins>/<w:moveTo>; splits that container
   * when needed.
   */
  private anchorOutside(node: XNode, side: "before" | "after"): { parent: XNode; ref: XNode | null } {
    let cur: XNode = node;
    while (isW(cur.parentNode as XNode) && REVISION_CONTAINERS.has((cur.parentNode as XEl).localName!)) {
      const container = cur.parentNode as XEl;
      const moving: XNode[] = [];
      for (let n = side === "after" ? cur.nextSibling : cur; n; n = n.nextSibling) moving.push(n);
      const hasBefore = side === "after" || !!cur.previousSibling;
      if (moving.length > 0 && hasBefore) {
        const clone = container.cloneNode(false) as XEl;
        setW(clone, "id", String(this.nextId++));
        for (const n of moving) clone.appendChild(n);
        insertAfter(clone, container);
        cur = side === "after" ? container : clone;
      } else {
        cur = container;
      }
    }
    return side === "after" ? { parent: cur.parentNode!, ref: cur.nextSibling } : { parent: cur.parentNode!, ref: cur };
  }

  private deleteRuns(runs: XEl[]): XEl[] {
    const wrappers: XEl[] = [];
    for (const r of runs) {
      for (const c of elementChildren(r)) {
        if (isW(c, "t")) replaceLocal(this.doc, c, "delText");
        else if (isW(c, "instrText")) replaceLocal(this.doc, c, "delInstrText");
      }
      const prev = r.previousSibling;
      const last = wrappers[wrappers.length - 1];
      if (last && prev === last) {
        last.appendChild(r);
        continue;
      }
      const del = this.revision("del");
      r.parentNode!.insertBefore(del, r);
      del.appendChild(r);
      wrappers.push(del);
    }
    return wrappers;
  }

  private buildRun(text: string, styleFrom?: XEl): XEl {
    const r = createW(this.doc, "r");
    const rPr = styleFrom && child(styleFrom, "rPr");
    if (rPr) {
      const clone = rPr.cloneNode(true) as XEl;
      for (const c of elementChildren(clone)) {
        if (isW(c, "rPrChange") || isW(c, "ins") || isW(c, "del")) clone.removeChild(c);
      }
      r.appendChild(clone);
    }
    const parts = text.split(/(\t|\n)/);
    for (const part of parts) {
      if (part === "") continue;
      if (part === "\t") r.appendChild(createW(this.doc, "tab"));
      else if (part === "\n") r.appendChild(createW(this.doc, "br"));
      else {
        const t = createW(this.doc, "t");
        setText(t, part);
        r.appendChild(t);
      }
    }
    return r;
  }

  private insertion(text: string, styleFrom?: XEl): XEl {
    const ins = this.revision("ins");
    ins.appendChild(this.buildRun(text, styleFrom));
    return ins;
  }

  // ---- comments -------------------------------------------------------------

  private ensureComments(): XDoc {
    if (this.commentsDoc) return this.commentsDoc;
    this.commentsDoc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:comments xmlns:w="${W}"/>`,
      "text/xml",
    );
    return this.commentsDoc;
  }

  private addComment(text: string, first: XNode, last: XNode) {
    const id = String(this.nextId++);
    const cdoc = this.ensureComments();
    const comment = cdoc.createElementNS(W, "w:comment") as XEl;
    comment.setAttributeNS(W, "w:id", id);
    comment.setAttributeNS(W, "w:author", this.opts.author);
    comment.setAttributeNS(W, "w:date", this.date);
    comment.setAttributeNS(W, "w:initials", this.opts.initials ?? initialsOf(this.opts.author));
    text.split("\n").forEach((line, i) => {
      const p = cdoc.createElementNS(W, "w:p");
      if (i === 0) {
        const ref = cdoc.createElementNS(W, "w:r");
        ref.appendChild(cdoc.createElementNS(W, "w:annotationRef"));
        p.appendChild(ref);
      }
      const r = cdoc.createElementNS(W, "w:r");
      const t = cdoc.createElementNS(W, "w:t") as XEl;
      setText(t, line);
      r.appendChild(t);
      p.appendChild(r);
      comment.appendChild(p);
    });
    cdoc.documentElement!.appendChild(comment);

    const start = createW(this.doc, "commentRangeStart");
    setW(start, "id", id);
    const end = createW(this.doc, "commentRangeEnd");
    setW(end, "id", id);
    const refRun = createW(this.doc, "r");
    const ref = createW(this.doc, "commentReference");
    setW(ref, "id", id);
    refRun.appendChild(ref);

    const a = this.anchorOutside(first, "before");
    a.parent.insertBefore(start, a.ref);
    const b = this.anchorOutside(last, "after");
    b.parent.insertBefore(end, b.ref);
    insertAfter(refRun, end);
  }

  // ---- range edits ----------------------------------------------------------

  /** Track-change [start, end) of the paragraph's current text into `text`; returns the first and last new nodes. */
  private replaceRange(p: XEl, start: number, end: number, text: string): [XNode, XNode] {
    if (start === end) {
      const ins = this.insertAt(p, start, text);
      return [ins, ins];
    }
    const { inside } = this.runsIn(p, start, end);
    if (inside.length === 0) throw new Error("Matched text has no editable runs.");
    const styleFrom = inside.find((r) => child(r, "t")) ?? inside[0];
    const styleClone = styleFrom.cloneNode(true) as XEl;
    const dels = this.deleteRuns(inside);
    let lastNode: XNode = dels[dels.length - 1];
    if (text) {
      const ins = this.insertion(text, styleClone);
      const at = this.anchorOutside(lastNode, "after");
      at.parent.insertBefore(ins, at.ref);
      lastNode = ins;
    }
    return [dels[0], lastNode];
  }

  private insertAt(p: XEl, offset: number, text: string): XEl {
    const spans = this.splitAt(p, offset);
    const before = [...spans].reverse().find((s) => s.end <= offset && s.end > s.start);
    const after = spans.find((s) => s.start >= offset && s.end > s.start);
    const ins = this.insertion(text, before?.run ?? after?.run);
    if (before) {
      const at = this.anchorOutside(before.run, "after");
      at.parent.insertBefore(ins, at.ref);
    } else if (after) {
      const at = this.anchorOutside(after.run, "before");
      at.parent.insertBefore(ins, at.ref);
    } else {
      const pPr = child(p, "pPr");
      p.insertBefore(ins, pPr ? pPr.nextSibling : p.firstChild);
    }
    return ins;
  }

  // ---- operations -----------------------------------------------------------

  apply(op: ReviewOperation): string {
    switch (op.action) {
      case "replace":
      case "delete": {
        const replacement = op.action === "replace" ? op.replace : "";
        const { p, start, end } = this.locate(op);
        const [first, last] = this.replaceRange(p, start, end, replacement);
        if (op.comment) this.addComment(op.comment, first, last);
        return op.action === "replace"
          ? `Replaced "${op.find}" → "${replacement}"`
          : `Deleted "${op.find}"`;
      }
      case "insert": {
        const { p, start, end } = this.locate(op);
        const ins = this.insertAt(p, op.position === "before" ? start : end, op.text);
        if (op.comment) this.addComment(op.comment, ins, ins);
        return `Inserted "${op.text}" ${op.position} "${op.find}"`;
      }
      case "edit_paragraph": {
        const p = this.paragraph(op.paragraph);
        const hunks = diffHunks(paragraphText(p), op.text);
        if (hunks.length === 0) return `Paragraph ${op.paragraph} unchanged`;
        let first: XNode | undefined;
        let last: XNode | undefined;
        // Apply from the end so earlier offsets stay valid.
        for (const [start, end, text] of [...hunks].reverse()) {
          const [f, l] = this.replaceRange(p, start, end, text);
          first = f;
          last ??= l;
        }
        if (op.comment && first && last) this.addComment(op.comment, first, last);
        return `Edited paragraph ${op.paragraph} (${hunks.length} change${hunks.length === 1 ? "" : "s"})`;
      }
      case "comment_range": {
        const p = this.paragraph(op.paragraph);
        const len = paragraphText(p).length;
        if (!(op.start >= 0 && op.start < op.end && op.end <= len)) {
          throw new Error(`Range ${op.start}–${op.end} is outside paragraph ${op.paragraph} (length ${len}).`);
        }
        const { inside } = this.runsIn(p, op.start, op.end);
        if (inside.length === 0) throw new Error("Selected range has no runs to comment on.");
        this.addComment(op.comment, inside[0], inside[inside.length - 1]);
        return `Commented on paragraph ${op.paragraph}`;
      }
      case "comment": {
        const { p, start, end } = this.locate(op);
        const { inside } = this.runsIn(p, start, end);
        if (inside.length === 0) throw new Error("Matched text has no runs to comment on.");
        this.addComment(op.comment, inside[0], inside[inside.length - 1]);
        return `Commented on "${op.find}"`;
      }
      case "insert_paragraph": {
        const target = this.paragraph(op.paragraph);
        const np = createW(this.doc, "p");
        const pPr = child(target, "pPr");
        const newPPr = pPr ? (pPr.cloneNode(true) as XEl) : createW(this.doc, "pPr");
        for (const c of elementChildren(newPPr)) {
          if (isW(c, "sectPr") || isW(c, "pPrChange") || isW(c, "rPr")) newPPr.removeChild(c);
        }
        np.appendChild(newPPr);
        const firstRun = liveRuns(target).find((r) => child(r, "t"));
        const ins = this.insertion(op.text, firstRun);
        np.appendChild(ins);
        if (op.position === "before") target.parentNode!.insertBefore(np, target);
        else insertAfter(np, target);
        // Mark the new paragraph break as inserted so rejecting removes the paragraph.
        const next = nextElement(np);
        if (op.position === "before" || isW(next, "p")) this.markParagraph(np, "ins");
        else this.markParagraph(target, "ins");
        if (op.comment) this.addComment(op.comment, ins, ins);
        return `Inserted paragraph ${op.position} paragraph ${op.paragraph}`;
      }
      case "delete_paragraph": {
        const target = this.paragraph(op.paragraph);
        const runs = liveRuns(target);
        const dels = this.deleteRuns(runs);
        if (isW(nextElement(target), "p")) this.markParagraph(target, "del");
        if (op.comment && dels.length) this.addComment(op.comment, dels[0], dels[dels.length - 1]);
        return `Deleted paragraph ${op.paragraph}`;
      }
    }
  }

  private markParagraph(p: XEl, kind: "ins" | "del") {
    let pPr = child(p, "pPr");
    if (!pPr) {
      pPr = createW(this.doc, "pPr");
      p.insertBefore(pPr, p.firstChild);
    }
    let rPr = child(pPr, "rPr");
    if (!rPr) {
      rPr = createW(this.doc, "rPr");
      // rPr goes before sectPr and pPrChange inside pPr.
      const after = elementChildren(pPr).find((c) => isW(c, "sectPr") || isW(c, "pPrChange"));
      pPr.insertBefore(rPr, after ?? null);
    }
    rPr.insertBefore(this.revision(kind), rPr.firstChild);
  }
}

function nextElement(node: XNode): XNode | null {
  let n = node.nextSibling;
  while (n && n.nodeType !== 1) n = n.nextSibling;
  return n;
}

function setText(t: XEl, text: string) {
  while (t.firstChild) t.removeChild(t.firstChild);
  t.appendChild(t.ownerDocument!.createTextNode(text));
  t.setAttributeNS(XML_NS, "xml:space", "preserve");
}

function replaceLocal(doc: XDoc, el: XEl, local: string) {
  const n = createW(doc, local);
  n.setAttributeNS(XML_NS, "xml:space", "preserve");
  while (el.firstChild) n.appendChild(el.firstChild);
  el.parentNode!.replaceChild(n, el);
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]!.toUpperCase())
      .join("")
      .slice(0, 4) || "AI"
  );
}

async function ensureCommentsPart(zip: JSZip) {
  const rels = await readXml(zip, "word/_rels/document.xml.rels");
  if (rels) {
    const existing = Array.from(rels.getElementsByTagNameNS(REL_NS, "Relationship")) as XEl[];
    if (!existing.some((r) => r.getAttribute("Type") === COMMENTS_REL)) {
      const ids = new Set(existing.map((r) => r.getAttribute("Id")));
      let n = existing.length + 1;
      while (ids.has(`rId${n}`)) n++;
      const rel = rels.createElementNS(REL_NS, "Relationship") as XEl;
      rel.setAttribute("Id", `rId${n}`);
      rel.setAttribute("Type", COMMENTS_REL);
      rel.setAttribute("Target", "comments.xml");
      rels.documentElement!.appendChild(rel);
      writeXml(zip, "word/_rels/document.xml.rels", rels);
    }
  }
  const types = await readXml(zip, "[Content_Types].xml");
  if (types) {
    const overrides = Array.from(types.getElementsByTagNameNS(CT_NS, "Override")) as XEl[];
    if (!overrides.some((o) => o.getAttribute("PartName") === "/word/comments.xml")) {
      const o = types.createElementNS(CT_NS, "Override") as XEl;
      o.setAttribute("PartName", "/word/comments.xml");
      o.setAttribute("ContentType", COMMENTS_CT);
      types.documentElement!.appendChild(o);
      writeXml(zip, "[Content_Types].xml", types);
    }
  }
}

// Elements that precede <w:trackRevisions> in CT_Settings; Word rejects out-of-order settings.
const SETTINGS_BEFORE_TRACK = new Set([
  "writeProtection", "view", "zoom", "removePersonalInformation", "removeDateAndTime",
  "doNotDisplayPageBoundaries", "displayBackgroundShape", "printPostScriptOverText",
  "printFractionalCharacterWidth", "printFormsData", "embedTrueTypeFonts", "embedSystemFonts",
  "saveSubsetFonts", "saveFormsData", "mirrorMargins", "alignBordersAndEdges",
  "bordersDoNotSurroundHeader", "bordersDoNotSurroundFooter", "gutterAtTop", "hideSpellingErrors",
  "hideGrammaticalErrors", "activeWritingStyle", "proofState", "formsDesign", "attachedTemplate",
  "linkStyles", "stylePaneFormatFilter", "stylePaneSortMethod", "documentType", "mailMerge",
  "revisionView",
]);

async function setTrackRevisions(zip: JSZip, on: boolean) {
  const settings = await readXml(zip, "word/settings.xml");
  if (!settings) return;
  const root = settings.documentElement as XEl;
  const existing = allW(settings, "trackRevisions");
  if (on && existing.length === 0) {
    const el = settings.createElementNS(W, "w:trackRevisions") as XEl;
    const before = elementChildren(root).filter((c) => isW(c) && SETTINGS_BEFORE_TRACK.has(c.localName!));
    const last = before[before.length - 1];
    if (last) insertAfter(el, last);
    else root.insertBefore(el, root.firstChild);
  } else if (!on) {
    for (const el of existing) el.parentNode!.removeChild(el);
  } else return;
  writeXml(zip, "word/settings.xml", settings);
}

export async function applyReview(
  bytes: Uint8Array,
  operations: ReviewOperation[],
  opts: ReviewOptions,
): Promise<{ bytes: Uint8Array; results: OperationResult[] }> {
  const pkg = await openDocx(bytes);
  const comments = await readXml(pkg.zip, "word/comments.xml");
  const reviewer = new Reviewer(pkg, comments, opts);
  const results = operations.map((op, index): OperationResult => {
    try {
      return { index, action: op.action, ok: true, message: reviewer.apply(op) };
    } catch (error) {
      return {
        index,
        action: op.action,
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  });
  writeXml(pkg.zip, "word/document.xml", pkg.doc);
  if (reviewer.comments) {
    writeXml(pkg.zip, "word/comments.xml", reviewer.comments);
    await ensureCommentsPart(pkg.zip);
  }
  if (opts.enableTracking) await setTrackRevisions(pkg.zip, true);
  return { bytes: await saveDocx(pkg.zip), results };
}

// ---------------------------------------------------------------------------
// Accept / reject

export async function resolveRevisions(
  bytes: Uint8Array,
  opts: ResolveOptions,
): Promise<{ bytes: Uint8Array; resolved: number; remaining: number }> {
  const { zip, doc } = await openDocx(bytes);
  const matches = (el: XEl) => !opts.author || wAttr(el, "author") === opts.author;
  const accept = opts.mode === "accept";
  let resolved = 0;
  const mergeWithNext: XEl[] = [];

  const unwrap = (el: XEl) => {
    while (el.firstChild) el.parentNode!.insertBefore(el.firstChild, el);
    el.parentNode!.removeChild(el);
  };
  const remove = (el: XEl) => el.parentNode?.removeChild(el);
  const attached = (el: XNode) => {
    let n: XNode | null = el;
    while (n && n.nodeType !== 9) n = n.parentNode;
    return !!n;
  };

  // Formatting changes.
  for (const local of ["rPrChange", "pPrChange", "sectPrChange", "tblPrChange", "trPrChange", "tcPrChange", "tblGridChange", "numberingChange"]) {
    for (const change of allW(doc, local)) {
      if (!attached(change) || !matches(change)) continue;
      resolved++;
      const props = change.parentNode as XEl;
      if (!accept && (local === "rPrChange" || local === "pPrChange")) {
        const old = child(change, local === "rPrChange" ? "rPr" : "pPr");
        const keep = local === "pPrChange" ? new Set(["rPr", "sectPr"]) : new Set<string>();
        for (const c of elementChildren(props)) {
          if (c !== change && !keep.has(c.localName!)) props.removeChild(c);
        }
        const firstKept = props.firstChild;
        for (const c of old ? elementChildren(old) : []) props.insertBefore(c, firstKept);
      }
      remove(change);
    }
  }

  // Content and paragraph-mark revisions.
  for (const local of ["ins", "moveTo", "del", "moveFrom"]) {
    const isInsert = local === "ins" || local === "moveTo";
    for (const el of allW(doc, local)) {
      if (!attached(el) || !matches(el)) continue;
      resolved++;
      const parentLocal = (el.parentNode as XEl).localName;
      const keepContent = accept === isInsert;
      if (parentLocal === "rPr") {
        // Paragraph mark (inside w:pPr) or table row marker (inside w:trPr).
        const props = el.parentNode as XEl;
        remove(el);
        const owner = props.parentNode?.parentNode as XEl | undefined;
        if (!keepContent && owner && isW(owner, "p")) mergeWithNext.push(owner);
      } else if (parentLocal === "trPr") {
        const row = el.parentNode!.parentNode as XEl;
        remove(el);
        if (!keepContent) remove(row);
      } else if (keepContent) {
        for (const t of allW(el, "delText")) replaceLocal(doc, t, "t");
        for (const t of allW(el, "delInstrText")) replaceLocal(doc, t, "instrText");
        unwrap(el);
      } else {
        remove(el);
      }
    }
  }

  for (const p of mergeWithNext) {
    const next = nextElement(p);
    if (!attached(p) || !isW(next, "p")) continue;
    const firstContent = elementChildren(next).find((c) => !isW(c, "pPr")) ?? null;
    for (const c of elementChildren(p)) {
      if (!isW(c, "pPr")) next.insertBefore(c, firstContent);
    }
    remove(p);
  }

  writeXml(zip, "word/document.xml", doc);
  const remaining = ["ins", "del", "moveTo", "moveFrom", "rPrChange", "pPrChange"].reduce(
    (n, local) => n + allW(doc, local).length,
    0,
  );
  return { bytes: await saveDocx(zip), resolved, remaining };
}

export async function setTracking(bytes: Uint8Array, on: boolean): Promise<Uint8Array> {
  const { zip } = await openDocx(bytes);
  await setTrackRevisions(zip, on);
  return saveDocx(zip);
}
