import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-onboarding-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './onboarding-list.html',
  styleUrls: ['./onboarding-list.css']
})
export class OnboardingList implements OnInit {

  onboardings = signal<any[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  searchText = signal('');
  statusFilter = signal('All');

  currentPage = signal(1);
  pageSize = 10;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOnboardings();
  }

  loadOnboardings(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<any[]>('http://localhost:5175/api/personals').subscribe({
      next: (data) => {
        const rows = (data || []).map(p => {
          const submitted = !!(p.submittedAt ?? p.submitted_at);
          const status = submitted
            ? 'SUBMITTED'
            : (p.status ?? 'DRAFT').toString().toUpperCase();

          const step: number = submitted
            ? 3
            : Number(p.currentStep ?? p.current_step ?? p.step ?? 2);

          return {
            ...p,
            status,
            step,
            lastUpdated:
              p.submittedAt ?? p.submitted_at ?? p.updatedAt ?? p.updated_at ?? null
          };
        });

        this.onboardings.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API ERROR:', err);
        this.errorMessage.set(
          this.isServiceDown(err)
            ? 'The service is currently unavailable. Please try again shortly.'
            : 'Failed to load onboarding records'
        );
        this.loading.set(false);
      }
    });
  }

  private isServiceDown(error: any): boolean {
    return error?.status === 0 || error?.status === 503;
  }

  openOnboarding(item: any): void {
    console.log('Opening onboarding:', item.id, 'step:', item.step);

    localStorage.setItem('personalId', item.id.toString());

    const page =
      item.status === 'SUBMITTED' || item.step >= 3
        ? 'review'
        : item.step === 2
          ? 'address'
          : 'personal';

    this.router.navigate(['/onboardings', item.id, page]);
  }

  deleteOnboarding(id: number): void {
    if (!confirm('Are you sure you want to delete this onboarding?')) {
      return;
    }

    this.http.delete(`http://localhost:5175/api/personals/${id}`).subscribe({
      next: () => {
        if (localStorage.getItem('personalId') === String(id)) {
          localStorage.removeItem('personalId');
        }

        this.loadOnboardings();

        const remaining = this.onboardings().filter(r => r.id !== id).length;
        const lastPage = Math.max(1, Math.ceil(remaining / this.pageSize));

        if (this.currentPage() > lastPage) {
          this.currentPage.set(lastPage);
        }
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set(
          this.isServiceDown(error)
            ? 'The service is currently unavailable. Please try again shortly.'
            : 'Failed to delete record'
        );
      }
    });
  }

  filteredOnboardings = computed(() => {
    const term = this.searchText().trim().toLowerCase();
    const status = this.statusFilter().toUpperCase();

    return this.onboardings().filter(record => {
      const name =
        `${record.firstName ?? ''} ${record.lastName ?? ''}`.toLowerCase();

      const idNumber = (record.idNumber ?? '').toString().toLowerCase();

      const matchesSearch =
        !term || name.includes(term) || idNumber.includes(term);

      const matchesStatus = status === 'ALL' || record.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  pagedOnboardings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOnboardings().slice(start, start + this.pageSize);
  });

  startRecord = computed(() =>
    this.filteredOnboardings().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize + 1
  );

  endRecord = computed(() =>
    Math.min(
      this.currentPage() * this.pageSize,
      this.filteredOnboardings().length
    )
  );

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() * this.pageSize < this.filteredOnboardings().length) {
      this.currentPage.update(page => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }
}