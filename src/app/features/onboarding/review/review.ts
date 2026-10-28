import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { OnboardingApi } from '../../../core/services/onboarding-api';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './review.html',
  styleUrls: ['./review.css']
})
export class Review implements OnInit {

  personal: any = {};
  address: any = {};
  postal: any = null;
  personalId = 0;

  submitting = false;
  serviceError = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private onboardingApi: OnboardingApi,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const fromUrl = Number(this.route.snapshot.paramMap.get('id'));
    this.personalId = fromUrl || Number(localStorage.getItem('personalId'));

    if (!this.personalId) {
      this.router.navigate(['/onboardings/new']);
      return;
    }

    localStorage.setItem('personalId', String(this.personalId));
    this.loadPersonal(this.personalId);
    this.loadAddress(this.personalId);
  }

  loadPersonal(id: number): void {
    this.onboardingApi.getPersonal(id).subscribe({
      next: (data: any) => {
        this.personal = { ...data };
        this.cdr.detectChanges();
      },
      error: (err: any) => this.handleLoadError('personal', err)
    });
  }

  loadAddress(id: number): void {
    this.onboardingApi.getAddressByPersonalId(id).subscribe({
      next: (data: any) => {
        const rows: any[] = Array.isArray(data) ? data : data ? [data] : [];

        const residential = rows.find(r =>
          (r.addressType ?? 'RESIDENTIAL').toString().toUpperCase() === 'RESIDENTIAL'
        );

        const postal = rows.find(r =>
          (r.addressType ?? '').toString().toUpperCase() === 'POSTAL'
        );

        this.address = residential ? { ...residential } : {};
        this.postal = postal ? { ...postal } : null;
        this.cdr.detectChanges();
      },
      error: (err: any) => this.handleLoadError('address', err)
    });
  }

  get hasAddress(): boolean {
    return !!this.address?.addressLine1;
  }

  back(): void {
    this.router.navigate(['/onboardings', this.personalId, 'address']);
  }

  submit(): void {
    this.serviceError = '';
    this.submitting = true;

    this.http
      .post(`http://localhost:5175/api/personals/${this.personalId}/submit`, {})
      .subscribe({
        next: () => {
          this.submitting = false;
          localStorage.removeItem('personalId');
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          this.submitting = false;
          console.error('Error submitting onboarding:', err);

          this.serviceError = this.isServiceDown(err)
            ? 'The service is currently unavailable. Please try again shortly.'
            : 'Failed to submit the onboarding. Please try again.';

          this.cdr.detectChanges();
        }
      });
  }

  private isServiceDown(error: any): boolean {
    return error?.status === 0 || error?.status === 503;
  }

  private handleLoadError(what: string, err: any): void {
    if (what === 'address' && err?.status === 404) {
      return;
    }

    console.error(`Error loading ${what}:`, err);

    this.serviceError = this.isServiceDown(err)
      ? 'The service is currently unavailable. Please try again shortly.'
      : `Failed to load ${what} information.`;

    this.cdr.detectChanges();
  }
}