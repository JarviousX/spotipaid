import { describe, expect, it } from "vitest";
import {
  getActivityFeed,
  getAnalytics,
  getExplore,
  getProtocolStats,
  getTopArtists,
  getTopTokens,
  searchAll,
} from "@/services/catalog";

describe("catalog service smoke", () => {
  it("returns protocol stats with isDemo", async () => {
    const stats = await getProtocolStats();
    expect(stats.isDemo).toBe(true);
    expect(stats.totalFeesCollected).toMatch(/^\d/);
    expect(stats.activeTokens).toBeGreaterThan(0);
  });

  it("returns top tokens sorted with formats", async () => {
    const tokens = await getTopTokens(5);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]?.isDemo).toBe(true);
    expect(tokens[0]?.symbol).toBeTruthy();
    expect(tokens[0]?.priceFormatted).toMatch(/^\$/);
  });

  it("returns top artists", async () => {
    const artists = await getTopArtists(3);
    expect(artists.length).toBe(3);
    expect(artists[0]?.balanceFormatted).toMatch(/^\$/);
  });

  it("returns activity feed", async () => {
    const feed = await getActivityFeed(5);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0]?.isDemo).toBe(true);
  });

  it("searches demo catalog", async () => {
    const result = await searchAll("nova");
    expect(
      result.artists.length + result.tokens.length + result.music.length,
    ).toBeGreaterThan(0);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("explores trending view", async () => {
    const data = await getExplore("trending", { limit: 5 });
    expect(data.view).toBe("trending");
    expect(data.tokens.length).toBeGreaterThan(0);
  });

  it("builds analytics series labeled as on-chain activity", async () => {
    const analytics = await getAnalytics("7d");
    expect(analytics.label.toLowerCase()).toContain("on-chain");
    expect(analytics.label.toLowerCase()).not.toContain("listen");
    expect(Array.isArray(analytics.series)).toBe(true);
  });
});
