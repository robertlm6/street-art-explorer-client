import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerDetailComponent } from './marker-detail.component';

describe('MarkerDetailComponent', () => {
  let component: MarkerDetailComponent;
  let fixture: ComponentFixture<MarkerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
