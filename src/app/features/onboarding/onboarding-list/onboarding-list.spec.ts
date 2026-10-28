import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-onboarding-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './onboarding-list.html',
  styleUrl: './onboarding-list.css'
})
export class OnboardingList {
}