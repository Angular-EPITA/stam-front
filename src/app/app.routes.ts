import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AddGameComponent } from './pages/add-game/add-game';
import { GameDetailComponent } from './pages/game-detail/game-detail';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'add-game', component: AddGameComponent },
    { path: 'games/:id', component: GameDetailComponent },
];
