# GymERP — Technical Documentation Directory

Welcome to the GymERP technical documentation suite. This directory contains comprehensive references, runbooks, architecture diagrams, and design specifications.

---

## 1. Documentation Index

| Document | Purpose | Audience |
| :--- | :--- | :--- |
| **[CONTEXT.md](./CONTEXT.md)** | Core system status, database schema, live URLs, and full route matrix | All Engineers & AI Agents |
| **[setup.md](./setup.md)** | 5-minute local development setup, environment variables, and seed data | Developers |
| **[deployment.md](./deployment.md)** | Production deployment runbook for Vercel, Oracle Cloud VM, and Neon | DevOps / Sysadmins |
| **[api-server-guide.md](./api-server-guide.md)** | Dedicated Fastify backend API documentation, latency benchmarks, endpoints | Backend Engineers |
| **[design-system.md](./design-system.md)** | UI design system, color tokens, typography, and frosted glass mechanics | Frontend Engineers / Designers |
| **[tech-stack.md](./tech-stack.md)** | Comprehensive technology stack matrix, library versions, and isolation rules | Architects |
| **[PRD.md](./PRD.md)** | Product Requirements Document outlining features, roles, and security | Product & Stakeholders |
| **[CLAUDE.md](./CLAUDE.md)** | Developer & agent instructions, credentials, shortcuts, and constraints | AI Coding Agents |

---

## 2. Subdirectories

- **[`phases/`](./phases/)**: Historical milestone specifications (Phases 0 through 5).
- **[`demo/`](./demo/)**: Standalone interactive HTML/CSS/JS prototypes of core portal workflows.
- **[`wireframes/`](./wireframes/)**: ASCII layouts and early screen wireframes.

---

## 3. Production Quick Reference

- **Frontend App**: `https://gymerp-liard.vercel.app`
- **Backend Fastify API**: `https://gymerp.duckdns.org` (PM2 `gymerp-api`, port 4000)
- **Database**: Neon Serverless PostgreSQL in Singapore (`ap-southeast-1`)
- **Superadmin Gateway**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) or click the footer "G" logo 5 times.
