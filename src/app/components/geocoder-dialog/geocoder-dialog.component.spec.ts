import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeocoderDialogComponent } from './geocoder-dialog.component';

describe('GeocoderDialogComponent', () => {
  let component: GeocoderDialogComponent;
  let fixture: ComponentFixture<GeocoderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeocoderDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeocoderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
