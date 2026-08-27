"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, Paperclip, Phone } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { defaultSiteContent, type SiteContent } from "@/app/site-content";

const primaryNav = [
  { label: "Главная", href: "#main", id: "main" },
  { label: "Услуги", href: "#services", id: "services" },
  { label: "Проекты", href: "#projects", id: "projects" },
  { label: "О компании", href: "#about", id: "about" },
  { label: "Этапы работы", href: "#process", id: "process" },
  { label: "Офис и жизнь", href: "#company-life", id: "company-life" },
  { label: "Команда", href: "#team", id: "team" },
  { label: "Документы", href: "#trust", id: "trust" },
  { label: "Контакты", href: "#contacts", id: "contacts" },
];

const serviceGroups = [
  {
    title: "Инъектирование",
    items: [
      "Протечки в подвале", "Рабочие швы", "Деформационные швы", "Трещины",
      "Кирпичная кладка", "Вводы коммуникаций", "Стены", "Ремонт мембран",
      "Стена в грунте", "Противофильтрационная завеса", "Отсечная гидроизоляция",
      "Гидроизоляция мостов",
    ],
  },
  {
    title: "Усиление конструкций",
    items: [
      "Балки", "Колонны", "Перекрытия", "Фундамент", "Отверстия и проёмы",
      "Железобетонные фермы", "Стены и простенки", "Грунт", "Капители и консоли",
      "Сводчатые перекрытия",
    ],
  },
  { title: "Обследование", items: ["Перекрытия", "Колонны", "Фундамент", "Стены"] },
  {
    title: "Проектирование",
    items: ["Проект усиления", "Проект реконструкции", "Проект гидроизоляции"],
  },
  {
    title: "Поставка материалов",
    items: ["Инъекционные составы", "Системы усиления", "Ремонтные смеси", "Гидроизоляция"],
  },
];

const steps = [
  ["01", "Обследование", "Осматриваем конструкции, выполняем замеры, испытания и фиксируем фактическое состояние объекта."],
  ["02", "Проект", "Разрабатываем расчётное решение, рабочую документацию и согласовываем её с заказчиком."],
  ["03", "Подбор технологии", "Выбираем материалы, оборудование и метод производства работ под реальные условия площадки."],
  ["04", "Выполнение работ", "Собственная команда реализует решение с поэтапным контролем технологии и качества."],
  ["05", "Сдача и гарантия", "Передаём исполнительную документацию, закрываем объект и предоставляем гарантию до 5 лет."],
];

const trustLetters = [
  { src: "https://sdt.swipa.ru/assets/company/letter-b-holding.jpg", name: "ООО «Б-Холдинг»", type: "Благодарственное письмо · 2024" },
  { src: "https://sdt.swipa.ru/assets/company/letter-pik.jpg", name: "ООО «МФС-ПИК»", type: "Благодарственное письмо" },
  { src: "https://sdt.swipa.ru/assets/company/letter-stroymaster.jpg", name: "ООО «СтройМастер»", type: "Рекомендательное письмо" },
  { src: "https://sdt.swipa.ru/assets/company/letter-kmt.jpg", name: "Холдинг «КМТ»", type: "Рекомендательное письмо" },
  { src: "https://sdt.swipa.ru/assets/company/letter-vybor.jpg", name: "ООО «Выбор-Строймонтаж»", type: "Благодарственное письмо" },
  { src: "https://sdt.swipa.ru/assets/company/letter-cherus.jpg", name: "ООО «ЧЕРУС-Сети»", type: "Отзыв о сотрудничестве" },
];

