import { TestBed } from '@angular/core/testing';
import { OnboardingApi } from './onboarding-api';

describe('OnboardingApi', () => {
  let service: OnboardingApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnboardingApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
