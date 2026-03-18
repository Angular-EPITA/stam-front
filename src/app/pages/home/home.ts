// Page d'accueil — affiche les derniers jeux ajoutés
import { Component } from '@angular/core';
import { Game } from '../../models/game.interface';
import { MOCK_GAMES } from '../../mocks/games.mock';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class HomeComponent {
    // Données mock, à remplacer par un appel HTTP quand l'API sera prête
    games: Game[] = MOCK_GAMES;
}
