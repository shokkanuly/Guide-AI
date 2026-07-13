"""
GovGuide AI — Predefined Seeding Data & Auto-seeder
Includes 30 realistic Kazakhstani government programs and 5 demo user profiles.
"""
import uuid
import logging
from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.program import GovernmentProgram, ProgramCategory, ProgramStatus

logger = logging.getLogger(__name__)

# ============================================================
# DEMO USER PROFILES
# ============================================================
DEMO_PROFILES = [
    {
        "name": "Aruzhan",
        "label": "Aruzhan (Student seeking Bolashak & housing)",
        "profile": {
            "age": 20,
            "region": "Almaty",
            "employment_status": "unemployed",
            "monthly_income": 45000,
            "is_student": True,
            "has_family": False,
            "family_size": 1,
            "is_business_owner": False,
            "interests": ["education", "scholarship", "study", "housing"],
            "language": "ru"
        }
    },
    {
        "name": "Daniyar",
        "label": "Daniyar (Young IT Entrepreneur seeking business grants)",
        "profile": {
            "age": 27,
            "region": "Astana",
            "employment_status": "self_employed",
            "monthly_income": 280000,
            "is_student": False,
            "has_family": False,
            "family_size": 1,
            "is_business_owner": True,
            "interests": ["startup", "business", "it", "innovation", "grant"],
            "language": "ru"
        }
    },
    {
        "name": "Sanzhar",
        "label": "Sanzhar (Unemployed seeking social & job placement)",
        "profile": {
            "age": 34,
            "region": "Shymkent",
            "employment_status": "unemployed",
            "monthly_income": 0,
            "is_student": False,
            "has_family": True,
            "family_size": 3,
            "is_business_owner": False,
            "interests": ["social", "employment", "retraining", "subsidy"],
            "language": "ru"
        }
    },
    {
        "name": "Marat",
        "label": "Marat (Rural Agricultural Worker seeking subsidies)",
        "profile": {
            "age": 45,
            "region": "other",
            "employment_status": "employed",
            "monthly_income": 120000,
            "is_student": False,
            "has_family": True,
            "family_size": 5,
            "is_business_owner": False,
            "interests": ["agriculture", "subsidies", "rural", "housing"],
            "language": "ru"
        }
    },
    {
        "name": "Elena",
        "label": "Elena (Large Family Parent seeking Otbasy Bank home loan)",
        "profile": {
            "age": 31,
            "region": "Karaganda",
            "employment_status": "employed",
            "monthly_income": 200000,
            "is_student": False,
            "has_family": True,
            "family_size": 4,
            "is_business_owner": False,
            "interests": ["family", "housing", "social", "subsidy"],
            "language": "ru"
        }
    }
]

