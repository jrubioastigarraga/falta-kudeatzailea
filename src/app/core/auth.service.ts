import { Injectable, computed, signal } from '@angular/core';
import { SessionUser } from './models';
import { loadDemoCredentials, loadDemoData } from './demo-store';
import { isDemoMode, supabase } from './supabase';

const DEMO_SESSION_KEY = 'fk_demo_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<SessionUser | null>(null);
  readonly loading = signal(true);
  readonly isDemo = isDemoMode;

  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isLoggedIn = computed(() => this.user() !== null);

  private readonly readyResolve = { fn: () => {} };
  readonly whenReady = new Promise<void>((resolve) => (this.readyResolve.fn = resolve));

  constructor() {
    if (isDemoMode) {
      this.restoreDemoSession();
      this.loading.set(false);
      this.readyResolve.fn();
    } else {
      void this.initSupabase();
    }
  }

  private restoreDemoSession(): void {
    const id = localStorage.getItem(DEMO_SESSION_KEY);
    if (!id) return;
    const profile = loadDemoData().profiles.find((p) => p.id === id && p.active);
    if (profile) {
      this.user.set({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      });
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  }

  private async initSupabase(): Promise<void> {
    if (!supabase) {
      this.loading.set(false);
      this.readyResolve.fn();
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await this.loadProfile(data.session.user.id, data.session.user.email ?? '');
      }
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          void this.loadProfile(session.user.id, session.user.email ?? '');
        } else {
          this.user.set(null);
        }
      });
    } catch (err) {
      console.error('Supabase auth init failed', err);
    } finally {
      this.loading.set(false);
      this.readyResolve.fn();
    }
  }

  private async loadProfile(id: string, email: string): Promise<void> {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,role,active')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      this.user.set({ id, email, full_name: email.split('@')[0], role: 'student' });
      return;
    }
    this.user.set({
      id: data.id,
      email: data.email ?? email,
      full_name: data.full_name ?? email,
      role: data.role === 'admin' ? 'admin' : 'student',
    });
  }

  async login(email: string, password: string): Promise<void> {
    const normalized = email.trim().toLowerCase();

    if (isDemoMode) {
      const cred = loadDemoCredentials().find(
        (c) => c.email.toLowerCase() === normalized && c.password === password,
      );
      if (!cred) throw new Error('INVALID_CREDENTIALS');
      const profile = loadDemoData().profiles.find((p) => p.id === cred.profileId);
      if (!profile || !profile.active) throw new Error('INVALID_CREDENTIALS');
      localStorage.setItem(DEMO_SESSION_KEY, profile.id);
      this.user.set({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      });
      return;
    }

    if (!supabase) throw new Error('NO_SUPABASE');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) throw new Error('INVALID_CREDENTIALS');
    if (data.user) await this.loadProfile(data.user.id, data.user.email ?? normalized);
  }

  /** Only used in demo mode; in Supabase, users register from the login page. */
  async signup(fullName: string, email: string, password: string): Promise<'session' | 'email'> {
    const normalized = email.trim().toLowerCase();
    if (isDemoMode) {
      throw new Error('DEMO_SIGNUP_FROM_ADMIN');
    }
    if (!supabase) throw new Error('NO_SUPABASE');
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
    if (data.session) {
      await this.loadProfile(data.session.user.id, normalized);
      return 'session';
    }
    return 'email';
  }

  async logout(): Promise<void> {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      this.user.set(null);
      return;
    }
    await supabase?.auth.signOut();
    this.user.set(null);
  }

  setDemoUser(id: string): void {
    const profile = loadDemoData().profiles.find((p) => p.id === id);
    if (!profile) return;
    localStorage.setItem(DEMO_SESSION_KEY, profile.id);
    this.user.set({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
    });
  }

  refreshDemoUser(): void {
    const current = this.user();
    if (!current) return;
    const profile = loadDemoData().profiles.find((p) => p.id === current.id);
    if (profile) {
      this.user.set({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      });
    }
  }
}
