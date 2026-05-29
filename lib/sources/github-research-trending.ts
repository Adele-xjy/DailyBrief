import * as cheerio from "cheerio";
import type { RawArticle } from "./types";

/**
 * GitHub Research Trending — scrapes trending repos across research-relevant
 * programming languages, filters by keywords, and merges into a ranked list.
 *
 * Languages scraped: Python, Jupyter Notebook, R, TeX, Julia, Markdown
 * Keywords filter repos related to: research, academic, paper, thesis,
 * visualization, plotting, latex, writing, citation, lab, experiment, etc.
 */

const RESEARCH_LANGS = ["python", "jupyter-notebook", "r", "tex", "julia", "markdown"];

const RESEARCH_KEYWORDS = [
  "research", "academic", "paper", "thesis", "dissertation",
  "visualization", "visualisation", "plotting", "plot", "chart", "figure",
  "latex", "writing", "citation", "bibliography", "zotero", "reference",
  "jupyter", "notebook", "colab",
  "lab", "experiment", "simulation", "scientific", "science",
  "data-science", "data analysis", "statistics", "statistical",
  "literate programming", "reproducible", "workflow",
  "bioinformatics", "chemistry", "physics", "biology", "genomics",
  "machine learning", "deep learning", "neural network",
  "notebook", "matplotlib", "ggplot", "plotly",
  "pandoc", "markdown", "quarto",
  "computational", "numerical", "modeling",
];

function isResearchRepo(title: string, description: string): boolean {
  const text = (title + " " + description).toLowerCase();
  return RESEARCH_KEYWORDS.some((kw) => text.includes(kw));
}

async function scrapeTrendingPage(lang: string, url: string): Promise<RawArticle[]> {
  const html = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  }).then((r) => r.text());

  const $ = cheerio.load(html);
  const items: RawArticle[] = [];

  $("article.Box-row").each((_i, el) => {
    const a = $(el).find("h2 a").first();
    const repo = (a.attr("href") ?? "").trim().replace(/^\//, "");
    if (!repo) return;

    const description = $(el).find("p").first().text().replace(/\s+/g, " ").trim();

    if (!isResearchRepo(repo, description)) return;

    const f6 = $(el).find(".f6").first();
    const language = f6.find("[itemprop=programmingLanguage]").text().trim() || lang;
    const totalStars = f6
      .find("a")
      .filter((_, n) => ($(n).attr("href") ?? "").endsWith("/stargazers"))
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const forks = f6
      .find("a")
      .filter((_, n) => ($(n).attr("href") ?? "").endsWith("/forks"))
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const starsToday = f6
      .find("span")
      .filter((_, n) => /stars?\s+today/.test($(n).text()))
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const metaParts: string[] = [];
    if (language) metaParts.push(language);
    if (totalStars) metaParts.push(`★ ${totalStars}`);
    if (forks) metaParts.push(`⑂ ${forks}`);
    if (starsToday) metaParts.push(`📈 ${starsToday}`);
    const meta = metaParts.join(" · ");

    items.push({
      sourceId: "github-research-trending",
      title: repo,
      url: `https://github.com/${repo}`,
      excerpt: description.slice(0, 300),
      meta,
      category: "tech",
    });
  });

  return items;
}

export async function fetchGithubResearchTrending(
  sourceId: string,
  limit = 25,
): Promise<RawArticle[]> {
  const seen = new Set<string>();
  const all: RawArticle[] = [];

  for (const lang of RESEARCH_LANGS) {
    try {
      const url = `https://github.com/trending/${lang}?since=weekly`;
      const items = await scrapeTrendingPage(lang, url);
      for (const item of items) {
        if (!seen.has(item.url)) {
          seen.add(item.url);
          all.push(item);
        }
      }
    } catch {
      // individual lang pages may fail — keep going
    }
  }

  // Sort by putting repos with "stars today" first (more trending), then by name
  all.sort((a, b) => {
    const aHot = (a.meta ?? "").includes("📈") ? 1 : 0;
    const bHot = (b.meta ?? "").includes("📈") ? 1 : 0;
    return bHot - aHot;
  });

  return all.slice(0, limit);
}