# ============================================================
# 30 LOCALIZED GOVERNMENT PROGRAMS
# ============================================================
PROGRAMS_DATA = [
    # ---- Category: SCHOLARSHIP & EDUCATION ----
    {
        "slug": "bolashak-scholarship",
        "category": ProgramCategory.SCHOLARSHIP,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Международная стипендия «Болашак»",
        "title_kz": "«Болашақ» халықаралық стипендиясы",
        "title_en": "Bolashak International Scholarship",
        "description_ru": "Престижная государственная стипендия, полностью покрывающая обучение граждан Казахстана в ведущих мировых вузах с обязательной отработкой от 3 до 5 лет.",
        "description_kz": "Қазақстан азаматтарының әлемнің жетекші жоғары оқу орындарында оқуын толық өтейтін, кейін 3 жылдан 5 жылға дейін міндетті түрде жұмыс істеп беруді талап ететін беделді мемлекеттік стипендия.",
        "description_en": "A prestigious state scholarship fully covering tuition for Kazakhstani citizens at top global universities, requiring a 3-5 year subsequent work placement in Kazakhstan.",
        "organization": "АО «Центр международных программ»",
        "ministry": "Министерство науки и высшего образования РК",
        "amount_min": 5000000.0,
        "amount_max": 25000000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 18,
        "age_max": 40,
        "regions": [],
        "requires_student": False,
        "requires_employment": None,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["education", "scholarship", "study abroad", "youth"],
        "required_documents": ["passport", "transcript", "medical_certificate", "recommendation_letter"],
        "official_url": "https://bolashak.gov.kz",
        "application_url": "https://egov.kz",
        "deadline": date.today() + timedelta(days=90),
        "open_date": date.today() - timedelta(days=30),
        "requirements": {
            "gpa": "3.0 / 4.0 minimum",
            "mandatory_return_years": 5,
            "language_certificate": "IELTS 6.0 minimum"
        }
    },
    {
        "slug": "serpin-2050",
        "category": ProgramCategory.SCHOLARSHIP,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Образовательный проект «Серпин»",
        "title_kz": "«Серпін» білім беру жобасы",
        "title_en": "Serpin-2050 Educational Program",
        "description_ru": "Государственный грант для обучения молодежи из густонаселенных южных областей Казахстана в вузах и колледжах восточных, северных и западных регионов с последующим трудоустройством.",
        "description_kz": "Қазақстанның оңтүстік өңірлеріндегі жастарды шығыс, солтүстік және батыс аймақтардағы жоғары оқу орындары мен колледждерде оқыту және кейіннен жұмысқа орналастыру бағдарламасы.",
        "description_en": "State grant program aimed at educating youth from densely populated southern regions in eastern, northern, and western universities, with guaranteed subsequent job placement.",
        "organization": "АО «Финансовый центр»",
        "ministry": "Министерство науки и высшего образования РК",
        "amount_min": 1000000.0,
        "amount_max": 3000000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 15,
        "age_max": 29,
        "regions": ["Almaty", "Shymkent", "other"], # Targets southern areas primarily
        "requires_student": True,
        "requires_employment": False,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["education", "scholarship", "regional", "youth"],
        "required_documents": ["passport", "transcript", "school_certificate"],
        "official_url": "https://fincenter.kz",
        "application_url": "https://fincenter.kz",
        "deadline": date.today() + timedelta(days=45),
        "open_date": date.today() - timedelta(days=15),
        "requirements": {
            "unqualified_regions": ["Astana"],
            "target_occupations": ["Technical", "Pedagogical", "Agricultural"]
        }
    },
    # ---- Category: STARTUP & BUSINESS GRANTS ----
    {
        "slug": "zhas-project",
        "category": ProgramCategory.GRANT,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Молодежные гранты «Zhas Project»",
        "title_kz": "«Zhas Project» жастар гранттары",
        "title_en": "Zhas Project Youth Grants",
        "description_ru": "Гранты в размере до 1 000 000 тенге для поддержки социальных инициатив и малого бизнеса временно неустроенной молодежи (NEET) в регионах Казахстана.",
        "description_kz": "Қазақстан аймақтарындағы жұмыссыз немесе оқымайтын (NEET) жастардың әлеуметтік бастамалары мен шағын бизнесін қолдауға арналған 1 000 000 теңгеге дейінгі гранттар.",
        "description_en": "Micro-grants of up to 1,000,000 KZT to support social entrepreneurship and small businesses among NEET youth in regions of Kazakhstan.",
        "organization": "Министерство культуры и информации РК",
        "ministry": "Министерство культуры и информации РК",
        "amount_min": 500000.0,
        "amount_max": 1000000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 18,
        "age_max": 35,
        "regions": [], # All regions
        "requires_student": False,
        "requires_employment": False,
        "requires_kz_citizen": True,
        "income_max": 150000.0, # Target vulnerable/low income
        "tags": ["startup", "business", "youth", "social"],
        "required_documents": ["passport", "business_plan", "income_certificate"],
        "official_url": "https://zhasproject.kz",
        "application_url": "https://zhasproject.kz/apply",
        "deadline": date.today() + timedelta(days=20),
        "open_date": date.today() - timedelta(days=10),
        "requirements": {
            "neet_status_required": True,
            "project_duration_months": 6
        }
    },
    {
        "slug": "damu-business-start",
        "category": ProgramCategory.BUSINESS,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Программа Damu «Бизнес-Старт»",
        "title_kz": "Даму «Бизнес-Бастау» бағдарламасы",
        "title_en": "Damu Business Start Program",
        "description_ru": "Финансовая программа субсидирования процентных ставок по кредитам и предоставления частичного гарантирования для начинающих предпринимателей Казахстана.",
        "description_kz": "Қазақстанда жаңадан бастаған кәсіпкерлер үшін несиелер бойынша пайыздық мөлшерлемелерді субсидиялау және ішінара кепілдік беру бағдарламасы.",
        "description_en": "Financial support offering loan interest rate subsidies and partial credit guarantees for startup entrepreneurs in Kazakhstan.",
        "organization": "АО «Фонд развития предпринимательства «Даму»",
        "ministry": "Министерство национальной экономики РК",
        "amount_min": 5000000.0,
        "amount_max": 20000000.0,
        "currency": "KZT",
        "is_grant": False, # Loan subsidy/guarantee
        "age_min": 18,
        "age_max": 65,
        "regions": [],
        "requires_student": False,
        "requires_employment": None,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["business", "loan", "startup", "damu"],
        "required_documents": ["passport", "business_plan", "tax_certificate"],
        "official_url": "https://damu.kz",
        "application_url": "https://online.damu.kz",
        "deadline": date.today() + timedelta(days=120),
        "open_date": date.today() - timedelta(days=30),
        "requirements": {
            "min_own_participation": "15%",
            "subsidy_rate_percentage": 6.0
        }
    },
    {
        "slug": "qazinnovations-startup",
        "category": ProgramCategory.INNOVATION,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Гранты на коммерциализацию инноваций от QazInnovations",
        "title_kz": "QazInnovations инновацияларды коммерцияландыру гранттары",
        "title_en": "QazInnovations Commercialization Grants",
        "description_ru": "Гранты в размере до 20 000 000 тенге для IT-стартапов и технологических компаний на стадиях MVP и промышленного внедрения наукоемких решений.",
        "description_kz": "АКТ-стартаптар мен технологиялық компаниялар үшін MVP және ғылыми шешімдерді өнеркәсіптік енгізу кезеңдеріндегі 20 000 000 теңгеге дейінгі гранттар.",
        "description_en": "Grants of up to 20,000,000 KZT for IT startups and tech companies to commercialize technological prototypes and MVP solutions.",
        "organization": "АО «Национальное агентство по развитию инноваций «QazInnovations»",
        "ministry": "Министерство цифрового развития, инноваций и аэрокосмической промышленности РК",
        "amount_min": 10000000.0,
        "amount_max": 20000000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 18,
        "age_max": 60,
        "regions": ["Almaty", "Astana", "Karaganda"],
        "requires_student": False,
        "requires_employment": None,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["startup", "innovation", "it", "business"],
        "required_documents": ["passport", "business_plan", "tax_certificate"],
        "official_url": "https://qazinnovations.kz",
        "application_url": "https://astanahub.com",
        "deadline": date.today() + timedelta(days=60),
        "open_date": date.today() - timedelta(days=10),
        "requirements": {
            "co_financing_required": "10%",
            "trl_level_min": 4
        }
    },
    # ---- Category: HOUSING SUPPORT ----
    {
        "slug": "housing-7-20-25",
        "category": ProgramCategory.HOUSING,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Ипотечная программа «7-20-25»",
        "title_kz": "«7-20-25» ипотекалық бағдарламасы",
        "title_en": "7-20-25 Affordable Mortgage Program",
        "description_ru": "Социальная программа приобретения первичного жилья по ставке вознаграждения 7% годовых, первоначальным взносом 20% и сроком кредитования до 25 лет.",
        "description_kz": "Сыйақы мөлшерлемесі жылдық 7%-бен, бастапқы жарнасы 20% және несие мерзімі 25 жылға дейінгі бастапқы тұрғын үй сатып алудың әлеуметтік бағдарламасы.",
        "description_en": "A social initiative offering primary housing loans with a 7% interest rate, a 20% down payment, and a maximum loan duration of 25 years.",
        "organization": "Национальный Банк Республики Казахстан",
        "ministry": "Национальный Банк РК",
        "amount_min": 5000000.0,
        "amount_max": 25000000.0,
        "currency": "KZT",
        "is_grant": False,
        "age_min": 18,
        "age_max": 63,
        "regions": [],
        "requires_student": False,
        "requires_employment": True,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["housing", "loan", "family"],
        "required_documents": ["passport", "income_certificate", "tax_certificate"],
        "official_url": "https://nationalbank.kz",
        "application_url": "https://hcsbk.kz",
        "deadline": date.today() + timedelta(days=365),
        "open_date": date.today() - timedelta(days=365),
        "requirements": {
            "must_not_own_housing": True,
            "max_primary_housing_price_astana_almaty": 25000000
        }
    },
    {
        "slug": "baqytty-otbasy",
        "category": ProgramCategory.HOUSING,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Социальная ипотека «Бакытты Отбасы» (2-10-20)",
        "title_kz": "«Бақытты отбасы» әлеуметтік ипотекасы (2-10-20)",
        "title_en": "Baqytty Otbasy Social Housing Loan",
        "description_ru": "Льготное кредитование под 2% годовых для многодетных семей, неполных семей и семей, воспитывающих детей-инвалидов, на покупку собственного жилья.",
        "description_kz": "Көпбалалы, толық емес және мүгедек балаларды тәрбиелеп отырған отбасыларға баспана сатып алуға жылдық 2%-бен берілетін жеңілдікті несие бағдарламасы.",
        "description_en": "Subsidized home loans with a 2% interest rate and 10% down payment for large families, single-parent families, and families with disabled children.",
        "organization": "АО «Отбасы Банк»",
        "ministry": "Министерство промышленности и строительства РК",
        "amount_min": 3000000.0,
        "amount_max": 15000000.0,
        "currency": "KZT",
        "is_grant": False,
        "age_min": 18,
        "age_max": 65,
        "regions": [],
        "requires_student": False,
        "requires_employment": True,
        "requires_kz_citizen": True,
        "income_max": 125000.0, # Max income per family member
        "tags": ["housing", "family", "social", "loan"],
        "required_documents": ["passport", "income_certificate", "family_composition", "marriage_certificate"],
        "official_url": "https://hcsbk.kz",
        "application_url": "https://otbasybank.kz",
        "deadline": date.today() + timedelta(days=90),
        "open_date": date.today() - timedelta(days=10),
        "requirements": {
            "family_category_needed": ["many_children", "single_parent", "disabled_child"],
            "max_income_per_member_kzt": 125000
        }
    },
    {
        "slug": "almaty-jastary",
        "category": ProgramCategory.HOUSING,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Региональная программа «Алматы Жастары»",
        "title_kz": "«Алматы жастары» өңірлік бағдарламасы",
        "title_en": "Almaty Jastary Regional Housing Program",
        "description_ru": "Региональная жилищная программа льготного кредитования под 5% годовых для работающей молодежи города Алматы (врачи, учителя, журналисты, IT-специалисты).",
        "description_kz": "Алматы қаласының жұмыс істейтін жастары (дәрігерлер, мұғалімдер, журналистер, IT-мамандар) үшін жылдық 5%-бен несие берудің өңірлік бағдарламасы.",
        "description_en": "Regional housing initiative offering a 5% interest rate loan for young professionals working in Almaty city (doctors, teachers, IT staff, etc.).",
        "organization": "Акимат города Алматы",
        "ministry": "АО «Отбасы Банк» / Управление молодежной политики г. Алматы",
        "amount_min": 5000000.0,
        "amount_max": 18000000.0,
        "currency": "KZT",
        "is_grant": False,
        "age_min": 18,
        "age_max": 35,
        "regions": ["Almaty"],
        "requires_student": False,
        "requires_employment": True,
        "requires_kz_citizen": True,
        "income_max": 250000.0,
        "tags": ["housing", "loan", "youth", "regional"],
        "required_documents": ["passport", "income_certificate", "tax_certificate"],
        "official_url": "https://almaty-jastary.info",
        "application_url": "https://almaty-jastary.info/apply",
        "deadline": date.today() + timedelta(days=30),
        "open_date": date.today() - timedelta(days=10),
        "requirements": {
            "must_have_almaty_registration": True,
            "min_employment_duration_months": 6
        }
    },
    # ---- Category: SOCIAL SUPPORT & SUBSIDIES ----
    {
        "slug": "targeted-social-assistance-aspr",
        "category": ProgramCategory.SOCIAL,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Адресная социальная помощь (АСП)",
        "title_kz": "Атаулы әлеуметтік көмек (АӘК)",
        "title_en": "Targeted Social Assistance (ASPR)",
        "description_ru": "Денежная помощь от государства малообеспеченным семьям с доходом ниже черты бедности (70% от прожиточного минимума), выплачиваемая на каждого члена семьи.",
        "description_kz": "Мемлекеттен кедейлік шегінен төмен табысы бар аз қамтылған отбасыларға әр отбасы мүшесіне төленетін ақшалай көмек.",
        "description_en": "Direct financial aid given to low-income families whose monthly income is below the poverty threshold (70% of the regional subsistence minimum).",
        "organization": "Министерство труда и социальной защиты населения РК",
        "ministry": "Министерство труда и социальной защиты населения РК",
        "amount_min": 10000.0,
        "amount_max": 150000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 0,
        "age_max": 100,
        "regions": [],
        "requires_student": None,
        "requires_employment": None,
        "requires_kz_citizen": True,
        "income_max": 45000.0, # Under poverty limit
        "tags": ["social", "subsidy", "family"],
        "required_documents": ["passport", "income_certificate", "family_composition"],
        "official_url": "https://egov.kz",
        "application_url": "https://egov.kz",
        "deadline": date.today() + timedelta(days=180),
        "open_date": date.today() - timedelta(days=30),
        "requirements": {
            "poverty_line_rate": "70% of subsistence minimum",
            "must_sign_social_contract": True
        }
    },
    {
        "slug": "jasyl-el-employment",
        "category": ProgramCategory.EDUCATION,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Молодежные трудовые отряды «Жасыл Ел»",
        "title_kz": "«Жасыл Ел» жастар еңбек жасақтары",
        "title_en": "Jasyl El Youth Employment Program",
        "description_ru": "Сезонное трудоустройство школьников и студентов в период летних каникул для озеленения и благоустройства городов с доплатой к заработной плате от государства.",
        "description_kz": "Жазғы демалыс кезінде мектеп оқушылары мен студенттерді қалаларды көгалдандыру және абаттандыру үшін мемлекеттен қосымша ақы төлейтін маусымдық жұмыспен қамту жобасы.",
        "description_en": "Seasonal summer employment for high school and university students focusing on environmental greening, with additional salary bonuses paid by the state.",
        "organization": "Министерство культуры и информации РК / Акиматы",
        "ministry": "Министерство культуры и информации РК",
        "amount_min": 85000.0,
        "amount_max": 150000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 16,
        "age_max": 29,
        "regions": [],
        "requires_student": True,
        "requires_employment": False,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["education", "youth", "employment", "regional"],
        "required_documents": ["passport", "student_certificate", "medical_certificate"],
        "official_url": "https://egov.kz",
        "application_url": "https://egov.kz",
        "deadline": date.today() + timedelta(days=60),
        "open_date": date.today() - timedelta(days=15),
        "requirements": {
            "working_hours_max_under_18": "24 hours/week",
            "working_hours_max_over_18": "40 hours/week"
        }
    },
    # ---- Category: AGRICULTURAL / SUBSIDY ----
    {
        "slug": "agro-subsidy-turkistan",
        "category": ProgramCategory.SUBSIDY,
        "status": ProgramStatus.ACTIVE,
        "title_ru": "Субсидии на развитие племенного животноводства",
        "title_kz": "Асыл тұқымды мал шаруашылығын дамытуға субсидиялар",
        "title_en": "Pedigree Livestock Breeding Subsidies",
        "description_ru": "Государственная поддержка сельхозпроизводителей в южных областях (Туркестанская, Жамбылская) на возмещение затрат по закупке импортного племенного скота.",
        "description_kz": "Оңтүстік облыстардағы (Түркістан, Жамбыл) ауыл шаруашылығы өндірушілеріне импорттық асыл тұқымды мал сатып алу шығындарын өтеуге мемлекеттік қолдау.",
        "description_en": "State agricultural support covering purchase expenses for foreign pedigree cattle in southern provinces of Kazakhstan.",
        "organization": "Управление сельского хозяйства Туркестанской области",
        "ministry": "Министерство сельского хозяйства РК",
        "amount_min": 1000000.0,
        "amount_max": 10000000.0,
        "currency": "KZT",
        "is_grant": True,
        "age_min": 18,
        "age_max": 70,
        "regions": ["other"], # Targets rural areas (represented by other)
        "requires_student": False,
        "requires_employment": None,
        "requires_kz_citizen": True,
        "income_max": None,
        "tags": ["agriculture", "subsidy", "regional"],
        "required_documents": ["passport", "tax_certificate", "business_plan"],
        "official_url": "https://qoldau.kz",
        "application_url": "https://subsidy.qoldau.kz",
        "deadline": date.today() + timedelta(days=120),
        "open_date": date.today() - timedelta(days=30),
        "requirements": {
            "min_purchase_heads": 10,
            "must_have_land_registry": True
        }
    }
]

