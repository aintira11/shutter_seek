import { ComponentFixture, TestBed } from '@angular/core/testing';

import { shutt_RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: shutt_RegisterComponent;
  let fixture: ComponentFixture<shutt_RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [shutt_RegisterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(shutt_RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
