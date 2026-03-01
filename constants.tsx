
import { Project, Skill, Experience } from './types';

export const PERSONAL_INFO = {
  name: "杨涛",
  engName: "Yang Tao",
  title: "AI 设计总监",
  zhTitle: "资深设计总监 & AI 专家",
  bio: "18年+ 设计行业全领域深耕经验，兼具“传统设计功底 + AI 技术落地 + 全流程项目把控 + 团队管理”的复合型核心优势。现致力于以 AI 技术赋能内容生产，实现商业价值与创意表达的双重落地。",
  fullBio: "拥有 18 年 + 设计行业全领域深耕经验，兼具 “传统设计功底 + AI 技术落地 + 全流程项目把控 + 团队管理” 的复合型核心优势。2023 年起聚焦 AIGC 技术在设计领域的深度应用，精通模型部署、Lora 训练等核心技能；2025 年 9 月转型 AI 漫剧与 AI 商业视频创作，掌握 “编剧 - 导演 - 分镜 - 美术 - 剪辑 - 配音” 全流程工作能力，产出作品获客户认可并成功投放。曾以独立设计师身份长期服务安踏、雀巢、立白、牛茶、松果健康等品牌，主导线上线下品牌形象及营销设计；过往历任 UED 设计总监等管理岗位，具备政务、商业、国际赛事等多场景高含金量项目操盘经验，现致力于以 AI 技术赋能内容创作，深耕 AI 导演、AI 设计赛道，实现商业价值与创意表达的双重落地。",
  heroImageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop", 
  details: {
    "年龄": "42岁",
    "行业经验": "18年+",
    "擅长领域": "AI 视觉应用 / 品牌设计",
    "城市": "北京",
    "邮箱": "yt1721@126.com",
    "电话": "13683128008"
  },
  education: [
    { school: "西班牙康普顿斯大学", degree: "IT 管理硕士", year: "2020.03 - 2022.03" },
    { school: "中央美术学院", degree: "视觉传达本科", year: "2005.03 - 2008.01" },
    { school: "中央美术学院", degree: "视觉传达大专", year: "2002.09 - 2004.07" },
    { school: "内蒙古商贸职业学院", degree: "广告设计中专", year: "1999.09 - 2002.06" }
  ],
  hobbies: ["健身", "跑步", "机车骑行", "绘画", "摄影", "旅行", "原创手作", "纹身"],
  awards: [
    "广告设计人员 四级/中级技能证书",
    "第13届台湾时报广告金犊奖优秀奖",
    "中国设计之窗冶父奖",
    "中美纹身协会会员"
  ]
};

// 工作能力 - 第一组
export const ABILITY_SCORES = [
  { name: "领导力", score: 85 },
  { name: "沟通力", score: 88 },
  { name: "理解力", score: 92 },
  { name: "创新力", score: 75 },
  { name: "影响力", score: 70 },
  { name: "技术力", score: 80 },
  { name: "培训力", score: 65 }
];

// 知识储备
export const MANAGEMENT_SCORES = [
  { name: "专业知识", score: 85 },
  { name: "管理知识", score: 70 },
  { name: "投资知识", score: 45 }
];

// 软件应用能力
export const SOFTWARE_SKILLS = [
  { name: "Illustrator", score: 95 },
  { name: "Photoshop", score: 95 },
  { name: "Figma", score: 90 },
  { name: "Sketch", score: 88 },
  { name: "MasterGo", score: 85 },
  { name: "Midjourney", score: 92 },
  { name: "Stable Diffusion", score: 90 },
  { name: "ComfyUI", score: 75 },
  { name: "Cinema 4D", score: 85 },
  { name: "Indesign", score: 88 },
  { name: "剪映", score: 90 },
  { name: "Procreate", score: 88 }
];

export const AI_SKILLS: Skill[] = [
  {
    name: "AIGC 技术应用",
    icon: "auto_awesome",
    description: "精通 MJ、SD、FLUX、Nano Banana、即梦等生图模型部署与 API 调用，掌握 LoRA 训练与提示词工程。",
    tags: ["SDXL", "LoRA", "提示词工程", "N8N/扣子"]
  },
  {
    name: "AI 漫剧/视频全流程",
    icon: "movie_filter",
    description: "具备编剧创意、分镜设计、AI 美术设定、智能剪辑、AI 配音整合能力，实现端到端交付。",
    tags: ["编剧", "导演", "Vidu", "可灵"]
  },
  {
    name: "AI 设计工具矩阵",
    icon: "account_tree",
    description: "熟练运用 ComfyUI 及各大主流 AI 工具，适配商业视频、漫剧、品牌营销物料等多场景创作需求。",
    tags: ["ComfyUI", "Runway", "剪映 AI"]
  }
];