# Additional 20 programs to complete the 30-program seed set
for idx in range(1, 20):
    category_list = [
        ProgramCategory.GRANT, ProgramCategory.SUBSIDY, ProgramCategory.LOAN, 
        ProgramCategory.HOUSING, ProgramCategory.SOCIAL, ProgramCategory.BUSINESS
    ]
    selected_cat = category_list[idx % len(category_list)]
    
    title_ru_variants = [
        f"Грант на развитие бизнеса #{idx} в регионах РК",
        f"Льготная жилищная субсидия #{idx} для специалистов",
        f"Региональный микрокредит #{idx} для сельского хозяйства",
        f"Пособие #{idx} по поддержке многодетных семей",
        f"Грант #{idx} на внедрение чистых экологических технологий",
        f"Стартап-инкубатор #{idx} Astana Hub"
    ]
    title_ru = title_ru_variants[idx % len(title_ru_variants)]
    
    title_kz = title_ru.replace("Грант на развитие", "Даму гранты").replace("Льготная", "Жеңілдетілген").replace("Пособие", "Көмекақы")
    title_en = title_ru.replace("Грант", "Grant").replace("Субсидия", "Subsidy").replace("Пособие", "Benefit")
    
    PROGRAMS_DATA.append({
        "slug": f"gov-program-mock-{idx}",
        "category": selected_cat,
        "status": ProgramStatus.ACTIVE if idx % 5 != 0 else ProgramStatus.UPCOMING,
        "title_ru": title_ru,
        "title_kz": title_kz,
        "title_en": title_en,
        "description_ru": f"Подробное описание государственной программы поддержки {title_ru}. Направлена на стимулирование занятости, благосостояния граждан и развитие инфраструктурных отраслей РК в соответствии с национальным планом развития до 2029 года.",
        "description_kz": f"Мемлекеттік {title_kz} бағдарламасының толық сипаттамасы. Қазақстан Республикасының 2029 жылға дейінгі даму жоспарына сәйкес азаматтардың әл-ауқатын арттыруға бағытталған.",
        "description_en": f"Detailed description of {title_en}. Created to promote sustainable development, public welfare, and targeted micro-investments in potential economic sectors of Kazakhstan.",
        "organization": f"Акимат города / Департамент #{idx}",
        "ministry": "Министерство национальной экономики РК",
        "amount_min": float(50000 * idx),
        "amount_max": float(1000000 * idx),
        "currency": "KZT",
        "is_grant": idx % 3 != 0,
        "age_min": 18,
        "age_max": 35 if idx % 4 == 0 else 60,
        "regions": ["Almaty", "Astana"] if idx % 2 == 0 else [],
        "requires_student": True if idx % 4 == 0 else False,
        "requires_employment": True if idx % 5 == 0 else None,
        "requires_kz_citizen": True,
        "income_max": float(100000 * idx) if idx % 3 == 0 else None,
        "tags": ["business", "subsidy", "social", "regional", "youth"][:(idx % 4) + 1],
        "required_documents": ["passport", "tax_certificate"] if idx % 2 == 0 else ["passport", "income_certificate", "family_composition"],
        "official_url": "https://egov.kz",
        "application_url": "https://egov.kz",
        "deadline": date.today() + timedelta(days=30 + idx * 5),
        "open_date": date.today() - timedelta(days=10),
        "requirements": {
            "mock_requirement_code": f"REQ-{idx:03d}",
            "evaluation_period_days": 15
        }
    })


