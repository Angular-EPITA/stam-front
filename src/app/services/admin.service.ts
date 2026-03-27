import { Injectable } from '@angular/core';

const STORAGE_KEY = 'stam_is_admin';
const DEFAULT_ADMIN_CODE = 'admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
    isAdmin(): boolean {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    login(code: string): boolean {
        const ok = (code ?? '').trim() === DEFAULT_ADMIN_CODE;
        if (ok) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        return ok;
    }

    logout(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
}
