import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Game } from '../../models/game.interface';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-game-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './game-detail.html',
})
export class GameDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly gameService = inject(GameService);
    private readonly authService = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);

    isLoading = true;
    error: string | null = null;
    game: Game | null = null;

    isAdmin(): boolean {
        return this.authService.isLoggedIn;
    }

    ngOnInit(): void {

        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.error = 'ID manquant.';
            this.isLoading = false;
            return;
        }

        this.gameService
            .getGameById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (g) => {
                    this.game = g;
                    this.isLoading = false;
                },
                error: () => {
                    this.error = 'Jeu introuvable.';
                    this.isLoading = false;
                },
            });
    }

    onDelete(): void {
        if (!this.game) return;
        const ok = confirm(`Supprimer "${this.game.title}" ?`);
        if (!ok) return;

        this.gameService
            .deleteGame(this.game.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.router.navigate(['/'], { queryParams: { message: 'Jeu supprimé.' } });
                },
                error: () => {
                    this.error = 'Suppression impossible.';
                },
            });
    }
}
