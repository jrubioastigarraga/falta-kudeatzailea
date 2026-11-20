import { AppData } from './models';
import { DEMO_CREDENTIALS, DemoCredential, seedData } from './seed';

const DATA_KEY = 'fk_demo_db_v1';
const CRED_KEY = 'fk_demo_credentials_v1';

export function loadDemoData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && Array.isArray(parsed.courses)) return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  const seeded = seedData();
  saveDemoData(seeded);
  return seeded;
}

export function saveDemoData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadDemoCredentials(): DemoCredential[] {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    if (raw) return JSON.parse(raw) as DemoCredential[];
  } catch {
    // ignore
  }
  saveDemoCredentials(DEMO_CREDENTIALS);
  return [...DEMO_CREDENTIALS];
}

export function saveDemoCredentials(credentials: DemoCredential[]): void {
  localStorage.setItem(CRED_KEY, JSON.stringify(credentials));
}

export function resetDemoData(): void {
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(CRED_KEY);
  localStorage.removeItem('fk_demo_session');
}
