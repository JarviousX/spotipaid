"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import type { ProtocolAdminConfig } from "@/services/protocol-config";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type AuditRow = {
  id: string;
  timestamp: string;
  action: string;
  previous: string | null;
  next: string | null;
  success: boolean;
  sessionId: string | null;
  ipAddress: string | null;
};

type WalletRow = {
  id: string;
  address: string;
  event: string;
  network: string | null;
  createdAt: string;
};

function explorerUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

async function adm1nFetch(path: string, init?: RequestInit) {
  const csrf = getCookie("sp_adm1n_csrf");
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (csrf) headers.set("x-csrf-token", csrf);
  return fetch(path, { ...init, headers, credentials: "same-origin" });
}

export function Adm1nConsole({
  sessionId,
  role,
  initialConfig,
  initialLogs,
  initialWalletEvents,
}: {
  sessionId: string;
  role: string;
  initialConfig: ProtocolAdminConfig;
  initialLogs: AuditRow[];
  initialWalletEvents: WalletRow[];
}) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [logs, setLogs] = useState(initialLogs);
  const [walletEvents] = useState(initialWalletEvents);
  const [caDraft, setCaDraft] = useState(initialConfig.contractAddress ?? "");
  const [feeDraft, setFeeDraft] = useState(initialConfig.feeWallet ?? "");
  const [xDraft, setXDraft] = useState(initialConfig.xAccount ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    const res = await fetch("/api/adm1n/audit?limit=40");
    if (!res.ok) return;
    const data = (await res.json()) as { logs: AuditRow[] };
    setLogs(data.logs);
  }, []);

  async function patch(
    field: "contractAddress" | "feeWallet" | "xAccount" | "maintenance",
    value: string | boolean,
    confirm?: boolean,
  ) {
    setBusy(field);
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { field, value };
      if (field !== "xAccount") body.confirm = true;
      if (confirm === false) {
        setError("Confirmation required");
        return;
      }
      const res = await adm1nFetch("/api/adm1n/config", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        config?: ProtocolAdminConfig;
      };
      if (!res.ok || !data.config) {
        setError(data.error ?? "Update failed");
        return;
      }
      setConfig(data.config);
      setMessage("Saved.");
      await refreshLogs();
      router.refresh();
    } catch {
      setError("Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await adm1nFetch("/api/adm1n/logout", { method: "POST", body: "{}" });
    router.replace("/adm1n/login");
    router.refresh();
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  function confirmDangerous(label: string): boolean {
    return window.confirm(
      `Confirm change to ${label}?\n\nCurrent and pending values are shown in the console. This action is audit-logged.`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1a1a1a] pb-6">
        <div>
          <Logo />
          <div className="mt-4 flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              ADM1N
            </p>
            {config.maintenance ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                <ShieldAlert className="size-3" aria-hidden />
                Maintenance ON
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Protocol control
          </h1>
          <p className="mt-1 font-mono text-[11px] text-[#5a5a5a]">
            session {sessionId} · {role}
          </p>
        </div>
        <Button variant="secondary" onClick={logout} className="rounded-xl">
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </header>

      {(message || error) && (
        <p
          className={cn(
            "mt-4 text-sm",
            error ? "text-danger" : "text-accent",
          )}
          role="status"
        >
          {error ?? message}
        </p>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Contract / CA */}
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
          <h2 className="text-sm font-semibold text-white">Contract / CA</h2>
          <p className="mt-1 text-xs text-[#8a8a8a]">
            Official contract address. Validated Solana public key only.
          </p>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-[#6b6b6b]">Current</dt>
              <dd className="font-mono text-white">
                {config.contractAddress
                  ? truncateAddress(config.contractAddress, 6)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#6b6b6b]">Pending</dt>
              <dd className="font-mono text-accent">
                {caDraft.trim() && caDraft.trim() !== (config.contractAddress ?? "")
                  ? truncateAddress(caDraft.trim(), 6)
                  : "unchanged"}
              </dd>
            </div>
          </dl>
          <input
            value={caDraft}
            onChange={(e) => setCaDraft(e.target.value)}
            placeholder="Solana mint / program address"
            className="mt-3 h-10 w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-3 font-mono text-xs text-white focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="accent"
              size="sm"
              className="rounded-xl"
              disabled={busy === "contractAddress" || !caDraft.trim()}
              onClick={() => {
                if (!confirmDangerous("Contract / CA")) return;
                void patch("contractAddress", caDraft.trim(), true);
              }}
            >
              {busy === "contractAddress" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Save CA
            </Button>
            {config.contractAddress ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  onClick={() =>
                    void copy(config.contractAddress!, "ca")
                  }
                >
                  {copied === "ca" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copy
                </Button>
                <a
                  href={explorerUrl(config.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#2a2a2a] px-3 text-xs font-semibold text-[#9a9a9a] hover:text-white"
                >
                  Explorer
                  <ExternalLink className="size-3" />
                </a>
              </>
            ) : null}
          </div>
        </section>

        {/* Fee wallet */}
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
          <h2 className="text-sm font-semibold text-white">Fee wallet</h2>
          <p className="mt-1 text-xs text-[#8a8a8a]">
            Public address that receives protocol fees. Never paste a seed
            phrase or private key.
          </p>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-[#6b6b6b]">Current</dt>
              <dd className="font-mono text-white">
                {config.feeWallet
                  ? truncateAddress(config.feeWallet, 6)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#6b6b6b]">Pending</dt>
              <dd className="font-mono text-accent">
                {feeDraft.trim() && feeDraft.trim() !== (config.feeWallet ?? "")
                  ? truncateAddress(feeDraft.trim(), 6)
                  : "unchanged"}
              </dd>
            </div>
          </dl>
          <input
            value={feeDraft}
            onChange={(e) => setFeeDraft(e.target.value)}
            placeholder="Public fee wallet address"
            className="mt-3 h-10 w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-3 font-mono text-xs text-white focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="accent"
              size="sm"
              className="rounded-xl"
              disabled={busy === "feeWallet" || !feeDraft.trim()}
              onClick={() => {
                if (!confirmDangerous("Fee wallet")) return;
                void patch("feeWallet", feeDraft.trim(), true);
              }}
            >
              {busy === "feeWallet" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Save fee wallet
            </Button>
            {config.feeWallet ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => void copy(config.feeWallet!, "fee")}
                >
                  {copied === "fee" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copy
                </Button>
                <a
                  href={explorerUrl(config.feeWallet)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#2a2a2a] px-3 text-xs font-semibold text-[#9a9a9a] hover:text-white"
                >
                  Explorer
                  <ExternalLink className="size-3" />
                </a>
              </>
            ) : null}
          </div>
        </section>

        {/* X account */}
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
          <h2 className="text-sm font-semibold text-white">X account</h2>
          <p className="mt-1 text-xs text-[#8a8a8a]">
            Official @handle or x.com profile URL. Sanitized before save.
          </p>
          <p className="mt-3 font-mono text-xs text-white">
            Current:{" "}
            {config.xAccount ? (
              <a
                href={config.xUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                @{config.xAccount}
              </a>
            ) : (
              "—"
            )}
          </p>
          <input
            value={xDraft}
            onChange={(e) => setXDraft(e.target.value)}
            placeholder="@spotipaid or https://x.com/…"
            className="mt-3 h-10 w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-3 text-sm text-white focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
          />
          <Button
            variant="accent"
            size="sm"
            className="mt-3 rounded-xl"
            disabled={busy === "xAccount" || !xDraft.trim()}
            onClick={() => void patch("xAccount", xDraft.trim())}
          >
            {busy === "xAccount" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            Save X account
          </Button>
        </section>

        {/* Maintenance */}
        <section
          className={cn(
            "rounded-2xl border p-5",
            config.maintenance
              ? "border-warning/40 bg-warning/5"
              : "border-[#1f1f1f] bg-[#0c0c0c]",
          )}
        >
          <h2 className="text-sm font-semibold text-white">
            Maintenance freeze
          </h2>
          <p className="mt-1 text-xs text-[#8a8a8a]">
            Emergency toggle. When ON, public writes (launch, claims, reports,
            opt-out) are blocked server-side and visitors see a maintenance
            screen. /adm1n stays available.
          </p>
          <p className="mt-4 text-sm text-white">
            Status:{" "}
            <span
              className={
                config.maintenance ? "font-semibold text-warning" : "text-accent"
              }
            >
              {config.maintenance ? "ENABLED" : "Disabled"}
            </span>
          </p>
          <Button
            variant={config.maintenance ? "secondary" : "danger"}
            size="sm"
            className="mt-3 rounded-xl"
            disabled={busy === "maintenance"}
            onClick={() => {
              const next = !config.maintenance;
              if (
                !confirmDangerous(
                  next ? "ENABLE maintenance freeze" : "DISABLE maintenance",
                )
              ) {
                return;
              }
              void patch("maintenance", next, true);
            }}
          >
            {busy === "maintenance" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            {config.maintenance ? "Disable freeze" : "Enable freeze"}
          </Button>
        </section>
      </div>

      {/* Audit log */}
      <section className="mt-6 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
        <h2 className="text-sm font-semibold text-white">Audit log</h2>
        <p className="mt-1 text-xs text-[#8a8a8a]">
          Immutable-style record of sensitive configuration changes. Credentials
          are never logged.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-[0.1em] text-[#5a5a5a]">
              <tr>
                <th className="pb-2 pr-3 font-medium">Time</th>
                <th className="pb-2 pr-3 font-medium">Action</th>
                <th className="pb-2 pr-3 font-medium">Previous</th>
                <th className="pb-2 pr-3 font-medium">New</th>
                <th className="pb-2 pr-3 font-medium">Session</th>
                <th className="pb-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-[#5a5a5a]">
                    No audit entries yet.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="border-t border-[#1a1a1a]">
                    <td className="py-2.5 pr-3 font-mono text-[#8a8a8a]">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3 text-white">{row.action}</td>
                    <td className="max-w-[8rem] truncate py-2.5 pr-3 font-mono text-[#6b6b6b]">
                      {row.previous ?? "—"}
                    </td>
                    <td className="max-w-[8rem] truncate py-2.5 pr-3 font-mono text-accent">
                      {row.next ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[#6b6b6b]">
                      {row.sessionId
                        ? truncateAddress(row.sessionId, 4)
                        : "—"}
                    </td>
                    <td className="py-2.5 font-mono text-[#6b6b6b]">
                      {row.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Wallet activity */}
      <section className="mt-4 rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] p-5">
        <h2 className="text-sm font-semibold text-white">
          Wallet connection activity
        </h2>
        <p className="mt-1 text-xs text-[#8a8a8a]">
          Public addresses and connect/disconnect events only — no seeds or
          private keys. See Privacy Policy for retention.
        </p>
        <ul className="mt-4 space-y-2">
          {walletEvents.length === 0 ? (
            <li className="text-xs text-[#5a5a5a]">No events yet.</li>
          ) : (
            walletEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1a1a1a] py-2 text-xs"
              >
                <span className="font-mono text-white">
                  {truncateAddress(ev.address, 4)}
                </span>
                <span className="text-accent">{ev.event}</span>
                <span className="font-mono text-[#5a5a5a]">
                  {new Date(ev.createdAt).toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
