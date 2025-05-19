// lib/replitDb.ts
import fetch from "node-fetch";

const DB_URL = process.env.REPLIT_DB_URL as string;

export const db = {
  async get<T = any>(key: string): Promise<T | null> {
    const res = await fetch(`${DB_URL}/${key}`);
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  },
  async set(key: string, value: any) {
    await fetch(DB_URL, {
      method: "POST",
      body: `${key}=${JSON.stringify(value)}`
    });
  },
  async list(prefix: string) {
    const res = await fetch(`${DB_URL}?prefix=${prefix}`);
    return res.text();
  }
};