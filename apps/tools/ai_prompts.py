import json
from apps.exts import db
from apps.models.model import Config

# 默认提示词定义表（按任务项清晰分类）
DEFAULT_PROMPTS = {
    'prompt_taxonomy': (
        "你是一个专业的中文技术博客编辑助手。请阅读用户提供的文章标题和内容正文，为该文章推荐最匹配的【1个分类】和【2~5个标签】。\n"
        "现有候选分类库: {category_list}\n"
        "现有候选标签库: {tag_list}\n"
        "规则：\n"
        "1. 分类务必精准聚焦（必须返回 1 个字符串，优先匹配已有分类库，如不符合可建议 1 个新的通用分类名，避免重复创建微调词）；\n"
        "2. 标签返回 2~5 个数组，尽量包含核心技术栈、语言、中间件或架构主题词；\n"
        "3. 必须输出合法 JSON，结构如下：\n"
        "{\"category\": \"分类名称\", \"tags\": [\"标签1\", \"标签2\"]}"
    ),
    'prompt_summary': (
        "你是一个资深技术专栏总编辑。请阅读用户的技术文章，提炼出一段精炼专业的文章内容摘要 (Summary)。\n"
        "要求：\n"
        "1. 摘要长度严格控制在 80~200 字以内（绝对不能超过 200 字），通顺连贯，直接阐述技术背景、核心实践方案及结论；\n"
        "2. 语言简练，禁止“本文主要讲述了”、“作者在文中介绍了”等废话陈述；\n"
        "3. 直接输出提炼好的纯文本段落，禁止包裹任何 Markdown 标记或多余引号。"
    ),
    'prompt_proofread': (
        "你是一名严谨的文字编辑和技术图书校对专家。请校对用户提供的 Markdown 技术文本。\n"
        "任务：\n"
        "1. 检查并修正错别字、病句、主谓不通顺语句、重复冗余词；\n"
        "2. 规范中英文混排空格（遵循“中文与英文/数字之间保持一个空格”的排版规范）；\n"
        "3. 保持原有的 Markdown 标题、代码块、列表等结构完整不变；\n"
        "4. 输出 JSON 格式：\n"
        "{\n"
        "  \"revised_content\": \"修正并润色后的完整 Markdown 文本\",\n"
        "  \"suggestions\": [\"修改点1：修正某某错别字\", \"修改点2：调整某句病句使其通顺\"]\n"
        "}"
    ),
    'prompt_expand': (
        "你是一名资深架构师和技术专家。请阅读用户的文章大纲或内容，根据指定的扩写要求进行深度展开与细节丰富。\n"
        "要求：\n"
        "1. 保持专业严谨的技术水准，补充具体的实战代码、排查步骤、底层原理或踩坑避坑经验；\n"
        "2. 结构清晰，逻辑连贯，严格使用规范的 Markdown 排版格式；\n"
        "3. 直接输出扩写并丰富后的正文 Markdown。"
    )
}

# 提示词元数据（前端配置界面呈现）
PROMPT_METADATA = [
    {
        'key': 'prompt_taxonomy',
        'category': '分类与标签提取',
        'title': '文章分类与标签提取 Prompt',
        'desc': '用于自动分析文章核心主题并给出唯一分类推荐与 2~5 个关键技术标签（支持 {category_list} 与 {tag_list} 占位符）。',
    },
    {
        'key': 'prompt_summary',
        'category': '文章内容摘要',
        'title': '精炼文章摘要提炼 Prompt',
        'desc': '用于将技术文章提炼为 200 字以内的精炼概览，在前台列表卡片及文章头部展现。',
    },
    {
        'key': 'prompt_proofread',
        'category': '智能校对润色',
        'title': '病句错字校对与排版润色 Prompt',
        'desc': '用于检查错别字、语病不通顺并规范中英文空格混排，输出修改建议与修正后 Markdown。',
    },
    {
        'key': 'prompt_expand',
        'category': '文章深度扩写',
        'title': '内容补充与实战案例扩写 Prompt',
        'desc': '用于结合企业生产实战，对文章小节、大纲或难点进行深度展开与代码示例补充。',
    },
]


def get_prompt_template(key: str) -> str:
    """获取指定任务项的 Prompt，优先从数据库 config 表获取自定义配置，无则返回默认内置 Prompt。"""
    try:
        cfg = Config.query.filter(Config.name == key).first()
        if cfg and cfg.value and cfg.value.strip():
            return cfg.value.strip()
    except Exception:
        pass
    return DEFAULT_PROMPTS.get(key, '')


def get_all_prompts_info() -> list:
    """获取所有任务项提示词的当前配置与默认值信息，供管理界面查看与修改。"""
    results = []
    # 批量查询已保存的自定义配置
    saved_map = {}
    try:
        saved_cfgs = Config.query.filter(Config.name.like('prompt_%')).all()
        saved_map = {c.name: c.value for c in saved_cfgs}
    except Exception:
        pass

    for meta in PROMPT_METADATA:
        key = meta['key']
        default_val = DEFAULT_PROMPTS.get(key, '')
        current_val = saved_map.get(key) or default_val
        is_customized = key in saved_map and saved_map[key] != default_val
        results.append({
            **meta,
            'default_prompt': default_val,
            'current_prompt': current_val,
            'is_customized': is_customized,
        })
    return results


def save_prompt_template(key: str, value: str) -> bool:
    """保存或恢复某个任务项的提示词配置。若传空字符串或等于默认值则视为恢复默认。"""
    if key not in DEFAULT_PROMPTS:
        return False

    cfg = Config.query.filter(Config.name == key).first()
    default_val = DEFAULT_PROMPTS[key]

    if not value or value.strip() == default_val.strip():
        # 恢复默认
        if cfg:
            db.session.delete(cfg)
            db.session.commit()
    else:
        if cfg:
            cfg.value = value.strip()
        else:
            cfg = Config(name=key, value=value.strip())
            db.session.add(cfg)
        db.session.commit()
    return True
