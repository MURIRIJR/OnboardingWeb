import { Routes } from '@angular/router';

import { OnboardingList } from './features/onboarding/onboarding-list/onboarding-list';
import { Personal } from './features/onboarding/personal/personal';
import { Address } from './features/onboarding/address/address';
import { Review } from './features/onboarding/review/review';

export const routes: Routes = [
  { path: '', component: OnboardingList },

  // New onboarding (must stay above the :id routes)
  { path: 'onboardings/new', component: Personal },

  // Existing onboarding
  { path: 'onboardings/:id', redirectTo: 'onboardings/:id/personal', pathMatch: 'full' },
  { path: 'onboardings/:id/personal', component: Personal },
  { path: 'onboardings/:id/address', component: Address },
  { path: 'onboardings/:id/review', component: Review },

  { path: '**', redirectTo: '' }
];