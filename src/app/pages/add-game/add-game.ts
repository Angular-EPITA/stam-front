import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-game.html',
})
export class AddGameComponent {
  private gameService = inject(GameService);
  private router = inject(Router);

  game = {
    title: '',
    description: '',
    price: 0,
    releaseDate: '',
    genreId: 1,
    imageUrl: ''
  };

  isSubmitting = false;

  onSubmit() {
    this.isSubmitting = true;
    this.gameService.addGame(this.game).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du jeu:', err);
        this.isSubmitting = false;
      }
    });
  }
}