const knowledgeCards = [
  { label: "Усиление", title: "Усиление балок и ригелей", copy: "Практика повышения несущей способности углепластиком и традиционными методами." },
  { label: "Гидроизоляция", title: "Инъектирование трещин", copy: "Герметизация и структурное склеивание трещин полимерными составами." },
  { label: "Обследование", title: "Обследование перекрытий", copy: "Оценка технического состояния и исходные данные для проектного решения." },
  { label: "Ремонт бетона", title: "Торкретирование конструкций", copy: "Формирование защитного слоя, восстановление геометрии и ремонт железобетона." },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState("main");
  const [formState, setFormState] = useState<"idle" | "ready">("idle");
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/content", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data?.content) setSiteContent(data.content);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.6] },
    );
    primaryNav.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });

    return () => { revealObserver.disconnect(); sectionObserver.disconnect(); };
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progressRef.current?.style.setProperty("--progress", String(ratio * 100));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(updateProgress); };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const trackHeroLight = (event: React.PointerEvent<HTMLElement>) => {
    const element = heroRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const normalizedX = x / bounds.width - 0.5;
    const normalizedY = y / bounds.height - 0.5;
    element.style.setProperty("--cursor-x", `${x}px`);
    element.style.setProperty("--cursor-y", `${y}px`);
    element.style.setProperty("--tilt-y", `${normalizedX * 2.8}deg`);
    element.style.setProperty("--tilt-x", `${normalizedY * -2.2}deg`);
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const service = String(data.get("service") || "");
    const comment = String(data.get("comment") || "");
    const subject = encodeURIComponent(`Запрос расчёта — ${service}`);
    const body = encodeURIComponent(`Имя: ${name}\nТелефон: ${phone}\nНаправление: ${service}\n\nЗадача:\n${comment}`);
    setFormState("ready");
    window.location.href = `mailto:info@sdt-group.ru?subject=${subject}&body=${body}`;
  };

  return (
    <>
    <div className="grain-overlay" aria-hidden="true" />
    <SidebarProvider style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties} className="sdt-app">
      <Sidebar collapsible="offcanvas" className="sdt-sidebar">
        <div className="sidebar-progress" ref={progressRef} aria-hidden="true" />
        <SidebarHeader className="sidebar-head">
          <a className="brand" href="#main" aria-label="СДТ — на главную">
            <span className="brand-mark">СДТ</span>
            <span className="brand-caption">Инженерные решения<br />для конструкций</span>
          </a>
        </SidebarHeader>
        <SidebarSeparator className="sidebar-line" />
        <SidebarContent className="sidebar-scroll">
          <SidebarGroup>
            <SidebarGroupLabel className="sidebar-label">Навигация</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNav.map((item, index) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={activeSection === item.id} className="sidebar-nav-button">
                      <a href={item.href}><span className="nav-index">{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span></a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="service-catalog">
            <SidebarGroupLabel className="sidebar-label">Каталог услуг</SidebarGroupLabel>
            <SidebarGroupContent>
              {serviceGroups.map((group, groupIndex) => (
                <details key={group.title} className="service-group" open={groupIndex === 0}>
                  <summary><span>{group.title}</span><span className="summary-plus">+</span></summary>
                  <div className="service-links">
                    {group.items.map((item) => <a key={item} href="#services">{item}</a>)}
                  </div>
                </details>
              ))}
              <a href="#services" className="single-service-link">Торкретирование <ArrowUpRight /></a>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator className="sidebar-line" />
        <SidebarFooter className="sidebar-foot">
          <p>Обсудить объект</p>
          <a className="sidebar-phone" href="tel:+74991100854">+7 (499) 110-08-54</a>
          <a className="sidebar-cta" href="#contacts">Получить расчёт <ArrowUpRight /></a>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="site-inset">
        <a className="skip-link" href="#main">Перейти к содержанию</a>
        <header className="topbar">
          <SidebarTrigger className="menu-trigger" aria-label="Открыть меню" />
          <span className="topbar-title">Группа компаний СДТ</span>
          <a className="topbar-phone" href="tel:+74991100854"><Phone /><span>+7 (499) 110-08-54</span></a>
        </header>

        <main>
          <section className="hero section-anchor" id="main" ref={heroRef} onPointerMove={trackHeroLight}>
            <div className="hero-photo" aria-hidden="true">
              <img src={siteContent.hero.image} alt="" fetchPriority="high" />
            </div>
            <div className="hero-grid" aria-hidden="true" />
            <div className="hero-light" aria-hidden="true" />
            <div className="hero-content">
              <div className="hero-kicker hero-enter"><span className="status-dot" /> {siteContent.hero.kicker}</div>
              <h1 className="hero-enter hero-title hero-title-long">
                {siteContent.hero.title[0]}<br />{siteContent.hero.title[1]}<br />
                <span>{siteContent.hero.title[2]}</span>
              </h1>
              <p className="hero-copy hero-enter">{siteContent.hero.copy}</p>
              <div className="hero-actions hero-enter">
                <a className="button button-primary" href="#contacts">Получить консультацию <ArrowUpRight /></a>
                <a className="text-link" href="#projects">Смотреть проекты <ArrowDown /></a>
              </div>
            </div>
            <div className="hero-stats hero-enter">
              <div><strong>14+</strong><span>лет на рынке</span></div>
              <div><strong>196</strong><span>реализованных объектов</span></div>
              <div><strong>5 лет</strong><span>гарантия на работы</span></div>
            </div>
            <div className="hero-rail" aria-hidden="true"><span>SDT / ENGINEERING / 2026</span></div>
          </section>

          <section className="ticker" aria-label="Основные компетенции">
            <div className="ticker-track">
              <span>ИНЪЕКТИРОВАНИЕ</span><i>✦</i><span>УСИЛЕНИЕ</span><i>✦</i>
              <span>ОБСЛЕДОВАНИЕ</span><i>✦</i><span>ПРОЕКТИРОВАНИЕ</span><i>✦</i>
              <span>ТОРКРЕТИРОВАНИЕ</span><i>✦</i><span>ПОСТАВКА МАТЕРИАЛОВ</span><i>✦</i>
              <span>ИНЪЕКТИРОВАНИЕ</span><i>✦</i>
              <span>УСИЛЕНИЕ</span><i>✦</i><span>ОБСЛЕДОВАНИЕ</span><i>✦</i>
              <span>ПРОЕКТИРОВАНИЕ</span><i>✦</i><span>ТОРКРЕТИРОВАНИЕ</span><i>✦</i>
              <span>ПОСТАВКА МАТЕРИАЛОВ</span><i>✦</i>
            </div>
          </section>

          <section className="cycle reveal" aria-label="Полный инженерный цикл">
            <div className="cycle-heading">
              <p className="eyebrow">01—05 / Полный инженерный цикл</p>
              <h2>От обследования<br />до сдачи объекта</h2>
            </div>
            <div className="cycle-flow">
              {[
                ["01", "Обследование"], ["02", "Проект"], ["03", "Подбор технологии"],
                ["04", "Выполнение работ"], ["05", "Сдача и гарантия"],
              ].map(([number, title]) => <div key={number}><span>{number}</span><strong>{title}</strong></div>)}
            </div>
            <div className="cycle-metrics">
              <div><strong>14+</strong><span>лет на рынке</span></div>
              <div><strong>38</strong><span>инженерных решений</span></div>
              <div><strong>14</strong><span>опубликованных кейсов</span></div>
              <div><strong>5 лет</strong><span>гарантия на работы</span></div>
            </div>
          </section>

          <section className="services section-anchor" id="services">
            <div className="section-intro reveal">
              <p className="eyebrow">Компетенции / 01—06</p>
              <h2>Решения для сложных<br />строительных задач</h2>
              <p className="section-lead">Не продаём отдельную технологию. Подбираем решение по фактическому состоянию конструкций, режиму работы объекта и требуемому результату.</p>
            </div>
            <div className="service-stack">
              {siteContent.services.map((service, index) => (
                <article className="service-card reveal" key={service.id} style={{ "--card-index": index } as React.CSSProperties}>
                  <div className="service-card-number">{service.number}</div>
                  <div className="service-card-copy"><h3>{service.title}</h3><p>{service.copy}</p><span>{service.meta}</span></div>
                  <div className="service-card-image"><img src={service.image} alt={`${service.title} — работы компании СДТ`} /></div>
                  <a href="#contacts" className="round-link" aria-label={`Обсудить услугу: ${service.title}`}><ArrowUpRight /></a>
                </article>
              ))}
            </div>
          </section>

          <section className="about section-anchor" id="about">
            <div className="about-statement reveal"><p className="eyebrow">О компании</p><h2>Один центр<br /><span>ответственности.</span></h2></div>
            <div className="about-content reveal">
              <p className="about-lead">СДТ объединяет обследование, расчёт, проектирование и производство работ в одну управляемую инженерную систему.</p>
              <div className="principles">
                <div><span>01</span><h3>Расчётная точность</h3><p>Каждое решение опирается на обследование, нормы и проверяемый инженерный расчёт.</p></div>
                <div><span>02</span><h3>Прозрачный процесс</h3><p>Фиксируем методику, стоимость, сроки и зоны ответственности до выхода на объект.</p></div>
                <div><span>03</span><h3>Результат под ключ</h3><p>Собственная команда ведёт объект до приёмки и исполнительной документации.</p></div>
                <div><span>04</span><h3>Современные технологии</h3><p>Используем проверенные материалы, профессиональное оборудование и расчётные методы.</p></div>
              </div>
            </div>
            <div className="blueprint-line line-one" aria-hidden="true" /><div className="blueprint-line line-two" aria-hidden="true" />
          </section>

          <section className="projects section-anchor" id="projects">
            <div className="section-intro section-intro-light reveal">
              <p className="eyebrow">Выбранные проекты</p><h2>Объекты говорят<br />точнее обещаний</h2>
              <p className="section-lead">Задачи, в которых инженерная точность напрямую влияла на безопасность и срок службы объекта.</p>
            </div>
            <div className="project-list">
              {siteContent.projects.map((project, index) => (
                <article className="project reveal" key={project.id} style={{ "--reveal-index": index % 4 } as React.CSSProperties}>
                  <div className="project-image"><img src={project.image} alt={`${project.title} — выполненный объект СДТ`} /><span>0{index + 1}</span></div>
                  <div className="project-copy">
                    <p className="project-type">{project.type}</p><h3>{project.title}</h3>
                    <dl><div><dt>Задача</dt><dd>{project.problem}</dd></div><div><dt>Результат</dt><dd>{project.result}</dd></div></dl>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="process section-anchor" id="process">
            <div className="section-intro reveal"><p className="eyebrow">Процесс работы</p><h2>От дефекта<br />до закрывающих документов</h2></div>
            <div className="process-list reveal">
              {steps.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
            </div>
          </section>

          <section className="proof reveal" aria-label="Преимущества компании">
            <div className="proof-grid">
              <div><span>СРО</span><p>Допуски на проектирование, обследование и производство работ</p></div>
              <div><span>5 лет</span><p>Письменная гарантия на выполненные работы</p></div>
              <div><span>24 ч</span><p>Срок первичной инженерной оценки задачи</p></div>
              <div><span>100%</span><p>Контроль качества и исполнительная документация</p></div>
            </div>
          </section>

          <section className="company-life section-anchor" id="company-life">
            <div className="section-intro reveal">
              <p className="eyebrow">Рабочая среда</p>
              <h2>Наш офис<br />в Москве</h2>
              <p className="section-lead">Здесь команда готовит расчёты, проектные решения и документацию для объектов. Адрес: Каширский проезд, д. 5, офис 307.</p>
            </div>
            <div className="office-gallery">
              {siteContent.officePhotos.map((photo, index) => (
                <figure key={photo.id} className={`office-photo office-photo-${index + 1} reveal`} style={{ "--reveal-index": index % 4 } as React.CSSProperties}>
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                  <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{photo.label}</figcaption>
                </figure>
              ))}
            </div>

            <div className="events-heading reveal">
              <div><p className="eyebrow">Жизнь компании</p><h3>Наши мероприятия</h3></div>
              <p>Рабочие встречи, командные события и совместная работа специалистов на объектах.</p>
            </div>
            <div className="events-grid">
              {siteContent.events.map((event, index) => (
                <article key={event.id} className="reveal" style={{ "--reveal-index": index } as React.CSSProperties}>
                  <div><img src={event.src} alt={event.title} loading="lazy" /></div>
                  <span>{event.tag}</span><h4>{event.title}</h4>
                </article>
              ))}
            </div>
          </section>

          <section className="team section-anchor" id="team">
            <div className="section-intro section-intro-light reveal">
              <p className="eyebrow">Люди и компетенции</p>
              <h2>Наша команда</h2>
              <p className="section-lead">Инженеры, проектировщики и производственные специалисты работают как единая команда — от первого выезда до сдачи объекта.</p>
            </div>
            <div className="team-grid">
              {siteContent.team.map((member, index) => (
                <article key={member.id} className="reveal" style={{ "--reveal-index": index } as React.CSSProperties}>
                  <div className="team-image"><img src={member.src} alt={member.title} loading="lazy" /><span>0{index + 1}</span></div>
                  <h3>{member.title}</h3><p>{member.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="trust section-anchor" id="trust">
            <div className="trust-head reveal">
              <div><p className="eyebrow">Документы и отзывы</p><h2>Подтверждённое<br />доверие</h2></div>
              <div className="trust-facts">
                <p><span>01</span>ФГУП «ЦНИИХМ» — благодарственное письмо</p>
                <p><span>02</span>Группа компаний «ПИК» — благодарственное письмо</p>
                <p><span>03</span>ГУП «Московский метрополитен» — подтверждённый объект</p>
                <p><span>04</span>Свидетельства СРО — проектирование и строительство</p>
              </div>
            </div>
            <div className="letters-grid">
              {trustLetters.map((letter, index) => (
                <figure key={letter.name} className="reveal" style={{ "--reveal-index": index % 3 } as React.CSSProperties}>
                  <a href={letter.src} target="_blank" rel="noreferrer" aria-label={`Открыть письмо: ${letter.name}`}>
                    <img src={letter.src} alt={`${letter.type}: ${letter.name}`} loading="lazy" />
                    <span className="letter-open"><ArrowUpRight /></span>
                  </a>
                  <figcaption><span>{String(index + 1).padStart(2, "0")} / {letter.type}</span><strong>{letter.name}</strong></figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="partners reveal" aria-label="Партнёры и производители материалов">
            <p>Материалы и системы ведущих производителей</p>
            <div><strong>SIKA</strong><strong>MAPEI</strong><strong>BASF</strong><strong>REMMERS</strong><strong>DRIZORO</strong></div>
          </section>

          <section className="knowledge">
            <div className="section-intro reveal">
              <p className="eyebrow">База знаний</p>
              <h2>Новости<br />и статьи</h2>
              <p className="section-lead">Практические материалы об усилении, гидроизоляции, обследовании и восстановлении конструкций.</p>
            </div>
            <div className="knowledge-grid">
              {knowledgeCards.map((article, index) => (
                <article key={article.title} className="reveal" style={{ "--reveal-index": index } as React.CSSProperties}><span>{article.label} / 0{index + 1}</span><h3>{article.title}</h3><p>{article.copy}</p><a href="#contacts">Задать вопрос инженеру <ArrowUpRight /></a></article>
              ))}
            </div>
          </section>

          {siteContent.blocks.filter((block) => block.visible).map((block, index) => (
            <section
              className={`builder-section builder-section-${block.type} builder-image-${block.imageSide}`}
              key={block.id}
              aria-labelledby={`builder-title-${block.id}`}
            >
              {block.type === "gallery" ? (
                <>
                  <div className="builder-heading">
                    <p className="eyebrow">{block.eyebrow}</p>
                    <h2 id={`builder-title-${block.id}`}>{block.title}</h2>
                    <p>{block.text}</p>
                  </div>
                  <div className="builder-gallery">
                    {block.images.filter(Boolean).map((image, imageIndex) => (
                      <figure key={`${block.id}-${imageIndex}`}><img src={image} alt={`${block.title} — фото ${imageIndex + 1}`} loading="lazy" /></figure>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="builder-copy">
                    <span className="builder-index">{String(index + 1).padStart(2, "0")}</span>
                    <p className="eyebrow">{block.eyebrow}</p>
                    <h2 id={`builder-title-${block.id}`}>{block.title}</h2>
                    <p>{block.text}</p>
                  </div>
                  {block.type === "image-text" && block.image && (
                    <div className="builder-image"><img src={block.image} alt={block.title} loading="lazy" /></div>
                  )}
                </>
              )}
            </section>
          ))}

          <section className="contact section-anchor" id="contacts">
            <div className="contact-copy reveal">
              <p className="eyebrow">Обсудить объект</p><h2>Получите инженерную<br />оценку вашей задачи</h2>
              <p>Пришлите фотографии, чертежи или короткое описание. Инженер изучит материалы и предложит следующий шаг.</p>
              <div className="contact-details">
                <a href="tel:+74991100854">+7 (499) 110-08-54</a>
                <a href="mailto:info@sdt-group.ru">info@sdt-group.ru</a>
                <p>115201, Москва, Каширский проезд, д. 5, офис 307</p>
                <p>Снабжение: <a href="mailto:snab@sdt-group.ru">snab@sdt-group.ru</a> · <a href="tel:+74951206731">+7 (495) 120-67-31</a></p>
                <span>пн—пт / 08:00—20:00</span>
              </div>
            </div>
            <form className="estimate-form reveal" onSubmit={submitForm}>
              <div className="form-row">
                <label><span>Ваше имя</span><input name="name" type="text" placeholder="Александр" required /></label>
                <label><span>Телефон</span><input name="phone" type="tel" placeholder="+7 999 000-00-00" required /></label>
              </div>
              <label><span>Направление работ</span><select name="service" required defaultValue=""><option value="" disabled>Выберите услугу</option>{siteContent.services.map((service) => <option value={service.title} key={service.id}>{service.title}</option>)}</select></label>
              <label><span>Коротко о задаче</span><textarea name="comment" rows={4} placeholder="Опишите объект, дефект и желаемый срок…" required /></label>
              <label className="file-field"><Paperclip /><span>Прикрепить чертежи или фотографии</span><input type="file" multiple accept="image/*,.pdf,.dwg,.doc,.docx" /></label>
              <button className="button button-submit" type="submit">{formState === "ready" ? <><Check /> Письмо подготовлено</> : <>Отправить на оценку <ArrowUpRight /></>}</button>
              <p className="form-note">Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных.</p>
            </form>
          </section>
        </main>

        <footer className="footer">
          <div className="footer-brand">СДТ<span>®</span></div>
          <div><p>Инженерное усиление<br />и гидроизоляция конструкций</p></div>
          <div><p>Россия, 115201, Москва,<br />Каширский проезд, 5, офис 307</p></div>
          <div className="footer-links"><a href="https://www.sdt-group.ru/politics" target="_blank" rel="noreferrer">Политика данных</a><a href="#main">Наверх ↑</a></div>
          <small>© 2026 Группа компаний СДТ</small>
        </footer>
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}
