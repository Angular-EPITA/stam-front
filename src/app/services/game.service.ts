import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
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

    private getGamesPage(page: number, size: number, filters?: { year?: number; search?: string }): Observable<GameApi[]> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

        if (filters?.year) {
            params = params.set('year', filters.year.toString());
        }
        if (filters?.search) {
            params = params.set('search', filters.search);
        }

        return this.http
            .get<PageApi<GameApi>>(`${this.baseUrl}/games`, { params })
            .pipe(map((res) => res.content ?? []));
    }

    /**
     * Récupère la liste paginée depuis l'API et la mappe vers le modèle UI `Game`.
     */
    getGames(page = 0, size = 10, filters?: { genre?: string; year?: number; search?: string }): Observable<Game[]> {
        return this.getGamesPage(page, size, { year: filters?.year, search: filters?.search }).pipe(
            map((games) => games.map((g) => this.mapGameApiToGame(g)))
        );
    }

    /**
     * Récupère tous les jeux (pagination) et mappe vers le modèle UI `Game`.
     * Utile quand un filtre (ex: genre.name) doit être appliqué côté front.
     */
    getAllGames(filters?: { year?: number; search?: string }, pageSize = 100): Observable<Game[]> {
        return this.getGamesPage(0, pageSize, filters).pipe(
            expand((items, index) => (items.length === pageSize ? this.getGamesPage(index + 1, pageSize, filters) : EMPTY)),
            reduce((acc, items) => acc.concat(items), [] as GameApi[]),
            map((raw) => raw.map((g) => this.mapGameApiToGame(g)))
        );
    }

    getLatest(): Observable<Game[]> {
        return this.http.get<unknown>(`${this.baseUrl}/games/latest`).pipe(
            map((res) => {
                const rawGames: GameApi[] = Array.isArray(res)
                    ? (res as GameApi[])
                    : (res && typeof res === 'object' && 'content' in res
                          ? ((res as PageApi<GameApi>).content ?? [])
                          : []);

                return rawGames.map((g) => this.mapGameApiToGame(g));
            })
        );
    }

    private mapGameApiToGame(g: GameApi): Game {
        return {
            id: g.id,
            title: g.title,
            description: g.description,
            imageUrl: g.imageUrl,
            genre: g.genre?.name ?? '',
            year: Number(g.releaseDate?.slice(0, 4)) || new Date(g.releaseDate).getFullYear(),
            releaseDate: g.releaseDate,
            price: g.price,
        };
    }

    getGameById(id: string): Observable<Game> {
        return this.http
            .get<GameApi>(`${this.baseUrl}/games/${id}`)
            .pipe(map((g) => this.mapGameApiToGame(g)));
    }

    addGame(game: { title: string, description: string, price: number, releaseDate: string, imageUrl: string, genreId: number }): Observable<GameApi> {
        return this.http.post<GameApi>(`${this.baseUrl}/games`, game);
    }
}
