const { React: R, ReactDOM, icons } = window.AITrackerRuntime;
const h = R.createElement;
const { useState, useEffect } = R;
const periods = { daily: "日报", weekly: "周报", monthly: "月报" };
const sections = {
  brief: { name: "科技资讯", icon: "layers", description: "模型发布、独立测评、科技产业与投资人观点。", key: "technology" },
  macro: { name: "市场行情", icon: "chart", description: "全球宏观、战争与政治，以及股市资金面。", key: "markets" },
  research: { name: "调研纪要", icon: "file", description: "日报仅整理 Cubox 内 AceCamp 纪要：先看全部动态，再按需展开文章精读。", key: "research" }
};
const marketCategories = ["宏观点评", "市场资金面"];
const techCategories = ["模型发布", "核心团队", "投资人观点", "独立测评", "产业链新闻", "播客精华"];
function group(item) {
  if (item.category === "调研纪要" || (item.tags || []).includes("调研纪要")) return "research";
  if (marketCategories.includes(item.category) || (item.tags || []).some(t => marketCategories.includes(t))) return "macro";
  return "brief";
}
function icon(name, size = 18) { return icons[name] ? h(icons[name], { size, "aria-hidden": true }) : null; }
function link(url) { try { const u = new URL(url, location.href); return ["http:", "https:"].includes(u.protocol) ? u.href : undefined; } catch { return undefined; } }
function renderRichText(value) {
  const text = String(value || "");
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => /^https?:\/\//.test(part) ? h("a", { key: index, href: link(part), target: "_blank", rel: "noreferrer" }, part, " ↗") : part);
}
function isResearchOverview(item) {
  return /overview|collection/i.test(item.id || "") || (item.tags || []).some(tag => /收藏概览|全部动态/.test(tag));
}
function archiveSummary(issue) {
  const value = issue?.archiveSummary || issue?.sectionOverviews?.technology?.summary || issue?.takeaways?.[0] || issue?.intro || "";
  const clean = String(value).replace(/\s+/g, " ").trim();
  if (!clean) return "本期精要待读取";
  const sentence = clean.split(/(?<=[。！？；])/)[0] || clean;
  return sentence.length > 92 ? sentence.slice(0, 90) + "…" : sentence;
}
function isoWeekKey(value) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((d - start) / 86400000) + 1) / 7);
  return `${year}-W${week}`;
}
function Audit({ checks = [], expanded = false }) {
  return checks.length ? h("details", { className: "source-audit", open: expanded },
    h("summary", null, "本期来源核验记录", h("span", null, `${checks.length} 项 · 查看已查与缺口`)),
    h("div", { className: "audit-grid" }, checks.map((c, n) => h("div", { className: "audit-row", key: n },
      h("div", null, h("a", { href: link(c.url), target: "_blank", rel: "noreferrer" }, c.name, " ↗"),
        h("b", { className: /受限|未完成|待/.test(c.status || "") ? "audit-limited" : "" }, c.status)), h("p", null, c.note))))) : null;
}
function ResearchDetails({ item }) {
  const data = item.research || {};
  const blocks = data.topics || item.detailSections || [];
  return h(R.Fragment, null,
    (data.meetingDate || data.savedAt || data.sample) && h("dl", { className: "research-meta" },
      [["纪要日期", data.meetingDate], ["收藏时间", data.savedAt], ["统计／访谈范围", data.sample]].filter(x => x[1]).map(([name, value]) => h("div", { key: name }, h("dt", null, name), h("dd", null, value)))),
    blocks.length > 0 && h("div", { className: "research-detail" }, blocks.map((block, n) => h("section", { key: n },
      h("h4", null, block.heading || block.title),
      block.text && h("p", null, block.text),
      block.bullets?.length ? h("ul", null, block.bullets.map((b, j) => h("li", { key: j }, renderRichText(b)))) : null))));
}
function PodcastDetails({ item }) {
  const data = item.podcast || {};
  const blocks = data.topics || item.detailSections || [];
  if (!blocks.length) return null;
  const meta = [["嘉宾", data.guests || data.guest], ["节目时长", data.duration], ["录制／首发", data.recordedAt || data.publishedAt]].filter(x => x[1]);
  return h("details", { className: "podcast-detail" },
    h("summary", null, `展开详细要点 · ${blocks.length} 组`, h("span", null, "点击展开")),
    meta.length ? h("dl", { className: "research-meta" }, meta.map(([name, value]) => h("div", { key: name }, h("dt", null, name), h("dd", null, value)))) : null,
    h("div", { className: "research-detail" }, blocks.map((block, n) => h("section", { key: n },
      h("h4", null, block.heading || block.title),
      block.text && h("p", null, block.text),
      block.bullets?.length ? h("ul", null, block.bullets.map((b, j) => h("li", { key: j }, renderRichText(b)))) : null))));
}
function Card({ item, number, saved, onSave }) {
  return h("article", { className: `news-card ${group(item) === "research" ? "research-card" : ""}`, id: item.id },
    h("div", { className: "card-meta" }, h("span", { className: `avatar small a${number % 6}` }, (item.source || "原文").slice(0, 2)),
      h("b", null, item.source), h("span", { className: "meta-dot" }, "·"), h("time", null, item.publishedAt), h("span", { className: "category" }, item.category),
      h("button", { className: `bookmark ${saved ? "bookmarked" : ""}`, onClick: onSave, "aria-label": saved ? "取消收藏" : "收藏" }, icon("bookmark"))),
    h("a", { className: "card-title", href: link(item.url), target: "_blank", rel: "noreferrer" }, h("h3", null, item.title), icon("arrow", 19)),
    h("p", { className: "summary" }, item.summary),
    group(item) === "research" && h(ResearchDetails, { item }),
    (item.category === "播客精华" || (item.tags || []).includes("播客")) && h(PodcastDetails, { item }),
    item.compare?.length > 0 && h("div", { className: "comparison" }, h("div", { className: "chart-heading" }, "同一测评口径对比"), item.compare.map((c, n) => h("div", { className: "bar-row", key: n }, h("span", null, c.label), h("div", null, h("i", { style: { width: `${Math.min(100, c.value / Math.max(...item.compare.map(x => x.value), 1) * 100)}%` } })), h("b", null, c.value, " ", c.unit)))),
    item.why && h("div", { className: "why" }, h("span", null, "关注点"), h("p", null, item.why)),
    item.relatedSources?.length > 0 && h("details", { className: "related-sources" }, h("summary", null, `相关原文与证据 · ${item.relatedSources.length} 个来源`),
      item.relatedSources.map((s, n) => h("a", { key: n, href: link(s.url), target: "_blank", rel: "noreferrer" }, h("span", null, s.title, h("small", null, s.date, " · ", s.evidence)), icon("arrow", 15)))),
    h("div", { className: "card-footer" }, h("div", null, h("span", { className: "evidence" }, item.evidence), (item.tags || []).map((t, n) => h("span", { className: "tag", key: n }, "#", t))),
      h("a", { href: link(item.url), target: "_blank", rel: "noreferrer" }, "阅读原文 ", icon("external", 13))));
}
export default function TrackerApp() {
  const params = new URLSearchParams(location.search);
  const [period, setPeriod] = useState(periods[params.get("period")] ? params.get("period") : "daily");
  const [section, setSection] = useState(sections[location.hash.slice(1)] ? location.hash.slice(1) : "brief");
  const [date, setDate] = useState(params.get("date") || "");
  const [issue, setIssue] = useState(null);
  const [archive, setArchive] = useState([]);
  const [archiveMeta, setArchiveMeta] = useState({});
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部动态");
  const [menu, setMenu] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem("ai-saved") || "[]"); } catch { return []; } });
  useEffect(() => { fetch("./data/config.json", { cache: "no-store" }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(setConfig).catch(() => {}); }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    const base = period === "daily" ? "./data/" : `./data/${period}/`;
    setLoading(true); setError(""); setIssue(null); setArchive([]);
    (async () => {
      try {
        const response = await fetch(`${base}index.json`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw Error("期刊索引读取失败，请稍后刷新。");
        const index = await response.json(); setArchive(index.archive || []);
        const selected = date || index.latest;
        if (!selected) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(selected)) throw Error("期刊日期格式错误。");
        const report = await fetch(`${base}${selected}.json`, { cache: "no-store", signal: controller.signal });
        if (!report.ok) throw Error("本期期刊读取失败，请稍后刷新。");
        const data = await report.json();
        if (!Array.isArray(data.items)) throw Error("本期内容格式不完整。");
        setIssue(data);
      } catch (e) { if (e.name !== "AbortError") setError(e.message || "读取失败，请刷新重试。"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [period, date, refresh]);
  useEffect(() => {
    if (section !== "archive" || !archive.length) return;
    const controller = new AbortController();
    const base = period === "daily" ? "./data/" : `./data/${period}/`;
    Promise.all(archive.map(async entry => {
      try {
        const response = await fetch(`${base}${entry.date}.json`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return [entry.date, entry.title || "本期精要待读取"];
        const data = await response.json();
        return [entry.date, archiveSummary(data)];
      } catch { return [entry.date, entry.title || "本期精要待读取"]; }
    })).then(rows => { if (!controller.signal.aborted) setArchiveMeta(Object.fromEntries(rows)); });
    return () => controller.abort();
  }, [section, period, archive, refresh]);
  function navigate(next) { setSection(next); setMenu(false); setFilter("全部动态"); setQuery(""); }
  function changePeriod(next) { setPeriod(next); setDate(""); setFilter("全部动态"); setQuery(""); }
  useEffect(() => {
    const q = new URLSearchParams(); if (period !== "daily") q.set("period", period); if (date) q.set("date", date);
    history.replaceState(null, "", location.pathname + (q.size ? `?${q}` : "") + (section !== "brief" ? `#${section}` : ""));
  }, [period, section, date]);
  const all = issue?.items || [];
  const bySection = Object.fromEntries(Object.keys(sections).map(key => [key, all.filter(item => group(item) === key)]));
  const active = sections[section] ? section : "brief";
  const meta = sections[active];
  const edition = periods[period];
  const stamp = issue?.periodStart && issue?.periodEnd ? `${issue.periodStart.slice(0,10).replaceAll("-", ".")} — ${issue.periodEnd.slice(0,10).replaceAll("-", ".")}` : issue?.date?.replaceAll("-", ".") || "等待首期";
  const overview = issue?.sectionOverviews?.[meta.key] || issue?.sectionOverviews?.[meta.name];
  const overviewText = typeof overview === "string" ? overview : overview?.summary;
  const overviewPoints = typeof overview === "object" && overview?.points?.length ? overview.points : bySection[active].slice(0, 3).map(x => x.title);
  const keyOf = item => period === "daily" ? `${issue?.date}:${item.id}` : `${period}:${issue?.date}:${item.id}`;
  function toggleSave(item) { const key = keyOf(item); setSaved(old => { const updated = old.includes(key) ? old.filter(x => x !== key) : [...old, key]; try { localStorage.setItem("ai-saved", JSON.stringify(updated)); } catch {} return updated; }); }
  const categories = section === "macro" ? marketCategories : section === "research" ? ["文章精读"] : section === "saved" ? [...techCategories, ...marketCategories, "调研纪要"] : techCategories;
  const candidates = section === "saved" ? all.filter(item => saved.includes(keyOf(item))) : bySection[active];
  const hasResearchOverview = section === "research" && candidates.some(isResearchOverview);
  const items = candidates.filter(item => {
    const matchesFilter = section === "research"
      ? (filter === "文章精读" ? !isResearchOverview(item) : filter === "全部动态" && hasResearchOverview ? isResearchOverview(item) : filter === "全部动态")
      : (filter === "全部动态" || item.category === filter || (item.tags || []).includes(filter));
    return matchesFilter && (!query || [item.title, item.summary, item.source, ...(item.tags || [])].join(" ").toLowerCase().includes(query.toLowerCase()));
  });
  const researchStatus = config?.researchCollection?.statusText || "纪要来源尚未连接，暂未采集。";
  const schedule = period === "daily" ? "每日 08:30" : period === "weekly" ? "每周日 18:00" : "每月最后一天 18:00";
  const reportState = period === "daily" ? "每日更新" : config?.reportPlans?.[period]?.status === "active" ? "定期更新" : "入口已准备 · 任务待接入";
  return h("div", { className: "shell" },
    h("aside", { className: `sidebar ${menu ? "open" : ""}` },
      h("a", { className: "brand", href: "./", "aria-label": "AI Tracker首页" }, h("span", { className: "brand-icon" }, icon("sun", 23)), h("div", null, h("b", null, "AI Tracker", h("span", { className: "brand-dot" }, ".")), h("small", null, "TECH · MARKETS · RESEARCH"))),
      h("button", { className: "mobile-close", onClick: () => setMenu(false), "aria-label": "关闭菜单" }, icon("close")),
      h("div", { className: "edition" }, "YOUR RESEARCH SIGNAL"),
      h("nav", null,
        ...Object.entries(sections).map(([key, value]) => h("button", { className: `nav-item ${section === key ? "active" : ""}`, key, onClick: () => navigate(key) }, icon(value.icon), value.name, h("span", { className: "nav-count" }, bySection[key].length))),
        ...[["sources", "users", "关注名单"], ["saved", "bookmark", "本期收藏"], ["archive", "archive", "历史期刊"]].map(([key, glyph, name]) => h("button", { className: `nav-item ${section === key ? "active" : ""}`, key, onClick: () => navigate(key) }, icon(glyph), name))),
      h("div", { className: "sidebar-note" }, h("div", null, icon("radio", 15), " 更新状态"), h("p", null, reportState), h("small", null, `北京时间 · ${schedule}`)),
      h("div", { className: "profile" }, h("span", null, "AY"), h("div", null, h("b", null, "AI Tracker"), h("small", null, "公开阅读 · 来源可追溯")), icon("check", 15))),
    h("div", { className: "main-wrap" },
      h("header", null, h("div", null, h("button", { className: "menu-button", onClick: () => setMenu(true), "aria-label": "打开菜单" }, icon("menu", 20)), h("span", null, "AI Tracker"), icon("chevron", 14), h("b", null, sections[section]?.name || { sources: "关注名单", saved: "本期收藏", archive: "历史期刊" }[section])),
        h("div", { className: "header-right" }, h("span", { className: "private" }, h("span"), "公开阅读"), h("button", { className: "refresh", onClick: () => setRefresh(x => x + 1), "aria-label": "刷新期刊" }, icon("refresh", 16)))),
      h("main", null,
        h("div", { className: "period-selector", role: "group", "aria-label": "期刊类型" }, Object.entries(periods).map(([key, name]) => h("button", { key, className: period === key ? "active" : "", onClick: () => changePeriod(key), "aria-pressed": period === key }, name)), h("span", null, `北京时间 · ${schedule}`)),
        h("div", { className: "eyebrow" }, `AI TRACKER / ${edition === "日报" ? "DAILY" : edition === "周报" ? "WEEKLY" : "MONTHLY"}`, h("span", null, "／"), stamp),
        h("div", { className: "title-row" }, h("div", null, h("h1", null, sections[section]?.name || { sources: "关注值得听见的声音", saved: "留下值得再读的观点", archive: "每一期，都有迹可循" }[section], h("span", { className: "sun-mark" }, "✳")),
          h("p", { className: "subtitle" }, sections[section]?.description || (section === "archive" ? "日报、周报、月报分别归档，保留判断变化。" : section === "saved" ? "收藏保存在当前浏览器；切换期刊可查看该期收藏。" : "原始资料、独立核验与采集缺口。"))),
          h("div", { className: "date-tile" }, h("span", null, edition), h("b", null, stamp), h("small", null, issue?.updatedAt ? "本期已入库 · 核验状态见各条" : "尚未发布首期"))),
        error && h("div", { className: "warning", role: "alert" }, error),
        section === "sources" ? h(R.Fragment, null,
          h(Audit, { checks: issue?.sourceChecks, expanded: true }), h("div", { className: "section-title" }, h("h2", null, "核心信息源"), h("span", null, `${(config?.sources || []).length} 组来源`)),
          h("div", { className: "source-grid" }, (config?.sources || []).map((s, n) => h("section", { className: "source-card", key: s.name }, h("span", { className: `avatar a${n % 6}` }, s.name.slice(0, 2)), h("div", { className: "source-heading" }, h("h3", null, s.name), h("span", null, s.type)), h("p", null, s.focus), h("div", { className: "people" }, (s.people || []).map(p => h("span", { key: p }, p))), h("div", { className: "source-links" }, (s.links || [{ name: "访问来源", url: s.url }]).map((l, j) => h("a", { key: j, href: link(l.url), target: "_blank", rel: "noreferrer" }, l.name, icon("arrow", 12)))))))) :
        section === "archive" ? h(R.Fragment, null, h("div", { className: "section-title" }, h("h2", null, `已归档${edition}`), h("span", null, `${archive.length} 期`)),
          archive.length ? (period === "daily" ? Object.entries(archive.reduce((groups, entry) => {
            const key = isoWeekKey(entry.date); (groups[key] ||= []).push(entry); return groups;
          }, {})).map(([week, entries], index) => h("details", { className: "archive-week", key: week, open: index === 0 },
            h("summary", null, h("b", null, week), h("span", null, `${entries.length} 期`)),
            h("div", { className: "archive-week-items" }, entries.map(a => h("button", { className: "archive-row", key: a.date, onClick: () => { setDate(a.date); navigate("brief"); } }, icon("file", 20), h("div", null, h("b", null, `${a.date} · ${archiveMeta[a.date] || a.title || "本期精要待读取"}`), h("small", null, "点击阅读本期内容与来源核验")), icon("arrow", 20)))))) :
            archive.map(a => h("button", { className: "archive-row", key: a.date, onClick: () => { setDate(a.date); navigate("brief"); } }, icon("file", 20), h("div", null, h("b", null, `${a.date} · ${archiveMeta[a.date] || a.title || "本期精要待读取"}`), h("small", null, "点击阅读本期内容与来源核验")), icon("arrow", 20)))) : h("div", { className: "empty" }, loading ? "正在读取历史…" : `首期${edition}尚未发布。`)) :
        h(R.Fragment, null,
          section !== "saved" && h(R.Fragment, null,
            h("div", { className: "primary-sections", role: "group", "aria-label": "阅读栏目" }, Object.entries(sections).map(([key, value]) => h("button", { key, className: section === key ? "active" : "", onClick: () => navigate(key) }, icon(value.icon, 17), value.name, h("span", null, bySection[key].length)))),
            h("section", { className: "digest" }, h("div", { className: "digest-label" }, h("span", { className: "signal-icon" }, "✦"), ` ${meta.name} · ${period === "daily" ? "本期导读" : `${edition}概览`}`, h("span", { className: "issue-tag" }, stamp)),
              h("h2", null, overviewText || (issue ? meta.description : loading ? "正在读取…" : `首期${edition}尚未发布`)),
              h("div", { className: "digest-points" }, overviewPoints.length ? overviewPoints.map((text, n) => h("div", { key: n }, h("span", null, String(n + 1).padStart(2, "0")), h("p", null, text))) : h("p", null, section === "research" ? researchStatus : issue ? "本期暂无该栏目内容。" : "已保留阅读入口，发布后会显示各栏概览与重点内容。")),
              h("div", { className: "digest-footer" }, icon("check", 14), " 保留原始出处 · 区分事实、受访者观点与编辑判断"))),
          section === "research" && !items.length && h("div", { className: "collection-status" }, h("b", null, "纪要采集状态"), h("p", null, researchStatus), h("small", null, period === "daily" ? "日报范围：北京时间前一天收藏的 AceCamp 纪要。" : "周报/月报：汇总期内纪要，久谦周度更新纳入周报并在月报合并去重。")),
          h("div", { className: "feed-top" }, h("h2", null, section === "saved" ? "本期已收藏" : meta.name, h("small", null, `${items.length} 条`)), h("label", { className: "search" }, icon("search", 16), h("input", { value: query, onChange: e => setQuery(e.target.value), placeholder: "搜索公司、人物、关键词…", "aria-label": "搜索本期内容" }))),
          h("div", { className: "filter-tabs" }, ["全部动态", ...categories].map(c => h("button", { key: c, className: filter === c ? "selected" : "", onClick: () => setFilter(c) }, c))),
          issue?.coverage && h("details", { className: "coverage coverage-detail" }, h("summary", null, "阅读范围与采集说明"), h("p", null, issue.coverage)),
          h(Audit, { checks: section === "research" ? (issue?.sourceChecks || []).filter(c => /Cubox|AceCamp|久谦|飞书/i.test(c.name)) : issue?.sourceChecks }),
          h("div", { className: "feed" }, items.map((item, n) => h(Card, { item, number: n, key: item.id, saved: saved.includes(keyOf(item)), onSave: () => toggleSave(item) })), !items.length && h("div", { className: "empty" }, loading ? "正在读取期刊…" : query || filter !== "全部动态" ? "没有符合筛选条件的内容。" : section === "saved" ? "点击卡片右上角的书签，收藏本期内容。" : section === "research" ? "暂无已读取并核验的纪要。" : issue ? "本期暂无该栏目内容。" : `暂无已发布${edition}内容。`))),
        h("footer", null, h("span", null, "AI Tracker", h("span", { className: "brand-dot" }, "."), h("small", null, "少一点噪声，多一点判断。")), h("small", null, "摘要请结合原文阅读 · 采集缺口如实记录")))));
}