export const TRADITIONAL_SKILLS: Skill[] = [
  {
    name: "UI/UX & 数字化",
    icon: "desktop_windows",
    description: "政务系统、金融支付、健康医疗等行业数字化产品设计经验，精通全栈设计工具。",
    tags: ["UI/UX", "B端产品", "数据大屏"]
  },
  {
    name: "品牌视觉全案",
    icon: "brush",
    description: "品牌视觉（VIS/LOGO/包装）、空间导视与会展设计，具备手绘功底与商业摄影能力。",
    tags: ["品牌全案", "LOGO设计", "空间导视"]
  },
  {
    name: "管理与行业适配",
    icon: "strategy",
    description: "历任 UED 总监，懂商业逻辑与用户需求，具备跨领域、高含金量的项目操盘经验。",
    tags: ["团队管理", "商业逻辑", "项目全流程"]
  }
];

export const PROJECTS: Project[] = [
  {
    id: "1",
    title: "AI 视频作品示例",
    category: "AI 视频",
    description: "使用 Midjourney 和 Runway 制作的 AI 视频作品，展示未来城市概念。",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=800&fit=crop",
    tags: ["AI", "视频", "概念设计"],
    galleryImages: [],
    videoUrl: "https://www.bilibili.com/video/BV1xx411c7mD",
    videoPlatform: "bilibili"
  },
  {
    id: "2",
    title: "丰收证券 Foison Securities",
    category: "品牌设计",
    description: "全套品牌视觉识别系统设计，包括 LOGO 演绎、空间导视及办公应用。",
    imageUrl: "https://picsum.photos/seed/foison/1200/800",
    tags: ["VIS", "金融行业", "LOGO"]
  },
  {
    id: "3",
    title: "奥陶世卫星公司 Ordovician",
    category: "品牌设计",
    description: "沙特阿拉伯奥陶世卫星公司品牌形象设计，涵盖航天器涂装、办公系统等。",
    imageUrl: "https://picsum.photos/seed/ordo/1200/800",
    tags: ["航天科技", "品牌升级"]
  },
  {
    id: "4",
    title: "松果健康 Sungo Health",
    category: "UI/UX",
    description: "智能穿戴设备配对 APP 及 health 管理系统 UI 设计，结合硬件交互体验。",
    imageUrl: "https://picsum.photos/seed/sungo/1200/800",
    tags: ["智能硬件", "医疗健康"]
  },
  {
    id: "5",
    title: "同里红 Tongli Red",
    category: "包装设计",
    description: "同里红黄酒高端系列包装及 IP 形象设计，融入江南水乡文化元素。",
    imageUrl: "https://picsum.photos/seed/tongli/1200/800",
    tags: ["包装", "非遗文化", "IP"]
  },
  {
    id: "6",
    title: "智能化破产办案辅助平台",
    category: "UI/UX",
    description: "为法院系统打造的大型数字化协作平台，处理复杂法律逻辑与数据流。",
    imageUrl: "https://picsum.photos/seed/court/1200/800",
    tags: ["政务系统", "数字化协作"]
  },
  {
    id: "7",
    title: "爱丝柏兰图 Esperanto",
    category: "品牌设计",
    description: "滤泡式挂耳咖啡品牌全案设计，包括产品摄影、电商视觉及包装。",
    imageUrl: "https://picsum.photos/seed/coffee/1200/800",
    tags: ["快消品", "品牌全案"]
  }
];

// 教育经历
export const EDUCATION = [
  {
    school: "西班牙康普顿斯大学",
    major: "IT管理",
    degree: "硕士",
    period: "2020.03 - 2022.03"
  },
  {
    school: "中央美术学院",
    major: "平面设计",
    degree: "本科",
    period: "2005.03 - 2008.01"
  },
  {
    school: "中央美术学院",
    major: "视觉传达",
    degree: "大专",
    period: "2002.09 - 2004.07"
  },
  {
    school: "内蒙古商贸职业学院（原内蒙古工业美术设计学院）",
    major: "广告设计与策划",
    degree: "中专",
    period: "1999.09 - 2002.06"
  }
];

// 工作经历
export const EXPERIENCE: Experience[] = [
  {
    year: "2018.06-2022.05",
    role: "设计总监",
    company: "北京华宇信息技术有限公司",
    department: "研发中心用户体验部",
    level: "P6"
  },
  {
    year: "2017.02-2018.06",
    role: "设计总监",
    company: "东道品牌创意集团",
    department: "品牌创意实验室",
    level: ""
  },
  {
    year: "2015.08-2017.02",
    role: "设计总监",
    company: "亿赞普（中国）网络技术有限公司",
    department: "品牌战略部",
    level: ""
  },
  {
    year: "2010.02-2015.06",
    role: "联合创始人 / 美术指导",
    company: "北京众策文化传播有限公司",
    department: "项目部 / 设计部",
    level: ""
  },
  {
    year: "2006.6-2009.11",
    role: "资深设计师 / 空间展示系统经理",
    company: "北京知行堂品牌管理有限公司",
    department: "空间展示部",
    level: ""
  },
  {
    year: "2005.6-2006.05",
    role: "设计师",
    company: "北京主意堂广告策划机构",
    department: "设计部",
    level: ""
  }
];

export const CUSTOMER_LOGOS = [
  "安踏", "雀巢", "立白", "牛茶", "松果健康", "华宇信息", "东道", "亿赞普", "首发集团", "中国人民大学", "山东大学", "孔子学院", "国元证券", "金鹿公务机", "阿克苏诺贝尔"
];
