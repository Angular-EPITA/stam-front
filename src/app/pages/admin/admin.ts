import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Game } from '../../models/game.interface';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './admin.html',
    styleUrl: './admin.scss',
})
export class AdminComponent implements OnInit {
    private readonly gameService = inject(GameService);

    games: Game[] = [];
    loading = true;
    successMessage = '';

    // Édition
    editingGameId: string | null = null;
    editForm = {
        title: '',
        description: '',
        price: 0,
        releaseDate: '',
        imageUrl: '',
        genreId: 1,
    };
    editSubmitting = false;

    ngOnInit(): void {
        this.loadGames();
    }

    loadGames(): void {
        this.loading = true;
        this.gameService.getAllGames().subscribe({
            next: (games) => {
                this.games = games;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur lors du chargement des jeux', err);
                this.loading = false;
            },
        });
    }

    deleteGame(game: Game): void {
        const confirmed = confirm(`Voulez-vous vraiment supprimer "${game.title}" ?`);
        if (!confirmed) return;

        this.gameService.deleteGame(game.id).subscribe({
            next: () => {
                this.games = this.games.filter((g) => g.id !== game.id);
                this.showSuccess(`"${game.title}" a été supprimé.`);
            },
            error: (err) => console.error('Erreur lors de la suppression', err),
        });
    }

    startEdit(game: Game): void {
        this.editingGameId = game.id;
        this.editForm = {
            title: game.title,
            description: game.description,
            price: game.price,
            releaseDate: game.releaseDate,
            imageUrl: game.imageUrl,
            genreId: 1,
        };
    }

    cancelEdit(): void {
        this.editingGameId = null;
    }

    submitEdit(): void {
        if (!this.editingGameId) return;
        this.editSubmitting = true;

        this.gameService.updateGame(this.editingGameId, this.editForm).subscribe({
            next: (updatedGame) => {
                const index = this.games.findIndex((g) => g.id === this.editingGameId);
                if (index !== -1) {
                    this.games[index] = updatedGame;
                }
                this.showSuccess(`"${updatedGame.title}" a été mis à jour.`);
                this.editingGameId = null;
                this.editSubmitting = false;
            },
            error: (err) => {
                console.error('Erreur lors de la mise à jour', err);
                this.editSubmitting = false;
            },
        });
    }

    private showSuccess(message: string): void {
        this.successMessage = message;
        setTimeout(() => (this.successMessage = ''), 3000);
    }
}
