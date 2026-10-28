import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnboardingApi {

  private apiUrl = 'http://localhost:5175/api';

  constructor(private http: HttpClient) {}

  // PERSONALS

  getPersonals(): Observable<any> {
    return this.http.get(`${this.apiUrl}/personals`);
  }

  getPersonal(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/personals/${id}`);
  }

  createPersonal(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/personals`, data);
  }

  updatePersonal(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/personals/${id}`, data);
  }

  deletePersonal(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/personals/${id}`);
  }

  // ADDRESSES

  getAddresses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses`);
  }

  getAddress(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses/${id}`);
  }

  getAddressByPersonalId(personalId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/addresses/personal/${personalId}`
    );
  }

  createAddress(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addresses`, data);
  }

  updateAddress(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/addresses/${id}`, data);
  }

  deleteAddress(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/addresses/${id}`);
  }

  // ONBOARDINGS

  getOnboardings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/onboardings`);
  }

  createOnboarding(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/onboardings`, data);
  }

  updateOnboarding(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/onboardings/${id}`, data);
  }
}