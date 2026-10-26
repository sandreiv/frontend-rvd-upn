import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridShape } from './grid-shape';

describe('GridShape', () => {
  let component: GridShape;
  let fixture: ComponentFixture<GridShape>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridShape],
    }).compileComponents();

    fixture = TestBed.createComponent(GridShape);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
