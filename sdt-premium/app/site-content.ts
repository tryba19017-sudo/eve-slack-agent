export type ServiceItem = {
  id: string;
  number: string;
  title: string;
  copy: string;
  meta: string;
  image: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  type: string;
  problem: string;
  result: string;
  image: string;
};

export type OfficePhoto = {
  id: string;
  src: string;
  alt: string;
  label: string;
};

export type EventItem = {
  id: string;
  src: string;
  title: string;
  tag: string;
};

export type TeamItem = {
  id: string;
  src: string;
  title: string;
  copy: string;
};

export type BuilderBlock = {
  id: string;
  type: "image-text" | "text" | "gallery";
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  images: string[];
  imageSide: "left" | "right";
  visible: boolean;
};

export type SiteContent = {
  version: 1;
  hero: {
    kicker: string;
    title: [string, string, string];
    copy: string;
    image: string;
  };
  services: ServiceItem[];
  projects: ProjectItem[];
  officePhotos: OfficePhoto[];
  events: EventItem[];
  team: TeamItem[];
  blocks: BuilderBlock[];
};

export const defaultSiteContent: SiteContent = {
  version: 1,
  hero: {
    kicker: "Москва и Московская область",
    title: [
      "УСИЛЕНИЕ СТРОИТЕЛЬНЫХ",
      "КОНСТРУКЦИЙ.",
      "УСТРАНЕНИЕ ПРОТЕЧЕК. РЕСТАВРАЦИЯ ОБЪЕКТОВ.",
    ],
    copy: "Обследование, проектирование, усиление и гидроизоляция сложных конструкций — один ответственный подрядчик от расчёта до исполнительной документации.",
    image: "/sdt-hero-3d.png",
  },
  services: [
    {
      id: "service-injection",
      number: "01",
      title: "Инъектирование",
      copy: "Останавливаем активные протечки, герметизируем швы и трещины без вскрытия всей конструкции.",
      meta: "Полиуретановые смолы · акрилатные гели",
      image: "https://www.cutcarexcontracting.ae/storage/hero-slides/6c85f26c-3b8d-41ad-a46f-2314536504d6.webp",
    },
    {
      id: "service-strengthening",
      number: "02",
      title: "Усиление конструкций",
      copy: "Восстанавливаем и повышаем несущую способность бетона, кирпича и металла с расчётным обоснованием.",
      meta: "Углеволокно · металл · железобетон",
      image: "https://www.globalhighways.com/sites/default/files/styles/original_convert_webp/public/2020-02/Sika%20-%20CarboDur.jpg.webp?itok=9LthkJcm",
    },
    {
      id: "service-survey",
      number: "03",
      title: "Обследование зданий",
      copy: "Фиксируем дефекты, определяем фактическую прочность и создаём цифровую расчётную модель объекта.",
      meta: "Обмеры · испытания · техническое заключение",
      image: "https://www.sdt-group.ru/images/OurWork/image_do/23.JPG",
    },
    {
      id: "service-design",
      number: "04",
      title: "Проектирование",
      copy: "Разрабатываем рабочую документацию для усиления, реконструкции и гидроизоляции сложных объектов.",
      meta: "СНиП · СП · сопровождение экспертизы",
      image: "https://www.sdt-group.ru/images/OurWork/image_do/25.jpg",
    },
    {
      id: "service-shotcrete",
      number: "05",
      title: "Торкретирование",
      copy: "Восстанавливаем геометрию и защитный слой конструкций сухим или мокрым способом.",
      meta: "Ремонт бетона · усиление · защита",
      image: "https://cdn.prod.website-files.com/64f1e7a7a1681bab1f4ebe9a/69f5d020acb5c918e98eb99e_Article%2044-1.jpg",
    },
    {
      id: "service-materials",
      number: "06",
      title: "Поставка материалов",
      copy: "Подбираем и поставляем профессиональные составы и системы для строительных и ремонтных работ.",
      meta: "SIKA · MAPEI · BASF · REMMERS · DRIZORO",
      image: "https://sdt.swipa.ru/assets/about-building-v1.webp",
    },
  ],
  projects: [
    {
      id: "project-city",
      title: "Москва-Сити",
      type: "Инъекционная гидроизоляция",
      problem: "Протечки в швах, скважинах и местах ввода коммуникаций.",
      result: "Швы герметизированы полиуретановой смолой и акрилатным гелем.",
      image: "https://www.sdt-group.ru/images/OurWork/image_do/25.jpg",
    },
    {
      id: "project-sber",
      title: "Центральный офис Сбербанка",
      type: "Комплексная гидроизоляция",
      problem: "Многочисленные протечки в подвальном помещении.",
      result: "Инъектирование, армированная стяжка и защитное покрытие пола.",
      image: "https://www.sdt-group.ru/images/OurWork/image_do/23.JPG",
    },
    {
      id: "project-metro",
      title: "Станция метро «Парк Победы»",
      type: "Ремонт железобетона",
      problem: "Трещины на подрельсовых железобетонных опорах.",
      result: "Трещины раскрыты, очищены и заполнены эпоксидным составом.",
      image: "https://www.cutcarexcontracting.ae/storage/hero-slides/6c85f26c-3b8d-41ad-a46f-2314536504d6.webp",
    },
  ],
  officePhotos: [
    { id: "office-1", src: "https://sdt.swipa.ru/assets/company/office-open-space.jpg", alt: "Открытый офис СДТ", label: "Открытое рабочее пространство" },
    { id: "office-2", src: "https://sdt.swipa.ru/assets/company/office-workspace-wide.jpg", alt: "Рабочие места сотрудников СДТ", label: "Рабочие места инженеров" },
    { id: "office-3", src: "https://sdt.swipa.ru/assets/company/office-workroom.jpg", alt: "Рабочая комната офиса СДТ", label: "Проектная комната" },
    { id: "office-4", src: "https://sdt.swipa.ru/assets/company/office-project-room.jpg", alt: "Сотрудники СДТ работают с документацией", label: "Работа с документацией" },
    { id: "office-5", src: "https://sdt.swipa.ru/assets/company/office-meeting-room.jpg", alt: "Переговорная комната СДТ", label: "Переговорная" },
  ],
  events: [
    { id: "event-1", src: "https://sdt.swipa.ru/assets/company/event-team-gathering.jpg", title: "Общая встреча команды", tag: "Фотоархив СДТ" },
    { id: "event-2", src: "https://sdt.swipa.ru/assets/company/event-engineering-meeting.jpg", title: "Рабочее совещание", tag: "Обмен опытом" },
    { id: "event-3", src: "https://sdt.swipa.ru/assets/company/event-site-team.jpg", title: "Команда на объекте", tag: "Строительная площадка" },
  ],
  team: [
    { id: "team-1", src: "https://sdt.swipa.ru/assets/company/team-company.jpg", title: "Единая команда", copy: "Инженеры, проектировщики и специалисты производства объединяют опыт на каждом этапе проекта." },
    { id: "team-2", src: "https://sdt.swipa.ru/assets/company/team-object-engineers.jpg", title: "Инженеры на объектах", copy: "Обследуют конструкции, подбирают технологии и сопровождают выполнение работ." },
    { id: "team-3", src: "https://sdt.swipa.ru/assets/company/team-field-training.jpg", title: "Профессиональное развитие", copy: "Командные выезды помогают обмениваться практическим опытом и работать согласованно." },
    { id: "team-4", src: "https://sdt.swipa.ru/assets/company/team-production.jpg", title: "Производственная команда", copy: "Выполняет работы на действующих площадках с контролем технологии и качества." },
  ],
  blocks: [],
};
