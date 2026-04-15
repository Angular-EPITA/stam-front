import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';
import { Genre } from '../../models/genre.interface';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-game.html',
})
export class AddGameComponent {
  private gameService = inject(GameService);
  private router = inject(Router);

  genres: Genre[] = [];

  game = {
    title: '',
    description: '',
    price: 0,
    releaseDate: '',
    genreId: 1,
    imageUrl: ''
  };

  isSubmitting = false;

  constructor() {
    this.gameService.getGenres().subscribe({
      next: (genres) => {
        this.genres = genres;
        if (this.genres.length > 0 && !this.genres.some((g) => g.id === this.game.genreId)) {
          this.game.genreId = this.genres[0].id;
        }
      },
      error: (err) => console.error('Erreur lors du chargement des genres', err),
    });
  }

  onSubmit() {
    this.isSubmitting = true;
    this.gameService.addGame(this.game).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/'], { queryParams: { message: 'Jeu ajouté.' } });
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du jeu:', err);
        this.isSubmitting = false;
      }
    });
  }
}
