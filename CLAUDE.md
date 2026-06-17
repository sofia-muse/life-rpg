# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo. Read this instead of scanning the tree.

## What this is

**Life RPG** — a gamified habit/quest tracker, built as a **full-stack portfolio project**:

- **Frontend:** React Native + Expo (iOS / Android / **Web**), TypeScript, Zustand. Offline-first.
- **Backend:** ASP.NET Core 8 Web API, EF Core, SQL Server, JWT auth, on Azure (Bicep IaC). Lives in `backend/`.
- **AI feature:** on-demand "forge a skill" via the **Google Gemini** API (server-side, validated/clamped).

You create a hero, complete real-life quests mapped to 6 RPG stats, earn XP, level up, unlock skills, and evolve your character class through 5 tiers.

**Live demo (web, demo-mode):** https://life-rpg-opal-nine.vercel.app/
**Repo:** https://github.com/sofia-muse/life-rpg

## Core architectural ideas (read these first)

1. **Offline-first.** The Zustand stores (persisted to AsyncStorage) are the source of truth for the UI. The app is fully playable with no backend. `src/api/syncManager.ts` is a persisted queue that flushes mutations to the backend's idempotent `/sync` batch endpoint when online.
2. **Demo mode.** `EXPO_PUBLIC_DEMO_MODE` (default **true**) makes the app run fully local — no backend, no login. The hosted web demo ships in demo mode. Auth + AI forging are **online-only** (demo mode off + signed in).
3. **Server-authoritative game logic.** The game engine exists **twice** — TypeScript (`src/engine/`) for instant optimistic UI, and an identical C# port (`backend/.../Domain/GameEngine` + `GameConfig`) that the server uses as the source of truth (anti-cheat). They're kept in lockstep and **proven equal by golden-value tests** on both sides. If you change game math, change it in **both** and update both test suites.

## Repo layout

```
/                      Expo app (root)
  app/                 expo-router screens: (tabs) Home/Quests/Skills/Journal, (auth), onboarding, modal(settings), customize
  src/
    engine/            PURE game logic (xp, stat, streak, skill, class, journal) — no side effects
    store/             Zustand stores: hero, quest, skill, journal, ui, settings, auth, forgedSkill
    api/               client(apiFetch+refresh), auth, tokenStorage, heroApi, questApi, skillApi, syncManager, dto
    config/            static game data: xpTables, skills, classes, theme, quiz, env, appearance
    components/        game/ avatar/ layout/ animated/
    types/index.ts     domain types + STAT_NAMES/STAT_COLORS/STAT_ICONS/DIFFICULTY_XP
  app.config.ts        Expo config (reads EXPO_PUBLIC_* into extra: { apiUrl, demoMode })
  backend/             .NET solution (see below)
  docs/LINKEDIN_POST.md
  vercel.json eas.json .github/workflows/ci.yml
```

### Backend (`backend/`, clean layered architecture)
```
src/LifeRpg.Domain          entities, value objects (StatBlock, appearance, settings), enums,
                            GameConfig (XpTable, DifficultyXp, StreakMilestones, ClassDefinitions, SkillDefinitions),
                            GameEngine (XpCalculator, StatCalculator, StreakCalculator, SkillResolver, ClassResolver)
src/LifeRpg.Application      services (Auth, Hero, Quest, Sync, SkillForge), DTOs+Mapping, Result<T>,
                            abstractions (IAppDbContext, ICurrentUser, IClock, ITokenService, ILlmClient), Identity (ApplicationUser)
src/LifeRpg.Infrastructure   EF (LifeRpgDbContext, configs, migrations), TokenService(JWT), Ai/GeminiClient, DependencyInjection
src/LifeRpg.Api              controllers/V1 (Auth, Heroes, Quests, Skills, Sync), Program.cs, appsettings
tests/LifeRpg.UnitTests      domain golden-value tests
tests/LifeRpg.IntegrationTests  WebApplicationFactory + in-memory SQLite (no Docker); stubs ILlmClient
infra/main.bicep            App Service (F1) + Azure SQL + Key Vault + App Insights
azure-pipelines.yml         Azure DevOps build→test→deploy
```
Dependency rule: `Api → Application → Domain`; `Infrastructure → Application/Domain`; composition only in `Program.cs`.

## Game mechanics (constants live in config, mirrored C#/TS)

