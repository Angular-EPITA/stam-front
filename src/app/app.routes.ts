import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AddGameComponent } from './pages/add-game/add-game';
import { AdminComponent } from './pages/admin/admin';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'add-game', component: AddGameComponent },
    { path: 'admin', component: AdminComponent },
];
