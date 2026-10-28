import { Component, OnInit } from '@angular/core';
import { COUNTRIES } from '../../../shared/countries';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingApi } from '../../../core/services/onboarding-api';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal.html',
  styleUrls: ['./personal.css']
})
export class Personal implements OnInit {

  nationalities = COUNTRIES;

  personalForm: FormGroup;

  personalId = 0;
  isEdit = false;
  returnTo: string | null = null;

  submitting = false;
  serviceError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private onboardingApi: OnboardingApi
  ) {

    this.personalForm = this.fb.group({
      title: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      nationality: ['', Validators.required],
      employmentStatus: ['', Validators.required],
      idType: ['', Validators.required],
      idNumber: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
      idExpiryDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9+ ]+$')]],
      occupation: ['', Validators.required]
    });

    // Remove the server "duplicate" error as soon as the user edits either field
    this.personalForm.get('idNumber')?.valueChanges
      .subscribe(() => this.clearDuplicateError());
    this.personalForm.get('idType')?.valueChanges
      .subscribe(() => this.clearDuplicateError());
  }

  ngOnInit(): void {
    this.personalId =
      Number(this.route.snapshot.paramMap.get('id')) || 0;

    this.isEdit = this.personalId > 0;

    this.returnTo =
      this.route.snapshot.queryParamMap.get('returnTo');

    if (this.isEdit) {
      localStorage.setItem('personalId', this.personalId.toString());
      this.loadPersonal();
    } else {
      localStorage.removeItem('personalId');
    }
  }

  private loadPersonal(): void {
    this.onboardingApi.getPersonal(this.personalId).subscribe({
      next: (data: any) => {
        this.personalForm.patchValue({
          ...data,
          dateOfBirth: this.toDateInput(data.dateOfBirth),
          idExpiryDate: this.toDateInput(data.idExpiryDate)
        });
      },
      error: (err: any) => {
        console.error('Error loading personal:', err);
        this.serviceError = this.isServiceDown(err)
          ? 'The service is currently unavailable. Please try again shortly.'
          : 'Failed to load Personal Information.';
      }
    });
  }

  private toDateInput(value: any): string {
    return value ? String(value).substring(0, 10) : '';
  }

  private isAdult(dateOfBirth: string): boolean {
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age >= 18;
  }

  nextStep(): void {
    this.serviceError = '';

    // Test 2: empty form shows the errors and sends no request
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    if (!this.isAdult(this.personalForm.value.dateOfBirth)) {
      alert('Client must be 18 years or older.');
      return;
    }

    const payload = this.personalForm.value;
    this.submitting = true;

    if (this.isEdit) {
      this.onboardingApi.updatePersonal(this.personalId, payload).subscribe({
        next: () => {
          this.submitting = false;
          this.goNext(this.personalId);
        },
        error: (error: any) => this.handleError(error, payload)
      });
    } else {
      this.onboardingApi.createPersonal(payload).subscribe({
        next: (response: any) => {
          this.submitting = false;
          localStorage.setItem('personalId', response.id.toString());
          this.goNext(response.id);
        },
        error: (error: any) => this.handleError(error, payload)
      });
    }
  }

  private goNext(id: number): void {
    if (this.returnTo === 'review') {
      this.router.navigate(['/onboardings', id, 'review']);
    } else {
      this.router.navigate(['/onboardings', id, 'address']);
    }
  }

  private isServiceDown(error: any): boolean {
    return error?.status === 0 || error?.status === 503;
  }

  private handleError(error: any, payload: any): void {
    this.submitting = false;

    console.error('Error saving personal:', error);
    console.error('Payload sent:', payload);

    // Test 7: duplicate ID type + number
    if (error?.status === 409) {
      const idNumber = this.personalForm.get('idNumber');
      idNumber?.setErrors({ ...(idNumber.errors ?? {}), duplicate: true });
      idNumber?.markAsTouched();
      return;
    }

    // Test 10: microservice down
    if (this.isServiceDown(error)) {
      this.serviceError =
        'The service is currently unavailable. Please try again shortly.';
      return;
    }

    this.serviceError = 'Failed to save Personal Information. Please try again.';
  }

  private clearDuplicateError(): void {
    const idNumber = this.personalForm.get('idNumber');

    if (idNumber?.hasError('duplicate')) {
      const { duplicate, ...rest } = idNumber.errors ?? {};
      idNumber.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  cancel(): void {
    if (this.returnTo === 'review' && this.personalId) {
      this.router.navigate(['/onboardings', this.personalId, 'review']);
    } else {
      this.router.navigate(['/']);
    }
  }
}