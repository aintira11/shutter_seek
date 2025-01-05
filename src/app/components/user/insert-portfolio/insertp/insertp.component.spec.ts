import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsertpComponent } from './insertp.component';

describe('InsertpComponent', () => {
  let component: InsertpComponent;
  let fixture: ComponentFixture<InsertpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsertpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsertpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
