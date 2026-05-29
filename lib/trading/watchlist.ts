export type AssetGroup = "indices";

export interface TickerDef {
  symbol: string;
  displayName: string;
  displayNameEn?: string;
  group: AssetGroup;
}

export function getDisplayName(t: TickerDef, locale: "zh" | "en"): string {
  return locale === "en" ? (t.displayNameEn ?? t.displayName) : t.displayName;
}

const ASSET_GROUP_LABELS_ZH: Record<AssetGroup, string> = {
  indices: "指数 / 黄金",
};

const ASSET_GROUP_LABELS_EN: Record<AssetGroup, string> = {
  indices: "Indices / Gold",
};

export function getAssetGroupLabels(
  locale: "zh" | "en",
): Record<AssetGroup, string> {
  return locale === "en" ? ASSET_GROUP_LABELS_EN : ASSET_GROUP_LABELS_ZH;
}

export const ASSET_GROUP_ORDER: AssetGroup[] = ["indices"];

export const WATCHLIST: TickerDef[] = [
  { symbol: "^GSPC", displayName: "S&P 500", group: "indices" },
  { symbol: "^IXIC", displayName: "Nasdaq", group: "indices" },
  { symbol: "^DJI", displayName: "Dow Jones", group: "indices" },
  { symbol: "000001.SS", displayName: "上证指数", displayNameEn: "Shanghai Composite", group: "indices" },
  { symbol: "^HSI", displayName: "恒生指数", displayNameEn: "Hang Seng", group: "indices" },
  { symbol: "GC=F", displayName: "黄金期货", displayNameEn: "Gold Futures", group: "indices" },
];
