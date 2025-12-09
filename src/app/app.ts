import { Component, signal } from '@angular/core';
import { TarefasComponent } from './components/tarefas/tarefas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ TarefasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ProjetoToDo');
}
