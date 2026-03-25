import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AddGameComponent } from './pages/add-game/add-game';
import { GameDetailComponent } from './pages/game-detail/game-detail';
import { EditGameComponent } from './pages/edit-game/edit-game';
import { AdminComponent } from './pages/admin/admin';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'games/:id', component: GameDetailComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'admin/add-game', component: AddGameComponent },
    { path: 'admin/games/:id/edit', component: EditGameComponent },
];
