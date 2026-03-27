import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Genre } from '../../models/genre.interface';
import { GameService } from '../../services/game.service';
import { AdminService } from '../../services/admin.service';

@Component({
    selector: 'app-edit-game',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './edit-game.html',
})
export class EditGameComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly gameService = inject(GameService);
    private readonly adminService = inject(AdminService);
    private readonly destroyRef = inject(DestroyRef);

    id: string | null = null;

    genres: Genre[] = [];

    game = {
        title: '',
        description: '',
        price: 0,
        releaseDate: '',
        genreId: 1,
        imageUrl: '',
    };

    isLoading = true;
    isSubmitting = false;
    error: string | null = null;

    ngOnInit(): void {
        if (!this.adminService.isAdmin()) {
            this.router.navigate(['/admin']);
            this.isLoading = false;
            return;
        }
        this.id = this.route.snapshot.paramMap.get('id');
        if (!this.id) {
            this.error = 'ID manquant.';
            this.isLoading = false;
            return;
        }

        this.gameService
            .getGenres()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (genres) => (this.genres = genres),
            });

        this.gameService
            .getGameById(this.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (g) => {
                    this.game = {
                        title: g.title,
                        description: g.description,
                        price: g.price,
                        releaseDate: g.releaseDate,
                        genreId: g.genreId || 1,
                        imageUrl: g.imageUrl,
                    };
                    this.isLoading = false;
                },
                error: () => {
                    this.error = 'Jeu introuvable.';
                    this.isLoading = false;
                },
            });
    }

    onSubmit(): void {
        if (!this.id) return;

        this.isSubmitting = true;
        this.error = null;

        this.gameService
            .updateGame(this.id, this.game)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.router.navigate(['/games', this.id], { queryParams: { message: 'Jeu modifié.' } });
                },
                error: () => {
                    this.isSubmitting = false;
                    this.error = 'Modification impossible.';
                },
            });
    }
}
