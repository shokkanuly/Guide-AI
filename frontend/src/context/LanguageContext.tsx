"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "ru" | "kz";

const translations = {
  en: {
    // Nav & Sidebar
    dashboard: "Dashboard",
    aiChat: "AI Chat",
    documentAnalyzer: "Document Analyzer",
    eligibilityChecker: "Eligibility Checker",
    govSearch: "Government Search",
    savedPrograms: "Saved Programs",
    profileSettings: "Profile Settings",
    signOut: "Sign Out",
    welcome: "Welcome back",
    activeRoadmaps: "Active Roadmaps",
    savedOpportunities: "Saved Opportunities",
    profileCompleteness: "Profile Completeness",
    viewRoadmaps: "View tracking roadmaps",
    exploreGrants: "Explore grants catalog",
    completeProfile: "Complete profile details",
    quickTools: "Quick Tools",
    analyzeDoc: "Analyze Document",
    summaryRisks: "Summary & risks from PDF",
    govSearchDesc: "Semantic search across egov",
    unreadNotif: "unread notification",
    unreadNotifs: "unread notifications",
    viewNotif: "View notifications",
    
    // Chat Page
    newChat: "+ New Chat Session",
    recentChats: "Recent Chats",
    govNavigator: "GovGuide AI Navigator",
    chatPrompt: "Ask any government grant or rules question",
    chatPlaceholder: "Ask about grants, documents, LLP setup rules...",
    matchedOpportunities: "Matched Opportunities Found:",
    sources: "Sources:",

    // Document Analyzer
    docAnalyzerDesc: "Upload any government document or law PDF to instantly extract structured steps, dates, and risks.",
    uploadDoc: "Upload Document",
    selectPdf: "Select PDF Document",
    pdfLimit: "Supported formats: PDF (max 20MB)",
    runAnalysis: "Run AI Analysis",
    analyzingDoc: "Analyzing Document...",
    analyzingGovDoc: "Analyzing Government Document",
    aiProcessing: "Extracting PDF text and processing structure with GPT-4o. This typically takes 10 to 30 seconds.",
    noDocTitle: "No Document Analyzed",
    noDocDesc: "Upload a government PDF on the left to view structural summaries, advantages, warnings, dates, and checklists.",
    summaryTab: "Summary",
    actionsTab: "Actions",
    docsTab: "Docs",
    datesTab: "Dates",
    overview: "Overview Summary",
    whoQualifies: "Who Qualifies",
    keyFinancials: "Key Financials / Limits",
    keyAdvantages: "Key Advantages",
    risksReqs: "Risks & Requirements",
    recommendedActions: "AI Recommended Action Plan",
    requiredChecklist: "Required Documents Checklist",
    noDocsListed: "No specific documents listed in this file.",
    importantDates: "Important Dates & Deadlines",
    noDeadlines: "No deadlines or schedules mentioned in this file.",
    officialCitations: "Official References Citations",

    // Eligibility Page
    eligibilityDesc: "Fill in your profile details to see which government grants, subsidies, and programs you qualify for.",
    profileMetrics: "Your Profile Metrics",
    age: "Age",
    region: "Region",
    monthlyIncome: "Monthly Income (₸)",
    employmentStatus: "Employment Status",
    socialStatus: "Social Status Options",
    isStudent: "Is currently a student",
    ownsBusiness: "Owns a registered business (LLP, IE)",
    hasFamily: "Has family dependencies",
    familySize: "Family Size",
    interests: "Interests / Focus Tags (comma-separated)",
    interestsPlaceholder: "it, startup, agriculture, education",
    evaluateGrants: "Evaluate Eligible Grants",
    awaitingMatching: "Awaiting Matching Run",
    awaitingMatchingDesc: "Fill in your profile criteria on the left to see matching government initiatives sorted by score percentage.",
    noGrantsTitle: "No Matching Programs Found",
    noGrantsDesc: "Try broadening your profile criteria (e.g., adding interests, adjusted income metric) to match generic local programs.",
    matchedGovPrograms: "Matched Government Programs",
    whyQualify: "Why you qualify:",
    missingCriteria: "Missing Criteria:",
    createRoadmap: "Create Application Roadmap",
    officialSite: "Official Site",

    // Search Page
    searchDesc: "Search semantically across government documents, laws, regulations, and programs.",
    searchPlaceholder: "Search LLP rules, youth grants, student subsidies...",
    allContent: "All Content",
    programsOnly: "Programs Only",
    lawsOnly: "Laws & Regulations",
    searchBtn: "Search",
    awaitingSearch: "Enter your search term",
    awaitingSearchDesc: "Type any query above to run deep similarity searches against our compiled knowledge library.",
    relevance: "Relevance",

    // Profile Settings
    profileDesc: "Maintain your user metrics to customize grant matching and roadmap generation.",
    saveSettings: "Save Settings",
    
    // Notifications Page
    notifCenter: "Notification Center",
    notifDesc: "Stay updated on deadline reminders and newly released local grants.",
    markAllRead: "Mark all read",
    allCaughtUp: "All Caught Up!",
    allCaughtUpDesc: "You don't have any system updates or alert notifications at the moment.",
  },
  ru: {
    // Nav & Sidebar
    dashboard: "Панель управления",
    aiChat: "ИИ Чат",
    documentAnalyzer: "Анализатор документов",
    eligibilityChecker: "Проверка соответствия",
    govSearch: "Государственный поиск",
    savedPrograms: "Сохраненные программы",
    profileSettings: "Настройки профиля",
    signOut: "Выйти",
    welcome: "С возвращением",
    activeRoadmaps: "Активные дорожные карты",
    savedOpportunities: "Сохраненные гранты",
    profileCompleteness: "Заполнение профиля",
    viewRoadmaps: "Посмотреть дорожные карты",
    exploreGrants: "Посмотреть каталог грантов",
    completeProfile: "Заполнить детали профиля",
    quickTools: "Быстрые инструменты",
    analyzeDoc: "Анализ документа",
    summaryRisks: "Краткое содержание и риски из PDF",
    govSearchDesc: "Семантический поиск по eGov",
    unreadNotif: "непрочитанное уведомление",
    unreadNotifs: "непрочитанных уведомлений",
    viewNotif: "Посмотреть уведомления",

    // Chat Page
    newChat: "+ Новый чат",
    recentChats: "Недавние диалоги",
    govNavigator: "Навигатор GovGuide ИИ",
    chatPrompt: "Задайте любой вопрос о госуслугах, грантах или правилах",
    chatPlaceholder: "Спросите о грантах, документах, правилах создания ТОО...",
    matchedOpportunities: "Найденные совпадения:",
    sources: "Источники:",

    // Document Analyzer
    docAnalyzerDesc: "Загрузите любой правительственный документ или закон в формате PDF для мгновенного извлечения шагов, дат и рисков.",
    uploadDoc: "Загрузить документ",
    selectPdf: "Выбрать PDF документ",
    pdfLimit: "Поддерживаемые форматы: PDF (макс. 20МБ)",
    runAnalysis: "Запустить анализ ИИ",
    analyzingDoc: "Анализ документа...",
    analyzingGovDoc: "Анализ государственного документа",
    aiProcessing: "Извлечение текста PDF и обработка структуры с помощью GPT-4o. Обычно это занимает от 10 до 30 секунд.",
    noDocTitle: "Документ не проанализирован",
    noDocDesc: "Загрузите PDF-файл слева, чтобы просмотреть сводки, преимущества, предупреждения, даты и чек-листы.",
    summaryTab: "Сводка",
    actionsTab: "Действия",
    docsTab: "Документы",
    datesTab: "Даты",
    overview: "Краткое содержание",
    whoQualifies: "Кто подходит",
    keyFinancials: "Ключевые показатели / Лимиты",
    keyAdvantages: "Ключевые преимущества",
    risksReqs: "Риски и требования",
    recommendedActions: "Рекомендуемый план действий ИИ",
    requiredChecklist: "Чек-лист необходимых документов",
    noDocsListed: "В этом файле не указаны конкретные документы.",
    importantDates: "Важные даты и сроки",
    noDeadlines: "В этом файле не упоминаются сроки или расписания.",
    officialCitations: "Ссылки на официальные источники",

    // Eligibility Page
    eligibilityDesc: "Заполните данные профиля, чтобы узнать, на какие государственные гранты, субсидии и программы вы можете претендовать.",
    profileMetrics: "Метрики вашего профиля",
    age: "Возраст",
    region: "Регион",
    monthlyIncome: "Ежемесячный доход (₸)",
    employmentStatus: "Статус занятости",
    socialStatus: "Социальный статус",
    isStudent: "Является студентом",
    ownsBusiness: "Имеет зарегистрированный бизнес (ТОО, ИП)",
    hasFamily: "Имеет иждивенцев в семье",
    familySize: "Размер семьи",
    interests: "Интересы / Теги (через запятую)",
    interestsPlaceholder: "it, стартап, сельское хозяйство, образование",
    evaluateGrants: "Оценить подходящие гранты",
    awaitingMatching: "Ожидание запуска сопоставления",
    awaitingMatchingDesc: "Заполните критерии профиля слева, чтобы увидеть подходящие государственные инициативы, отсортированные по проценту соответствия.",
    noGrantsTitle: "Подходящие программы не найдены",
    noGrantsDesc: "Попробуйте расширить критерии профиля (например, добавить интересы, изменить доход) для соответствия общим локальным программам.",
    matchedGovPrograms: "Подходящие госпрограммы",
    whyQualify: "Почему вы подходите:",
    missingCriteria: "Несоответствующие критерии:",
    createRoadmap: "Создать дорожную карту подачи",
    officialSite: "Официальный сайт",

    // Search Page
    searchDesc: "Семантический поиск по государственным документам, законам, правилам и программам.",
    searchPlaceholder: "Поиск правил ТОО, молодежных грантов, студенческих субсидий...",
    allContent: "Весь контент",
    programsOnly: "Только программы",
    lawsOnly: "Законы и правила",
    searchBtn: "Найти",
    awaitingSearch: "Введите поисковый запрос",
    awaitingSearchDesc: "Введите любой запрос выше для глубокого поиска совпадений в нашей библиотеке знаний.",
    relevance: "Соответствие",

    // Profile Settings
    profileDesc: "Обновите параметры вашего профиля для точной настройки рекомендаций грантов и создания дорожных карт.",
    saveSettings: "Сохранить настройки",

    // Notifications Page
    notifCenter: "Центр уведомлений",
    notifDesc: "Будьте в курсе напоминаний о сроках подачи документов и новых доступных грантах.",
    markAllRead: "Отметить все как прочитанные",
    allCaughtUp: "Все прочитано!",
    allCaughtUpDesc: "На данный момент у вас нет новых системных уведомлений или предупреждений.",
  },
  kz: {
    // Nav & Sidebar
    dashboard: "Басқару панелі",
    aiChat: "ИИ Чат",
    documentAnalyzer: "Құжаттарды талдау",
    eligibilityChecker: "Сәйкестікті тексеру",
    govSearch: "Мемлекеттік іздеу",
    savedPrograms: "Сақталған бағдарламалар",
    profileSettings: "Профиль баптаулары",
    signOut: "Шығу",
    welcome: "Қош келдіңіз",
    activeRoadmaps: "Белсенді жол карталары",
    savedOpportunities: "Сақталған гранттар",
    profileCompleteness: "Профильдің толтырылуы",
    viewRoadmaps: "Жол карталарын көру",
    exploreGrants: "Гранттар каталогын көру",
    completeProfile: "Профильді толтыру",
    quickTools: "Жылдам құралдар",
    analyzeDoc: "Құжатты талдау",
    summaryRisks: "PDF құжатынан қысқаша мазмұны мен тәуекелдер",
    govSearchDesc: "eGov бойынша семантикалық іздеу",
    unreadNotif: "оқылмаған хабарлама",
    unreadNotifs: "оқылмаған хабарламалар",
    viewNotif: "Хабарламаларды көру",

    // Chat Page
    newChat: "+ Жаңа чат",
    recentChats: "Соңғы чаттар",
    govNavigator: "GovGuide ИИ Навигаторы",
    chatPrompt: "Мемлекеттік қызметтер, гранттар немесе ережелер туралы кез келген сұрақ қойыңыз",
    chatPlaceholder: "Гранттар, құжаттар, ЖШС құру ережелері туралы сұраңыз...",
    matchedOpportunities: "Табылған сәйкестіктер:",
    sources: "Дереккөздер:",

    // Document Analyzer
    docAnalyzerDesc: "Қадамдарды, мерзімдерді және тәуекелдерді бірден анықтау үшін кез келген мемлекеттік құжатты немесе заңды PDF форматында жүктеңіз.",
    uploadDoc: "Құжатты жүктеу",
    selectPdf: "PDF құжатын таңдау",
    pdfLimit: "Қолдау көрсетілетін форматтар: PDF (макс. 20МБ)",
    runAnalysis: "ИИ талдауын қосу",
    analyzingDoc: "Құжатты талдау...",
    analyzingGovDoc: "Мемлекеттік құжатты талдау",
    aiProcessing: "PDF мәтінін алу және GPT-4o арқылы құрылымын талдау. Бұл әдетте 10-нан 30 секундқа дейін уақыт алады.",
    noDocTitle: "Құжат талданбаған",
    noDocDesc: "Сәйкестіктерді, артықшылықтарды, ескертулерді, мерзімдерді және чек-парақтарды көру үшін сол жақтан PDF файлын жүктеңіз.",
    summaryTab: "Мазмұны",
    actionsTab: "Әрекеттер",
    docsTab: "Құжаттар",
    datesTab: "Мерзімдер",
    overview: "Қысқаша мазмұны",
    whoQualifies: "Кімге сәйкес келеді",
    keyFinancials: "Негізгі көрсеткіштер / Лимиттер",
    keyAdvantages: "Негізгі артықшылықтар",
    risksReqs: "Тәуекелдер мен талаптар",
    recommendedActions: "ИИ ұсынған әрекеттер жоспары",
    requiredChecklist: "Қажетті құжаттар тізімі",
    noDocsListed: "Бұл файлда нақты құжаттар көрсетілмеген.",
    importantDates: "Маңызды күндер мен мерзімдер",
    noDeadlines: "Бұл файлда мерзімдер немесе кестелер көрсетілмеген.",
    officialCitations: "Ресми дереккөздерге сілтемелер",

    // Eligibility Page
    eligibilityDesc: "Қандай мемлекеттік гранттарды, субсидияларды және бағдарламаларды ала алатыныңызды білу үшін профиль мәліметтерін толтырыңыз.",
    profileMetrics: "Профиль көрсеткіштері",
    age: "Жас",
    region: "Аймақ",
    monthlyIncome: "Айлық табыс (₸)",
    employmentStatus: "Жұмыспен қамтылу мәртебесі",
    socialStatus: "Әлеуметтік мәртебе",
    isStudent: "Студент болып табылады",
    ownsBusiness: "Тіркелген бизнесі бар (ЖШС, ЖК)",
    hasFamily: "Отбасында асырауындағы адамдар бар",
    familySize: "Отбасы мөлшері",
    interests: "Қызығушылықтар / Тегтер (үтір арқылы)",
    interestsPlaceholder: "it, стартап, ауыл шаруашылығы, білім беру",
    evaluateGrants: "Сәйкес келетін гранттарды бағалау",
    awaitingMatching: "Сәйкестендіруді күту",
    awaitingMatchingDesc: "Сәйкестік пайызы бойынша сұрыпталған мемлекеттік бағдарламаларды көру үшін сол жақтағы профиль критерийлерін толтырыңыз.",
    noGrantsTitle: "Сәйкес келетін бағдарламалар табылмады",
    noGrantsDesc: "Жалпы жергілікті бағдарламаларға сәйкес келу үшін профиль критерийлерін кеңейтіп көріңіз (мысалы, қызығушылықтарды қосыңыз, табысты өзгертіңіз).",
    matchedGovPrograms: "Сәйкес мемлекеттік бағдарламалар",
    whyQualify: "Неліктен сәйкес келесіз:",
    missingCriteria: "Сәйкес келмейтін критерийлер:",
    createRoadmap: "Өтінім берудің жол картасын жасау",
    officialSite: "Ресми сайт",

    // Search Page
    searchDesc: "Мемлекеттік құжаттар, заңдар, ережелер мен бағдарламалар бойынша семантикалық іздеу.",
    searchPlaceholder: "ЖШС ережелерін, жастар гранттарын, студенттік субсидияларды іздеу...",
    allContent: "Барлық мазмұн",
    programsOnly: "Тек бағдарламалар",
    lawsOnly: "Заңдар мен ережелер",
    searchBtn: "Іздеу",
    awaitingSearch: "Іздеу сұрауын енгізіңіз",
    awaitingSearchDesc: "Біздің білім кітапханамыздан сәйкестіктерді іздеу үшін кез келген сұрауды енгізіңіз.",
    relevance: "Сәйкестік",

    // Profile Settings
    profileDesc: "Гранттарды сәйкестендіруді және жол карталарын құруды дәл баптау үшін профиль параметрлерін толтырыңыз.",
    saveSettings: "Баптауларды сақтау",

    // Notifications Page
    notifCenter: "Хабарлама орталығы",
    notifDesc: "Құжаттарды тапсыру мерзімдері және жаңа қолжетімді гранттар туралы хабардар болыңыз.",
    markAllRead: "Барлығын оқылған деп белгілеу",
    allCaughtUp: "Барлығы оқылды!",
    allCaughtUpDesc: "Қазіргі уақытта сізде жаңа жүйелік хабарламалар немесе ескертулер жоқ.",
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof typeof translations["en"]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("govguide_lang") as LanguageCode;
    if (saved && (saved === "en" || saved === "ru" || saved === "kz")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("govguide_lang", lang);
  };

  const t = (key: keyof typeof translations["en"]) => {
    return translations[language][key] || translations["en"][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
