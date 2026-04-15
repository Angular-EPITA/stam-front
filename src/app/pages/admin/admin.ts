import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Game } from '../../models/game.interface';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin.html',
})
export class AdminComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly gameService = inject(GameService);
    private readonly destroyRef = inject(DestroyRef);

    page = 0;
    totalPages = 1;
    games: Game[] = [];

    ngOnInit(): void {
        this.loadPage(0);
    }

    logout(): void {
        this.authService.logout();
    }

    loadPage(page: number): void {
        this.gameService
            .getGamesPaged(page, 12)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.page = res.page;
                    this.totalPages = res.totalPages;
                    this.games = res.items;
                },
                error: (err) => console.error('Erreur chargement admin', err),
            });
    }

    prevPage(): void {
        if (this.page <= 0) return;
        this.loadPage(this.page - 1);
    }

    nextPage(): void {
        if (this.page >= this.totalPages - 1) return;
        this.loadPage(this.page + 1);
    }

    deleteGame(game: Game): void {
        const ok = confirm(`Supprimer "${game.title}" ?`);
        if (!ok) return;

        this.gameService
            .deleteGame(game.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.loadPage(this.page),
                error: () => alert('Suppression impossible.'),
            });
    }
}
