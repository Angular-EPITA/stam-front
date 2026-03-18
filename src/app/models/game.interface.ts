// Représente un jeu vidéo
export interface Game {
    id: string;
    title: string;
    genre: string;
    year: number;
    description: string;
    imageUrl: string;
    releaseDate?: string;
    price?: number;
}
