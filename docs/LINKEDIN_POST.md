# LinkedIn post — Life RPG

> Copy-paste ready. Pick the version you like. Replace nothing except (optionally) the demo GIF.
> Live demo: https://life-rpg-opal-nine.vercel.app/ · Repo: https://github.com/sofia-muse/life-rpg

---

## Version A — concise (recommended)

I turned my habit tracker into a full RPG — and built the whole stack myself. ⚔️

**Life RPG**: complete real-life quests, earn XP across six stats, level up, unlock skills, and evolve your class through five tiers.

As a .NET developer I wanted one project that shows the *whole* picture:

🎮 **Frontend** — React Native + Expo (iOS/Android/Web), TypeScript, Zustand, offline-first
⚙️ **Backend** — ASP.NET Core 8 Web API, EF Core, SQL Server, JWT auth, on **Azure** (Bicep IaC + CI/CD)
🤖 **AI** — "forge" a unique skill on demand: the server prompts an LLM for structured output, then **validates and clamps** the result so it's balanced and tamper-proof
🔒 **Engineering** — offline-first sync with an idempotent batch endpoint, server-authoritative game logic (anti-cheat), and **119 automated tests** (the game engine is ported identically in C# and TypeScript and proven equal by tests)

▶️ Try it (runs instantly, no sign-up): https://life-rpg-opal-nine.vercel.app/
💻 Code: https://github.com/sofia-muse/life-rpg

Built with React Native, C#, ASP.NET Core, EF Core, SQL Server, Azure — and a lot of fun.

#dotnet #csharp #reactnative #aspnetcore #azure #fullstack #softwareengineering #typescript #ai

---

## Version B — story / first-person

"What if leveling up a habit felt like leveling up a character?"

That question turned into **Life RPG** — and into the most complete project I've built: a gamified habit tracker where I designed and shipped every layer end-to-end.

The fun part for me was the engineering underneath the game:
• **Offline-first** — the app is fully playable with no connection; a persisted queue syncs to the backend through an **idempotent batch endpoint** when you're back online.
• **Server-authoritative** — XP, levels, classes and skill unlocks are recomputed on the server (anti-cheat), while the client computes the same values for instant, animated feedback. The game engine lives in both C# and TypeScript and stays in lockstep — guaranteed by tests.
• **AI-forged skills** — tap "Forge" and an LLM generates a skill themed to your hero; the server takes only safe fields from the model and **clamps the bonus** so it can't be inflated.

Stack: React Native/Expo + TypeScript on the front; ASP.NET Core 8, EF Core, SQL Server, JWT, deployed to Azure with Bicep + CI/CD on the back. 119 tests, all green.

▶️ Live demo: https://life-rpg-opal-nine.vercel.app/
💻 Source: https://github.com/sofia-muse/life-rpg

Always happy to talk shop about any of it. 🙂

#fullstack #dotnet #reactnative #azure #csharp #aspnetcore #ai #softwaredevelopment

---

### Posting tips
- Add a **screen-recording / GIF** of the level-up → skill-unlock → tier-up cascade as the post media — it dramatically boosts engagement. (Record the live demo: onboarding quiz → complete a quest → watch the cascade.)
- Post Tue–Thu morning for best reach.
- After deploying the Azure API, you can add: "Live API + Swagger: <url>/swagger".
