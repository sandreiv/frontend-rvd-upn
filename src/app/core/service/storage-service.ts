import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const DEV_TOKEN_KEY = 'rvd.dev.token';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly tokenKey = environment.auth.tokenStorageKey;
  private readonly userKey = environment.auth.userStorageKey;

  getToken(): string | null {
    return this.read(this.tokenKey);
  }

  setToken(token: string): void {
    this.write(this.tokenKey, token);
  }

  removeToken(): void {
    this.remove(this.tokenKey);
  }

  getUser<T = unknown>(): T | null {
    const storedValue = this.read(this.userKey);

    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue) as T;
    } catch {
      return storedValue as T;
    }
  }

  setUser(user: unknown): void {
    const value = typeof user === 'string' ? user : JSON.stringify(user);
    this.write(this.userKey, value);
  }

  removeUser(): void {
    this.remove(this.userKey);
  }

  getDevToken(): string | null {
    if (environment.production) {
      return null;
    }

    return this.readSession(DEV_TOKEN_KEY);
  }

  setDevToken(token: string): void {
    if (environment.production) {
      return;
    }

    this.writeSession(DEV_TOKEN_KEY, token);
  }

  clearSession(): void {
    this.removeToken();
    this.removeUser();
    this.removeSession(DEV_TOKEN_KEY);
  }

  hasSession(): boolean {
    return this.getToken() !== null;
  }

  private read(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }

  private write(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(key, value);
  }

  private remove(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(key);
  }

  private readSession(key: string): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage.getItem(key);
  }

  private writeSession(key: string, value: string): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.setItem(key, value);
  }

  private removeSession(key: string): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(key);
  }
}
