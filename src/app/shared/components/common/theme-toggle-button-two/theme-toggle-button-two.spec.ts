import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeToggleButtonTwo } from './theme-toggle-button-two';

describe('ThemeToggleButtonTwo', () => {
  let component: ThemeToggleButtonTwo;
  let fixture: ComponentFixture<ThemeToggleButtonTwo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleButtonTwo],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleButtonTwo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
