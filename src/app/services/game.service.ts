import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
import { Game } from '../models/game.interface';
import { Genre } from '../models/genre.interface';
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
    number: number;
    size: number;
    totalPages: number;
    totalElements: number;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class GameService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl = environment.apiUrl;

    private getGamesPage(
        page: number,
        size: number,
        filters?: { genreId?: number; year?: number; search?: string; maxPrice?: number }
    ): Observable<PageApi<GameApi>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

        if (typeof filters?.genreId === 'number') params = params.set('genreId', filters.genreId.toString());
        if (typeof filters?.year === 'number') params = params.set('year', filters.year.toString());
        if (filters?.search) params = params.set('search', filters.search);
        if (typeof filters?.maxPrice === 'number') params = params.set('maxPrice', filters.maxPrice.toString());

        return this.http.get<PageApi<GameApi>>(`${this.baseUrl}/games`, { params });
    }

    /**
     * Récupère une page depuis l'API et la mappe vers le modèle UI `Game`.
     */
    getGamesPaged(
        page = 0,
        size = 12,
        filters?: { genreId?: number; year?: number; search?: string; maxPrice?: number }
    ): Observable<PagedResult<Game>> {
        return this.getGamesPage(page, size, filters).pipe(
            map((res) => ({
                items: (res.content ?? []).map((g) => this.mapGameApiToGame(g)),
                page: res.number ?? page,
                size: res.size ?? size,
                totalPages: res.totalPages ?? 1,
                totalElements: res.totalElements ?? (res.content?.length ?? 0),
            }))
        );
    }

    /**
     * Récupère tous les jeux (pagination) et mappe vers le modèle UI `Game`.
     * Utile quand un filtre (ex: genre.name) doit être appliqué côté front.
     */
    getAllGames(filters?: { genreId?: number; year?: number; search?: string; maxPrice?: number }, pageSize = 100): Observable<Game[]> {
        return this.getGamesPage(0, pageSize, filters).pipe(
            map((res) => res.content ?? []),
            expand((items, index) => (items.length === pageSize
                ? this.getGamesPage(index + 1, pageSize, filters).pipe(map((r) => r.content ?? []))
                : EMPTY)),
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

    getGameById(id: string): Observable<Game> {
        return this.http.get<GameApi>(`${this.baseUrl}/games/${id}`).pipe(map((g) => this.mapGameApiToGame(g)));
    }

    getGenres(): Observable<Genre[]> {
        return this.http.get<GenreApi[]>(`${this.baseUrl}/genres`).pipe(
            map((genres) => (genres ?? []).map((g) => ({ id: g.id, name: g.name })))
        );
    }

    private mapGameApiToGame(g: GameApi): Game {
        return {
            id: g.id,
            title: g.title,
            description: g.description,
            imageUrl: g.imageUrl,
            genre: g.genre?.name ?? '',
            genreId: g.genre?.id ?? 0,
            year: Number(g.releaseDate?.slice(0, 4)) || new Date(g.releaseDate).getFullYear(),
            releaseDate: g.releaseDate,
            price: g.price,
        };
    }

    addGame(game: { title: string; description: string; price: number; releaseDate: string; imageUrl: string; genreId: number }): Observable<GameApi> {
        return this.http.post<GameApi>(`${this.baseUrl}/games`, game);
    }

    updateGame(
        id: string,
        game: { title: string; description: string; price: number; releaseDate: string; imageUrl: string; genreId: number }
    ): Observable<GameApi> {
        return this.http.put<GameApi>(`${this.baseUrl}/games/${id}`, game);
    }

    deleteGame(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/games/${id}`);
    }
}
