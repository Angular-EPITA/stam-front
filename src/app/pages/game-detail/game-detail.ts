import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Game } from '../../models/game.interface';
import { GameService } from '../../services/game.service';

@Component({
    selector: 'app-game-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './game-detail.html',
    styleUrl: './game-detail.scss',
})
export class GameDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly gameService = inject(GameService);

    game: Game | null = null;
    loading = true;
    error = false;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.loading = false;
            this.error = true;
            return;
        }

        this.gameService.getGameById(id).subscribe({
            next: (game) => {
                this.game = game;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.error = true;
            },
        });
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
