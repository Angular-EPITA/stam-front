// Page d'accueil — onglets: derniers jeux ajoutés + recherche filtrée
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { Game } from '../../models/game.interface';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
    private readonly gameService = inject(GameService);
    private readonly destroyRef = inject(DestroyRef);

    activeTab: 'latest' | 'search' = 'latest';

    latestGames: Game[] = [];
    searchGames: Game[] = [];

    allGamesForSearch: Game[] = [];
    availableGenres: string[] = [];
    availableYears: number[] = [];
    private allGamesLoading = false;

    currentGenre = '';
    currentYear = '';
    currentSearch = '';

    ngOnInit(): void {
        this.loadLatestGames();
    }

    setActiveTab(tab: 'latest' | 'search'): void {
        this.activeTab = tab;

        if (tab === 'latest') {
            this.loadLatestGames();
        } else {
            this.ensureAllGamesLoadedForSearch();
            this.loadSearchGames();
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

    private ensureAllGamesLoadedForSearch(): void {
        if (this.allGamesForSearch.length > 0 || this.allGamesLoading) return;

        this.allGamesLoading = true;
        this.gameService
            .getAllGames()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (games) => {
                    this.allGamesForSearch = games;

                    const genreSet = new Set(
                        games.map((g) => (g.genre ?? '').trim()).filter((g) => g.length > 0)
                    );
                    this.availableGenres = Array.from(genreSet).sort((a, b) => a.localeCompare(b));

                    const yearSet = new Set(
                        games
                            .map((g) => g.year)
                            .filter((y) => typeof y === 'number' && Number.isFinite(y) && y > 0)
                    );
                    this.availableYears = Array.from(yearSet).sort((a, b) => b - a);

                    this.loadSearchGames();
                },
                error: (err) => console.error('Erreur lors du chargement de la liste des jeux', err),
                complete: () => (this.allGamesLoading = false),
            });
    }

    loadSearchGames(): void {
        if (this.allGamesForSearch.length === 0) {
            this.searchGames = [];
            return;
        }

        const year = this.currentYear ? Number(this.currentYear) : undefined;
        const search = (this.currentSearch ?? '').trim().toLowerCase();
        const selectedGenre = (this.currentGenre ?? '').trim();

        this.searchGames = this.allGamesForSearch.filter((g) => {
            if (selectedGenre && g.genre !== selectedGenre) return false;
            if (year && g.year !== year) return false;
            if (search) {
                const haystack = `${g.title} ${g.description}`.toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return true;
        });
    }

    onFilterChange(type: 'search' | 'genre' | 'year', value: string): void {
        if (type === 'search') this.currentSearch = value;
        if (type === 'genre') this.currentGenre = value;
        if (type === 'year') this.currentYear = value;

        if (this.activeTab === 'search') {
            this.ensureAllGamesLoadedForSearch();
            this.loadSearchGames();
        }
    }
}