- **6 stats:** strength, vitality, intelligence, charisma, dexterity, willpower.
- **XP curve:** `xpForLevel = floor(100 * level^1.5)`, max level 100. Hero level = `max(1, floor(avg(stat levels)))`.
- **Difficulty XP:** easy 15 / medium 25 / hard 50 / legendary 100.
- **Quest reward:** `base + floor(base*(streakMult-1)) + floor(base*skillBonus%)`.
- **Streaks:** 8 milestones, 1.1×→3.0× (3,7,14,30,60,90,180,365 days).
- **Skills:** 24 static (18 single-stat unlock at L3/7/15 + 6 cross-stat) in `config/skills.ts` / `SkillDefinitions.cs`. XP bonuses are parsed from the `effect` string via regex `\+(\d+)%`.
- **Classes:** 30 (6 dominant stats × 5 tiers); tiers at hero level 1/5/15/30/50.
- **AI-forged skills:** extra, on-demand, per-hero (cap 8). The LLM returns only flavor + target stat + percent; the **server clamps the percent to 1–10 and builds the canonical effect string** so it's tamper-proof. Stored in `GeneratedSkill` (backend) / `forgedSkillStore` (client). Always active; bonuses fold into quest completion.

## Commands

**Frontend** (repo root):
```bash
npm install --legacy-peer-deps     # peer-dep conflict (lottie) requires this flag
npm start                          # expo dev server (w=web, a=android, i=ios)
npm run typecheck                  # tsc --noEmit  (must stay at 0 errors)
npm run lint                       # eslint (errors only; ~18 advisory exhaustive-deps warnings are OK)
npm run test / test:coverage       # jest (jest-expo); engines gated at 80% coverage
npx expo export --platform web     # web build -> dist/ (what Vercel runs)
```
**Backend** (`backend/`, needs `DOTNET_ROOT=$HOME/.dotnet` + `~/.dotnet` on PATH in this env):
```bash
dotnet build                       # warnings-as-errors; must be clean
dotnet test                        # 59 tests (unit + WebApplicationFactory integration, stubbed LLM)
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/LifeRpg.Api   # Swagger at /swagger; SQLite locally
dotnet ef migrations add <Name> -p src/LifeRpg.Infrastructure -s src/LifeRpg.Infrastructure -o Persistence/Migrations
```
**Total: 119 tests** (60 frontend + 59 backend), all green.

## Conventions

- TS path alias `@/*` → repo root. `strict` + `noUnusedLocals/Parameters` on (`noUncheckedIndexedAccess` intentionally deferred).
- Enums serialize as **camelCase strings** across the wire (`"strength"`, `"hard"`) — both API JSON and client agree.
- Stat colors/icons duplicated in `src/types/index.ts` and `src/config/theme.ts`; keep in sync.
- IDs: client `src/utils/id.ts`; backend Guid PKs (client-generatable for offline sync).
- Conventional-commit messages; work pushes to `main` (CI runs lint+typecheck+test + .NET build/test).

## Secrets & environment

- **Never commit secrets.** Frontend: `.env` (gitignored) from `.env.example` (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_DEMO_MODE`).
- Backend local: **user-secrets** in `backend/src/LifeRpg.Api` — `Jwt:SigningKey`, `Llm:ApiKey` (Gemini), connection string. Prod: **Azure Key Vault** references (Bicep wires these via the App Service managed identity).
- Gemini: free Google AI Studio key. Model is **`gemini-2.5-flash`** (note: `gemini-2.0-flash` has free-tier quota 0). `GeminiClient` retries transient 429/5xx.

## Environment gotchas (this dev box)

- `.NET 8 SDK` at `~/.dotnet` (export `DOTNET_ROOT` + PATH). `dotnet-ef` at `~/.dotnet/tools`.
- **No Docker** → integration tests use in-memory SQLite (not Testcontainers). EF `rowversion` concurrency is SQL-Server-only and promoted per-provider in `LifeRpgDbContext.OnModelCreating`; JSON value-objects use string `ValueConverter`s for portability.
- `az` CLI installed at `~/.local/bin/az` (pip user install); Azure login cached in `~/.azure`.
- Web export is slow on `/mnt/c`; route types regenerate only via `expo start` (not `export`).

## Deploy status (2026-06-17)

- ✅ **Web demo** live on Vercel (demo mode), linked in README.
- ✅ **AI forging** verified live against Gemini.
- ⏳ **Azure backend**: fully coded (Bicep + pipeline + migration + published zip ready). **Blocked only by a new-subscription App Service quota of 0** — needs Pay-As-You-Go upgrade or a quota request. Target RG `rg-liferpg` in **northeurope** (West Europe blocks SQL server creation for this sub). After quota: `az deployment group create` the Bicep, apply migrations (`dotnet ef database update --connection`, open SQL firewall for client IP), `az webapp deploy` the zip, smoke-test `/health/ready` + forge.
- TODO: make the repo public; deploy Azure once quota clears; optional EAS APK + demo GIF.
