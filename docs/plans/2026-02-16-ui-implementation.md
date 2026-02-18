# Currency Converter UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Next.js web UI to the existing currency converter API in a monorepo structure, deploy to Cloudflare Pages.

**Architecture:** Restructure as npm workspace monorepo with two packages: existing API (Cloudflare Worker) and new web UI (Next.js on Cloudflare Pages). Add `/currencies` endpoint to API, build minimal responsive conversion form, share types between packages.

**Tech Stack:** TypeScript, Next.js 14+, Tailwind CSS, Cloudflare Workers, Cloudflare Pages, Vitest, React Testing Library, Playwright

---
