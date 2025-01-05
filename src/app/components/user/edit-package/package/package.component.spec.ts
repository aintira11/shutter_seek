import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:src/app/components/shutter/shutt_register/register.component.spec.ts
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
========
import { PackageComponent } from './package.component';

describe('PackageComponent', () => {
  let component: PackageComponent;
  let fixture: ComponentFixture<PackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackageComponent);
>>>>>>>> 6bf1da5 (test):src/app/components/user/edit-package/package/package.component.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
