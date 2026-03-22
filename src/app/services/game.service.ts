import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Game } from '../models/game.interface';
import { environment } from '../../environments/environment';

interface GenreApi {
    id: number;
    name: string;
}

interface GameApi {
    id: string;
    title: string;
    description: string;
    releaseDate: string; // YYYY-MM-DD
    price: number;
    imageUrl: string;
    genre: GenreApi;
}

interface PageApi<T> {
    content: T[];
}

@Injectable({ providedIn: 'root' })
export class GameService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl = environment.apiUrl;

    /**
     * Récupère la liste paginée depuis l'API et la mappe vers le modèle UI `Game`.
     */
    getGames(page = 0, size = 10): Observable<Game[]> {
        return this.http
            .get<PageApi<GameApi>>(`${this.baseUrl}/games`, {
                params: { page, size },
            })
            .pipe(
                map((res) =>
                    (res.content ?? []).map((g) => ({
                        id: g.id,
                        title: g.title,
                        description: g.description,
                        imageUrl: g.imageUrl,
                        genre: g.genre?.name ?? '',
                        year: Number(g.releaseDate?.slice(0, 4)) || new Date(g.releaseDate).getFullYear(),
                        releaseDate: g.releaseDate,
                        price: g.price,
                    }))
                )
            );
    }

    getLatest(): Observable<Game[]> {
        return this.http
            .get<GameApi[]>(`${this.baseUrl}/games/latest`)
            .pipe(
                map((games) =>
                    games.map((g) => ({
                        id: g.id,
                        title: g.title,
                        description: g.description,
                        imageUrl: g.imageUrl,
                        genre: g.genre?.name ?? '',
                        year: Number(g.releaseDate?.slice(0, 4)) || new Date(g.releaseDate).getFullYear(),
                        releaseDate: g.releaseDate,
                        price: g.price,
                    }))
                )
            );
    }

    addGame(game: { title: string, description: string, price: number, releaseDate: string, imageUrl: string, genreId: number }): Observable<GameApi> {
        return this.http.post<GameApi>(`${this.baseUrl}/games`, game);
    }
}
