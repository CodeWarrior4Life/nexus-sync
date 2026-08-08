# Nexus Sync (Obsidian plugin)

> **DISTRIBUTION SHELL ONLY — READ BEFORE FOLLOWING ANY POINTER (2026-08-08 audit).**
> This repo exists solely as a BRAT install target (Phase A3 of S449) and its release is **frozen at v0.1.0** while the live plugin is at 0.2.7. Canonical plugin source: **`CodeWarrior4Life/obsidian-nexus-sync`** (NOT the Nexus monorepo copy named below, which is divergent and stuck at 0.1.0). The primary update channel is the Nexus server plugin registry (auto-install since v0.2.4); this BRAT channel is vestigial and kept only because install URLs exist in the wild.
> Naming note: despite the id `nexus-sync`, this plugin is ONE vault-scoped subscriber of **Nexus Sync**, which is a multi-root folder-sync system (daemon `[[sync_roots]]`, route-relative wire paths) — the plugin speaks the legacy single-vault device API (:5555), not the multi-root subscriber lane. That legacy lane was DEPRECATED server-side 2026-08-02 (TKT-f91e840b; device rows revoked, endpoints emit Deprecation/Sunset headers, Phase-2 removal planned) — the fleet propagation path is the Nexus Sync daemon.

Sync your vault with Nexus server. Pull and push notes, real-time change notifications, conflict resolution.

## Install (BRAT)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. Open BRAT settings -> `Add Beta Plugin` -> enter `CodeWarrior4Life/nexus-sync`.
3. Enable the plugin in Community Plugins -> Installed plugins.

## Source

The full source (TypeScript) and build pipeline live in [CodeWarrior4Life/Nexus](https://github.com/CodeWarrior4Life/Nexus) under `obsidian-nexus-sync/`. This repo holds the compiled distribution + Releases.

## Phase A3 context

Phase A3 of S449 (2026-05-21) created this repo to close BRAT-404 on the old `obsidian-nexus-sync` URL. The plugin manifest ID (`nexus-sync`) was already correct -- only the GitHub source URL needed rebranding to drop the `obsidian-` prefix.
