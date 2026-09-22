"use client";

import { useSearch } from "@/components/search/search-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  Album,
  Disc3,
  Coins,
  Mic2,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type SearchResultKind =
  | "artist"
  | "song"
  | "album"
  | "token"
  | "mint";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
}

const kindIcon: Record<SearchResultKind, ReactNode> = {
  artist: <Mic2 className="size-4" aria-hidden />,
  song: <Disc3 className="size-4" aria-hidden />,
  album: <Album className="size-4" aria-hidden />,
  token: <Coins className="size-4" aria-hidden />,
  mint: <Sparkles className="size-4" aria-hidden />,
};

const kindLabel: Record<SearchResultKind, string> = {
  artist: "Artist",
  song: "Song",
  album: "Album",
  token: "Token",
  mint: "Mint",
};

function normalizeKind(kind: string): SearchResultKind {
  if (kind === "music") return "song";
  if (
    kind === "artist" ||
    kind === "song" ||
    kind === "album" ||
    kind === "token" ||
    kind === "mint"
  ) {
    return kind;
  }
  return "token";
}

export function CommandPalette() {
  const { open, setOpen } = useSearch();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const abortRef = useRef<AbortController | null>(null);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setResults([]);
    setLoading(false);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setResults([]);
          setActiveIndex(0);
          return;
        }
        const data = (await res.json()) as {
          results?: Array<{
            id: string;
            kind: string;
            title: string;
            subtitle: string;
            href: string;
          }>;
          artists?: Array<{
            id: string;
            kind: string;
            title: string;
            subtitle: string;
            href: string;
          }>;
          tokens?: Array<{
            id: string;
            kind: string;
            title: string;
            subtitle: string;
            href: string;
          }>;
          music?: Array<{
            id: string;
            kind: string;
            title: string;
            subtitle: string;
            href: string;
          }>;
        };

        const hits =
          data.results ??
          [
            ...(data.artists ?? []),
            ...(data.tokens ?? []),
            ...(data.music ?? []),
          ];

        setResults(
          hits.map((h) => ({
            id: h.id,
            kind: normalizeKind(h.kind),
            title: h.title,
            subtitle: h.subtitle,
            href: h.href,
          })),
        );
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setActiveIndex(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        const href = results[activeIndex].href;
        closeSearch();
        window.location.assign(href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, closeSearch]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/70"
        onClick={closeSearch}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search SpotiPaid"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-fg-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists, songs, albums, tokens, mints…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              results[activeIndex]
                ? `${listboxId}-option-${results[activeIndex].id}`
                : undefined
            }
            role="combobox"
            aria-expanded
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg-muted sm:inline">
            ESC
          </kbd>
        </div>

        <ul
          id={listboxId}
          role="listbox"
          className="max-h-[min(24rem,50vh)] overflow-y-auto p-2"
        >
          {loading && results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-fg-muted">
              Searching…
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-fg-muted">
              No matches for “{query}”
            </li>
          ) : (
            results.map((item, index) => (
              <li key={item.id} role="presentation">
                <Link
                  id={`${listboxId}-option-${item.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  href={item.href}
                  onClick={closeSearch}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                    index === activeIndex
                      ? "bg-white/5 text-fg"
                      : "text-fg-muted hover:bg-white/[0.03] hover:text-fg",
                  )}
                >
                  <span className="flex size-8 items-center justify-center rounded-md border border-border bg-bg text-fg">
                    {kindIcon[item.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">
                      {item.subtitle}
                    </span>
                  </span>
                  <Badge tone="neutral">{kindLabel[item.kind]}</Badge>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
