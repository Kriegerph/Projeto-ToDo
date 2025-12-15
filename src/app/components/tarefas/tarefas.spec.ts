import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarefasComponent } from './tarefas';

describe('Tarefas', () => {
  let component: TarefasComponent;
  let fixture: ComponentFixture<TarefasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarefasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarefasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
