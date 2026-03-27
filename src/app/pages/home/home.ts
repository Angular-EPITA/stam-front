// Page d'accueil — onglets: derniers jeux ajoutés + recherche filtrée
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Game } from '../../models/game.interface';
import { Genre } from '../../models/genre.interface';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
    private readonly gameService = inject(GameService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    activeTab: 'latest' | 'search' = 'latest';

    latestGames: Game[] = [];
    searchGames: Game[] = [];

    genres: Genre[] = [];

    currentGenreId = '';
    currentYear = '';
    currentSearch = '';

    page = 0;
    size = 12;
    totalPages = 1;

    flashMessage: string | null = null;

    ngOnInit(): void {
        this.loadLatestGames();
    }

    setActiveTab(tab: 'latest' | 'search'): void {
        this.activeTab = tab;

        if (tab === 'latest') {
            this.loadLatestGames();
        } else {
            this.loadGenres();
            this.loadSearchPage(0);
        }
    }

    loadLatestGames(): void {
        this.gameService
            .getLatest()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (games) => (this.latestGames = games),
                error: (err) => console.error('Erreur lors du chargement des derniers jeux', err),
            });
    }

    private loadGenres(): void {
        if (this.genres.length > 0) return;

        this.gameService
            .getGenres()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (genres) => (this.genres = genres),
                error: (err) => console.error('Erreur lors du chargement des genres', err),
            });
    }

    loadSearchPage(page: number): void {
        const year = this.currentYear ? Number(this.currentYear) : undefined;
        const genreId = this.currentGenreId ? Number(this.currentGenreId) : undefined;
        const search = (this.currentSearch ?? '').trim();

        this.gameService
            .getGamesPaged(page, this.size, { year, genreId, search })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.page = res.page;
                    this.totalPages = res.totalPages;
                    this.searchGames = res.items;
                },
                error: (err) => console.error('Erreur lors du chargement des jeux', err),
            });
    }

    onFilterChange(type: 'search' | 'genre' | 'year', value: string): void {
        if (type === 'search') this.currentSearch = value;
        if (type === 'genre') this.currentGenreId = value;
        if (type === 'year') this.currentYear = value;

        if (this.activeTab === 'search') {
            this.loadSearchPage(0);
        }
    }

    prevPage(): void {
        if (this.page <= 0) return;
        this.loadSearchPage(this.page - 1);
    }

    nextPage(): void {
        if (this.page >= this.totalPages - 1) return;
        this.loadSearchPage(this.page + 1);
    }

    clearFlash(): void {
        this.router.navigate([], { queryParams: { message: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
}
