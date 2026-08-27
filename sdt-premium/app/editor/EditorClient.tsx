"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultSiteContent,
  type BuilderBlock,
  type EventItem,
  type OfficePhoto,
  type ProjectItem,
  type ServiceItem,
  type SiteContent,
  type TeamItem,
} from "@/app/site-content";
import styles from "./editor.module.css";

type SaveState = "idle" | "saving" | "saved" | "error";

const freshId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function ItemActions({ index, length, onMove, onDelete }: {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className={styles.itemActions}>
      <Button type="button" size="icon" variant="outline" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Переместить выше"><ArrowUp /></Button>
      <Button type="button" size="icon" variant="outline" onClick={() => onMove(1)} disabled={index === length - 1} aria-label="Переместить ниже"><ArrowDown /></Button>
      <Button type="button" size="icon" variant="destructive" onClick={onDelete} aria-label="Удалить"><Trash2 /></Button>
    </div>
  );
}

function ImageField({ value, onChange, onUpload, uploading }: {
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await onUpload(file);
    event.target.value = "";
  };

  return (
    <div className={styles.imageField}>
      <div className={styles.imagePreview}>
        {value ? <img src={value} alt="Предпросмотр" /> : <ImagePlus />}
      </div>
      <div className={styles.imageControls}>
        <Label>Ссылка на фотографию</Label>
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
        <label className={styles.uploadButton}>
          {uploading ? <LoaderCircle className={styles.spin} /> : <Upload />}
          {uploading ? "Загрузка…" : "Загрузить своё фото"}
          <input type="file" accept="image/*" onChange={chooseFile} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

export default function EditorClient({ userName }: { userName: string }) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить содержимое");
        return response.json();
      })
      .then((data) => setContent(data.content ?? defaultSiteContent))
      .catch(() => setMessage("Не удалось загрузить сохранённую версию. Показаны исходные данные."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaveState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить изменения");
      setSaveState("saved");
      setMessage("Изменения опубликованы на сайте.");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  };

  const upload = async (key: string, file: File, onDone: (url: string) => void) => {
    setUploadingKey(key);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/media", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось загрузить фотографию");
      onDone(data.url);
      setMessage("Фотография загружена. Нажмите «Сохранить и опубликовать».");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploadingKey(null);
    }
  };

  const setHero = (key: keyof SiteContent["hero"], value: SiteContent["hero"][keyof SiteContent["hero"]]) => {
    setContent((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));
  };

  const updateService = (index: number, patch: Partial<ServiceItem>) => {
    setContent((current) => ({ ...current, services: current.services.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };
  const updateProject = (index: number, patch: Partial<ProjectItem>) => {
    setContent((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };
  const updateOffice = (index: number, patch: Partial<OfficePhoto>) => {
    setContent((current) => ({ ...current, officePhotos: current.officePhotos.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };
  const updateEvent = (index: number, patch: Partial<EventItem>) => {
    setContent((current) => ({ ...current, events: current.events.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };
  const updateTeam = (index: number, patch: Partial<TeamItem>) => {
    setContent((current) => ({ ...current, team: current.team.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };
  const updateBlock = (index: number, patch: Partial<BuilderBlock>) => {
    setContent((current) => ({ ...current, blocks: current.blocks.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };

  const addBlock = (type: BuilderBlock["type"]) => {
    const block: BuilderBlock = {
      id: freshId("block"), type, eyebrow: "Новый раздел", title: "Заголовок блока",
      text: "Добавьте описание этого раздела.", image: "", images: [], imageSide: "right", visible: true,
    };
    setContent((current) => ({ ...current, blocks: [...current.blocks, block] }));
  };

  if (loading) {
    return <main className={styles.loadingPage}><LoaderCircle className={styles.spin} /><p>Загружаем конструктор…</p></main>;
  }

  return (
    <main className={styles.editor}>
      <header className={styles.editorHeader}>
        <div>
          <a href="/" className={styles.backLink}><ArrowLeft /> На сайт</a>
          <span className={styles.kicker}>SDT / CONTENT CONSTRUCTOR</span>
          <h1>Редактор сайта</h1>
          <p>Здравствуйте, {userName}. Меняйте содержимое и публикуйте результат одной кнопкой.</p>
        </div>
        <div className={styles.headerActions}>
          <a href="/" target="_blank" rel="noreferrer" className={styles.previewLink}>Открыть сайт <ExternalLink /></a>
          <Button onClick={save} disabled={saveState === "saving" || uploadingKey !== null} className={styles.saveButton}>
            {saveState === "saving" ? <LoaderCircle className={styles.spin} /> : saveState === "saved" ? <Check /> : <Save />}
            {saveState === "saving" ? "Сохраняем…" : saveState === "saved" ? "Опубликовано" : "Сохранить и опубликовать"}
          </Button>
        </div>
      </header>

      {message && <div className={saveState === "error" ? styles.messageError : styles.message}>{message}</div>}

      <Tabs defaultValue="hero" className={styles.tabs}>
        <TabsList className={styles.tabList}>
          <TabsTrigger value="hero">Главный экран</TabsTrigger>
          <TabsTrigger value="services">Услуги</TabsTrigger>
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="gallery">Фото и команда</TabsTrigger>
          <TabsTrigger value="blocks">Новые блоки</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className={styles.tabContent}>
          <section className={styles.panel}>
            <div className={styles.panelHead}><div><span>01</span><h2>Главная 3D-шапка</h2></div><p>Измените заголовок, описание и основное изображение.</p></div>
            <div className={styles.fieldGrid}>
              <label><Label>Надзаголовок</Label><Input value={content.hero.kicker} onChange={(event) => setHero("kicker", event.target.value)} /></label>
              {content.hero.title.map((line, index) => (
                <label key={index}><Label>Строка заголовка {index + 1}</Label><Input value={line} onChange={(event) => {
                  const title = [...content.hero.title] as SiteContent["hero"]["title"];
                  title[index] = event.target.value;
                  setHero("title", title);
                }} /></label>
              ))}
              <label className={styles.fullField}><Label>Описание</Label><Textarea rows={4} value={content.hero.copy} onChange={(event) => setHero("copy", event.target.value)} /></label>
            </div>
            <ImageField value={content.hero.image} onChange={(value) => setHero("image", value)} uploading={uploadingKey === "hero"} onUpload={(file) => upload("hero", file, (url) => setHero("image", url))} />
          </section>
        </TabsContent>

        <TabsContent value="services" className={styles.tabContent}>
          <div className={styles.sectionTitle}><div><span>02</span><h2>Карточки услуг</h2></div><Button type="button" onClick={() => setContent((current) => ({ ...current, services: [...current.services, { id: freshId("service"), number: String(current.services.length + 1).padStart(2, "0"), title: "Новая услуга", copy: "Описание услуги", meta: "Технологии и материалы", image: "" }] }))}><Plus /> Добавить услугу</Button></div>
          <div className={styles.cardList}>
            {content.services.map((service, index) => (
              <section className={styles.editCard} key={service.id}>
                <div className={styles.cardHead}><strong>{service.number} / {service.title}</strong><ItemActions index={index} length={content.services.length} onMove={(direction) => setContent((current) => ({ ...current, services: moveItem(current.services, index, direction) }))} onDelete={() => setContent((current) => ({ ...current, services: current.services.filter((_, itemIndex) => itemIndex !== index) }))} /></div>
                <div className={styles.fieldGrid}>
                  <label><Label>Номер</Label><Input value={service.number} onChange={(event) => updateService(index, { number: event.target.value })} /></label>
                  <label><Label>Название</Label><Input value={service.title} onChange={(event) => updateService(index, { title: event.target.value })} /></label>
                  <label className={styles.fullField}><Label>Описание</Label><Textarea value={service.copy} onChange={(event) => updateService(index, { copy: event.target.value })} /></label>
                  <label className={styles.fullField}><Label>Технологии</Label><Input value={service.meta} onChange={(event) => updateService(index, { meta: event.target.value })} /></label>
                </div>
                <ImageField value={service.image} onChange={(value) => updateService(index, { image: value })} uploading={uploadingKey === service.id} onUpload={(file) => upload(service.id, file, (url) => updateService(index, { image: url }))} />
              </section>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className={styles.tabContent}>
          <div className={styles.sectionTitle}><div><span>03</span><h2>Проекты и объекты</h2></div><Button type="button" onClick={() => setContent((current) => ({ ...current, projects: [...current.projects, { id: freshId("project"), title: "Новый проект", type: "Вид работ", problem: "Задача на объекте", result: "Результат выполненных работ", image: "" }] }))}><Plus /> Добавить проект</Button></div>
          <div className={styles.cardList}>
            {content.projects.map((project, index) => (
              <section className={styles.editCard} key={project.id}>
                <div className={styles.cardHead}><strong>{project.title}</strong><ItemActions index={index} length={content.projects.length} onMove={(direction) => setContent((current) => ({ ...current, projects: moveItem(current.projects, index, direction) }))} onDelete={() => setContent((current) => ({ ...current, projects: current.projects.filter((_, itemIndex) => itemIndex !== index) }))} /></div>
                <div className={styles.fieldGrid}>
                  <label><Label>Название объекта</Label><Input value={project.title} onChange={(event) => updateProject(index, { title: event.target.value })} /></label>
                  <label><Label>Вид работ</Label><Input value={project.type} onChange={(event) => updateProject(index, { type: event.target.value })} /></label>
                  <label><Label>Задача</Label><Textarea value={project.problem} onChange={(event) => updateProject(index, { problem: event.target.value })} /></label>
                  <label><Label>Результат</Label><Textarea value={project.result} onChange={(event) => updateProject(index, { result: event.target.value })} /></label>
                </div>
                <ImageField value={project.image} onChange={(value) => updateProject(index, { image: value })} uploading={uploadingKey === project.id} onUpload={(file) => upload(project.id, file, (url) => updateProject(index, { image: url }))} />
              </section>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className={styles.tabContent}>
          <section className={styles.collectionPanel}>
            <div className={styles.sectionTitle}><div><span>04</span><h2>Фотографии офиса</h2></div><Button type="button" onClick={() => setContent((current) => ({ ...current, officePhotos: [...current.officePhotos, { id: freshId("office"), src: "", alt: "Фото офиса СДТ", label: "Новое фото" }] }))}><Plus /> Добавить фото</Button></div>
            <div className={styles.miniGrid}>{content.officePhotos.map((photo, index) => <section className={styles.miniCard} key={photo.id}><div className={styles.cardHead}><strong>{photo.label}</strong><ItemActions index={index} length={content.officePhotos.length} onMove={(direction) => setContent((current) => ({ ...current, officePhotos: moveItem(current.officePhotos, index, direction) }))} onDelete={() => setContent((current) => ({ ...current, officePhotos: current.officePhotos.filter((_, itemIndex) => itemIndex !== index) }))} /></div><Input value={photo.label} onChange={(event) => updateOffice(index, { label: event.target.value, alt: event.target.value })} placeholder="Подпись" /><ImageField value={photo.src} onChange={(value) => updateOffice(index, { src: value })} uploading={uploadingKey === photo.id} onUpload={(file) => upload(photo.id, file, (url) => updateOffice(index, { src: url }))} /></section>)}</div>
          </section>

          <section className={styles.collectionPanel}>
            <div className={styles.sectionTitle}><div><span>05</span><h2>Мероприятия</h2></div><Button type="button" onClick={() => setContent((current) => ({ ...current, events: [...current.events, { id: freshId("event"), src: "", title: "Новое мероприятие", tag: "Фотоархив СДТ" }] }))}><Plus /> Добавить</Button></div>
            <div className={styles.miniGrid}>{content.events.map((event, index) => <section className={styles.miniCard} key={event.id}><div className={styles.cardHead}><strong>{event.title}</strong><ItemActions index={index} length={content.events.length} onMove={(direction) => setContent((current) => ({ ...current, events: moveItem(current.events, index, direction) }))} onDelete={() => setContent((current) => ({ ...current, events: current.events.filter((_, itemIndex) => itemIndex !== index) }))} /></div><Input value={event.title} onChange={(change) => updateEvent(index, { title: change.target.value })} /><Input value={event.tag} onChange={(change) => updateEvent(index, { tag: change.target.value })} /><ImageField value={event.src} onChange={(value) => updateEvent(index, { src: value })} uploading={uploadingKey === event.id} onUpload={(file) => upload(event.id, file, (url) => updateEvent(index, { src: url }))} /></section>)}</div>
          </section>

          <section className={styles.collectionPanel}>
            <div className={styles.sectionTitle}><div><span>06</span><h2>Команда</h2></div><Button type="button" onClick={() => setContent((current) => ({ ...current, team: [...current.team, { id: freshId("team"), src: "", title: "Новый раздел команды", copy: "Описание" }] }))}><Plus /> Добавить</Button></div>
            <div className={styles.miniGrid}>{content.team.map((member, index) => <section className={styles.miniCard} key={member.id}><div className={styles.cardHead}><strong>{member.title}</strong><ItemActions index={index} length={content.team.length} onMove={(direction) => setContent((current) => ({ ...current, team: moveItem(current.team, index, direction) }))} onDelete={() => setContent((current) => ({ ...current, team: current.team.filter((_, itemIndex) => itemIndex !== index) }))} /></div><Input value={member.title} onChange={(event) => updateTeam(index, { title: event.target.value })} /><Textarea value={member.copy} onChange={(event) => updateTeam(index, { copy: event.target.value })} /><ImageField value={member.src} onChange={(value) => updateTeam(index, { src: value })} uploading={uploadingKey === member.id} onUpload={(file) => upload(member.id, file, (url) => updateTeam(index, { src: url }))} /></section>)}</div>
          </section>
        </TabsContent>

        <TabsContent value="blocks" className={styles.tabContent}>
          <div className={styles.sectionTitle}>
            <div><span>07</span><h2>Дополнительные блоки</h2><p>Новые разделы появятся перед формой контактов.</p></div>
            <div className={styles.addBlockButtons}><Button onClick={() => addBlock("image-text")}><Plus /> Текст + фото</Button><Button variant="outline" onClick={() => addBlock("text")}><Plus /> Текст</Button><Button variant="outline" onClick={() => addBlock("gallery")}><Plus /> Галерея</Button></div>
          </div>
          {content.blocks.length === 0 && <div className={styles.emptyBlocks}><ImagePlus /><h3>Пока нет дополнительных блоков</h3><p>Выберите тип блока сверху — он сразу появится в конструкторе.</p></div>}
          <div className={styles.cardList}>
            {content.blocks.map((block, index) => (
              <section className={styles.editCard} key={block.id}>
                <div className={styles.cardHead}>
                  <div className={styles.blockIdentity}><strong>{block.title}</strong><span>{block.type === "image-text" ? "Текст + фото" : block.type === "gallery" ? "Галерея" : "Текстовый блок"}</span></div>
                  <div className={styles.blockControls}><Label htmlFor={`visible-${block.id}`}>Показывать</Label><Switch id={`visible-${block.id}`} checked={block.visible} onCheckedChange={(checked) => updateBlock(index, { visible: checked })} /><ItemActions index={index} length={content.blocks.length} onMove={(direction) => setContent((current) => ({ ...current, blocks: moveItem(current.blocks, index, direction) }))} onDelete={() => setContent((current) => ({ ...current, blocks: current.blocks.filter((_, itemIndex) => itemIndex !== index) }))} /></div>
                </div>
                <div className={styles.fieldGrid}>
                  <label><Label>Метка над заголовком</Label><Input value={block.eyebrow} onChange={(event) => updateBlock(index, { eyebrow: event.target.value })} /></label>
                  <label><Label>Заголовок</Label><Input value={block.title} onChange={(event) => updateBlock(index, { title: event.target.value })} /></label>
                  <label className={styles.fullField}><Label>Текст</Label><Textarea rows={4} value={block.text} onChange={(event) => updateBlock(index, { text: event.target.value })} /></label>
                  {block.type === "image-text" && <label><Label>Положение фотографии</Label><select value={block.imageSide} onChange={(event) => updateBlock(index, { imageSide: event.target.value as "left" | "right" })}><option value="right">Справа</option><option value="left">Слева</option></select></label>}
                </div>
                {block.type === "image-text" && <ImageField value={block.image} onChange={(value) => updateBlock(index, { image: value })} uploading={uploadingKey === block.id} onUpload={(file) => upload(block.id, file, (url) => updateBlock(index, { image: url }))} />}
                {block.type === "gallery" && <div className={styles.galleryEditor}><Button type="button" variant="outline" onClick={() => updateBlock(index, { images: [...block.images, ""] })}><Plus /> Добавить фотографию</Button><div className={styles.galleryFields}>{block.images.map((image, imageIndex) => <div key={`${block.id}-${imageIndex}`} className={styles.galleryField}><ImageField value={image} onChange={(value) => updateBlock(index, { images: block.images.map((item, itemIndex) => itemIndex === imageIndex ? value : item) })} uploading={uploadingKey === `${block.id}-${imageIndex}`} onUpload={(file) => upload(`${block.id}-${imageIndex}`, file, (url) => updateBlock(index, { images: block.images.map((item, itemIndex) => itemIndex === imageIndex ? url : item) }))} /><Button type="button" variant="destructive" onClick={() => updateBlock(index, { images: block.images.filter((_, itemIndex) => itemIndex !== imageIndex) })}><Trash2 /> Удалить фото</Button></div>)}</div></div>}
              </section>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className={styles.mobileSave}>
        <Button onClick={save} disabled={saveState === "saving" || uploadingKey !== null} className={styles.saveButton}>
          {saveState === "saving" ? <LoaderCircle className={styles.spin} /> : <Save />} Сохранить и опубликовать
        </Button>
      </div>
    </main>
  );
}
