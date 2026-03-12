import { AlertUser } from './types';

// Vercel KV를 동적으로 import (빌드 타임 에러 방지)
async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

const ALERT_PREFIX = 'alert:';

export async function getAlertUser(chatId: number): Promise<AlertUser | null> {
  try {
    const kv = await getKv();
    return await kv.get<AlertUser>(`${ALERT_PREFIX}${chatId}`);
  } catch (error) {
    console.error('KV get error:', error);
    return null;
  }
}

export async function setAlertUser(user: AlertUser): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(`${ALERT_PREFIX}${user.chatId}`, user);
  } catch (error) {
    console.error('KV set error:', error);
  }
}

export async function deleteAlertUser(chatId: number): Promise<void> {
  try {
    const kv = await getKv();
    await kv.del(`${ALERT_PREFIX}${chatId}`);
  } catch (error) {
    console.error('KV del error:', error);
  }
}

export async function getAllAlertUsers(): Promise<AlertUser[]> {
  try {
    const kv = await getKv();
    const keys = await kv.keys(`${ALERT_PREFIX}*`);
    if (keys.length === 0) return [];

    const users: AlertUser[] = [];
    for (const key of keys) {
      const user = await kv.get<AlertUser>(key);
      if (user && user.active) {
        users.push(user);
      }
    }
    return users;
  } catch (error) {
    console.error('KV scan error:', error);
    return [];
  }
}
