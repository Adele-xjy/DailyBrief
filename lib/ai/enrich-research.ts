import { runLlm } from "./llm";
import type { ArticleInput } from "./pipeline";

const FIELD_TAGS = [
  { tag: "化学", words: ["chemistry", "chemical", "synthesis", "catalyst", "molecule", "molecular", "organic", "inorganic", "polymer", "electrochem", "ligand", "coordination"] },
  { tag: "材料", words: ["material", "graphene", "perovskite", "2d", "thin film", "nanomaterial", "nanoparticle", "composite", "alloy", "coating", "crystal", "mof", "covalent organic"] },
  { tag: "物理", words: ["physics", "quantum", "photon", "optics", "laser", "spintronic", "superconduct", "magnetism", "semiconductor", "electron", "phonon", "topological", "condensed matter"] },
  { tag: "生物", words: ["biology", "cell", "protein", "gene", "genome", "dna", "rna", "crispr", "microbiome", "neuron", "brain", "immun", "virus", "bacteria", "receptor", "signaling", "transcription"] },
  { tag: "医学", words: ["cancer", "tumor", "clinical", "patient", "therapy", "drug", "vaccine", "disease", "diagnosis", "biomarker", "surgery", "pharma", "trial", "metabolism"] },
  { tag: "AI/计算", words: ["machine learning", "deep learning", "neural network", "artificial intelligence", "computational", "simulation", "algorithm", "modeling", "dft", "molecular dynamics", "bayesian", "optimization"] },
  { tag: "地球/环境", words: ["climate", "earth", "ocean", "atmospheric", "geological", "environment", "carbon", "emission", "sustainability", "ecosystem", "biodiversity", "palaeo", "tectonic"] },
  { tag: "能源", words: ["battery", "solar cell", "fuel cell", "energy", "photovoltaic", "hydrogen", "electrocatalysis", "storage", "lithium", "supercapacitor", "thermoelectric"] },
  { tag: "天文", words: ["astronomy", "astrophysics", "cosmology", "galaxy", "planet", "star", "telescope", "exoplanet", "black hole", "dark matter", "gravitational"] },
  { tag: "交叉", words: [] },
];

function classify(text: string): string {
  text = text.toLowerCase();
  let best = "交叉", bestScore = 0;
  for (const ft of FIELD_TAGS) {
    let score = 0;
    for (const w of ft.words) { if (text.includes(w)) score++; }
    if (score > bestScore) { bestScore = score; best = ft.tag; }
  }
  return best;
}

const SYS = "你是一个科研论文摘要专家。请为以下英文论文生成简短中文摘要（50-80字），让中文读者能快速理解论文的研究内容和意义。用通俗语言，避免过多术语。只输出中文摘要，不要加任何前缀或标记。";

export async function enrichResearchPapers(articles: ArticleInput[]): Promise<void> {
  for (const a of articles) {
    a.meta = classify(a.title + " " + (a.excerpt || ""));
  }

  const SIZE = 5;
  for (let i = 0; i < articles.length; i += SIZE) {
    const batch = articles.slice(i, i + SIZE);
    const prompt = batch.map((a, j) => "Paper " + (j+1) + ": " + a.title + "\n" + (a.excerpt || "").slice(0, 300)).join("\n\n");
    try {
      const result = await runLlm({
        systemPrompt: SYS,
        userPrompt: "请为以下" + batch.length + "篇论文分别生成中文摘要，格式：\n1. 摘要\n2. 摘要\n...\n\n" + prompt,
        timeoutMs: 60000,
      });
      const sums = result.text.split(/\n\d+\.\s*/).map(s => s.trim()).filter(s => s.length > 10);
      for (let j = 0; j < batch.length && j < sums.length; j++) {
        batch[j].summary = "[" + (batch[j].meta || "交叉") + "] " + sums[j];
      }
    } catch (e) {
      for (const a of batch) {
        if (!a.summary) a.summary = "[" + (a.meta || "交叉") + "] (摘要生成失败)";
      }
    }
  }
}
