import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AddGameComponent } from './pages/add-game/add-game';
import { GameDetailComponent } from './pages/game-detail/game-detail';
import { EditGameComponent } from './pages/edit-game/edit-game';
import { AdminComponent } from './pages/admin/admin';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'games/:id', component: GameDetailComponent },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
    { path: 'admin/add-game', component: AddGameComponent, canActivate: [authGuard] },
    { path: 'admin/games/:id/edit', component: EditGameComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' },
];
