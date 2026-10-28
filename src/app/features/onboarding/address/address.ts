import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { OnboardingApi } from '../../../core/services/onboarding-api';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address.html',
  styleUrls: ['./address.css']
})
export class Address implements OnInit {

  countries = ['Namibia', 'South Africa', 'Botswana', 'Angola', 'Zambia', 'Other'];

  addressForm: FormGroup;
  postalForm: FormGroup;
  sameAsResidential = new FormControl(true);

  personalId = 0;
  residentialId = 0;
  postalId = 0;
  returnTo: string | null = null;

  submitting = false;
  serviceError = '';

  private readonly addressFields = [
    'addressLine1',
    'addressLine2',
    'suburbArea',
    'cityTown',
    'districtState',
    'postalCode',
    'country'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private onboardingApi: OnboardingApi
  ) {

    this.addressForm = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      suburbArea: [''],
      cityTown: ['', Validators.required],
      districtState: [''],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      residentialStatus: ['', Validators.required]
    });

    this.postalForm = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      suburbArea: [''],
      cityTown: ['', Validators.required],
      districtState: [''],
      postalCode: ['', Validators.required],
      country: ['', Validators.required]
    });

    // Postal fields are only validated when the box is unticked
    this.postalForm.disable();

    this.sameAsResidential.valueChanges.subscribe(same => {
      if (same) {
        this.postalForm.disable();
      } else {
        this.postalForm.enable();
      }
    });
  }

  ngOnInit(): void {

    const fromUrl = Number(this.route.snapshot.paramMap.get('id'));

    this.personalId =
      fromUrl || Number(localStorage.getItem('personalId'));

    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (!this.personalId) {
      alert('Personal record not found.');
      this.router.navigate(['/onboardings/new']);
      return;
    }

    localStorage.setItem('personalId', String(this.personalId));

    this.loadAddress();
  }

  private loadAddress(): void {

    this.onboardingApi
      .getAddressByPersonalId(this.personalId)
      .subscribe({

        next: (data: any) => {

          const rows: any[] = Array.isArray(data) ? data : data ? [data] : [];

          const residential = rows.find(r =>
            (r.addressType ?? 'RESIDENTIAL').toString().toUpperCase() === 'RESIDENTIAL'
          );

          const postal = rows.find(r =>
            (r.addressType ?? '').toString().toUpperCase() === 'POSTAL'
          );

          if (residential?.id) {
            this.residentialId = residential.id;
            this.addressForm.patchValue(residential);
          }

          if (postal?.id) {
            this.postalId = postal.id;
            this.postalForm.patchValue(postal);

            const same = this.addressFields.every(
              f => (residential?.[f] ?? '') === (postal?.[f] ?? '')
            );

            this.sameAsResidential.setValue(same);
          }
        },

        error: (err: any) => {
          if (err.status === 404) {
            return;
          }

          console.error('Error loading address:', err);

          this.serviceError = this.isServiceDown(err)
            ? 'The service is currently unavailable. Please try again shortly.'
            : 'Failed to load address information.';
        }

      });
  }

  nextStep(): void {

    this.serviceError = '';

    const same = !!this.sameAsResidential.value;

    if (this.addressForm.invalid || (!same && this.postalForm.invalid)) {
      this.addressForm.markAllAsTouched();
      this.postalForm.markAllAsTouched();
      return;
    }

    const residentialValues = this.addressForm.value;

    const residentialPayload = {
      ...residentialValues,
      addressType: 'RESIDENTIAL',
      personalId: this.personalId
    };

    const postalSource = same
      ? this.pick(residentialValues)
      : this.postalForm.getRawValue();

    const postalPayload = {
      ...postalSource,
      residentialStatus: residentialValues.residentialStatus,
      addressType: 'POSTAL',
      personalId: this.personalId
    };

    this.submitting = true;

    // Save residential first, then postal, remembering ids as we go
    this.save(this.residentialId, residentialPayload).pipe(
      tap((res: any) => {
        if (res?.id) {
          this.residentialId = res.id;
        }
      }),
      switchMap(() => this.save(this.postalId, postalPayload)),
      tap((res: any) => {
        if (res?.id) {
          this.postalId = res.id;
        }
      })
    ).subscribe({
      next: () => {
        this.submitting = false;
        this.goToReview();
      },
      error: (error: any) => this.handleError(error)
    });
  }

  private save(id: number, payload: any) {
    return id
      ? this.onboardingApi.updateAddress(id, { id, ...payload })
      : this.onboardingApi.createAddress(payload);
  }

  private pick(source: any): any {
    const result: any = {};
    this.addressFields.forEach(f => (result[f] = source[f] ?? ''));
    return result;
  }

  private goToReview(): void {
    this.router.navigate(['/onboardings', this.personalId, 'review']);
  }

  private isServiceDown(error: any): boolean {
    return error?.status === 0 || error?.status === 503;
  }

  private handleError(error: any): void {

    this.submitting = false;

    console.error('Error saving address:', error);

    this.serviceError = this.isServiceDown(error)
      ? 'The service is currently unavailable. Please try again shortly.'
      : 'Failed to save address information. Please try again.';
  }

  isInvalid(controlName: string, group: FormGroup = this.addressForm): boolean {

    const control = group.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  errorOf(controlName: string, group: FormGroup = this.addressForm): string {

    const control = group.get(controlName);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }

    if (control.errors['minlength']) {
      return 'Value is too short';
    }

    if (control.errors['maxlength']) {
      return 'Value is too long';
    }

    if (control.errors['pattern']) {
      return 'Invalid format';
    }

    return 'Invalid value';
  }

  back(): void {

    if (this.returnTo === 'review') {
      this.router.navigate(['/onboardings', this.personalId, 'review']);
    } else {
      this.router.navigate(['/onboardings', this.personalId, 'personal']);
    }
  }

}