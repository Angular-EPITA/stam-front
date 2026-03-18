// Page d'accueil — affiche les derniers jeux ajoutés
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

    games: Game[] = [];

    ngOnInit(): void {
        this.gameService
            .getLatest()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (games) => (this.games = games),
                error: (err) => console.error('Erreur lors du chargement des jeux', err),
            });
    }
}
