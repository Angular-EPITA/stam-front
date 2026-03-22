// Page d'accueil — affiche les derniers jeux ajoutés
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '../../models/game.interface';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
    private readonly gameService = inject(GameService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    games: Game[] = [];
    currentGenre = '';
    currentYear = '';
    currentSearch = '';

    ngOnInit(): void {
        this.route.queryParams
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.currentGenre = params['genre'] || '';
                this.currentYear = params['year'] || '';
                this.currentSearch = params['search'] || '';

                this.loadGames();
            });
    }

    loadGames(): void {
        const filters: any = {};
        if (this.currentGenre) filters.genre = this.currentGenre;
        if (this.currentYear) filters.year = Number(this.currentYear);
        if (this.currentSearch) filters.search = this.currentSearch;

        this.gameService
            .getGames(0, 20, filters)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (games) => (this.games = games),
                error: (err) => console.error('Erreur lors du chargement des jeux', err),
            });
    }

    onFilterChange(type: 'search' | 'genre' | 'year', value: string): void {
        const queryParams: any = { ...this.route.snapshot.queryParams };
        
        if (value) {
            queryParams[type] = value;
        } else {
            delete queryParams[type];
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge',
        });
    }
}