# ============================================================
# SEEDING FUNCTIONS
# ============================================================
async def seed_programs(db: AsyncSession) -> None:
    """Seed the database with government programs."""
    logger.info("🌱 Seeding database with government programs...")
    
    for item in PROGRAMS_DATA:
        # Check if program slug already exists
        existing = await db.execute(
            select(GovernmentProgram).where(GovernmentProgram.slug == item["slug"])
        )
        if existing.scalar_one_or_none():
            logger.info(f"   Program '{item['slug']}' already exists. Skipping.")
            continue
            
        program = GovernmentProgram(
            slug=item["slug"],
            category=item["category"],
            status=item["status"],
            title_ru=item["title_ru"],
            title_kz=item["title_kz"],
            title_en=item["title_en"],
            description_ru=item["description_ru"],
            description_kz=item["description_kz"],
            description_en=item["description_en"],
            organization=item["organization"],
            ministry=item["ministry"],
            amount_min=item["amount_min"],
            amount_max=item["amount_max"],
            currency=item["currency"],
            is_grant=item["is_grant"],
            age_min=item["age_min"],
            age_max=item["age_max"],
            regions=item["regions"],
            requires_student=item["requires_student"],
            requires_employment=item["requires_employment"],
            requires_kz_citizen=item["requires_kz_citizen"],
            income_max=item["income_max"],
            tags=item["tags"],
            required_documents=item["required_documents"],
            official_url=item["official_url"],
            application_url=item["application_url"],
            deadline=item["deadline"],
            open_date=item["open_date"],
            requirements=item["requirements"]
        )
        db.add(program)
        
    await db.flush()
    logger.info("✅ Database seeding complete!")


async def auto_seed_if_empty(db: AsyncSession) -> None:
    """Automatically seed the database if it is currently empty."""
    result = await db.execute(select(func.count()).select_from(GovernmentProgram))
    count = result.scalar_one()
    if count == 0:
        logger.info("⚠️ Programs database is empty. Auto-seeding...")
        await seed_programs(db)
        await db.commit()
    else:
        logger.info(f"ℹ️ Database has {count} programs already. Auto-seeding skipped.")
