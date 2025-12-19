import { Routes } from '@angular/router';
import { RegistroClienteComponent } from './components/registro-cliente/registro-cliente.component';

export const routes: Routes = [
  { path: '', component: RegistroClienteComponent },
  { path: '**', redirectTo: '' }
];
