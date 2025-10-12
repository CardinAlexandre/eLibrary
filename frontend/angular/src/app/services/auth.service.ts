import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/login`, { email, password });
  }

  register(data: { email: string; password: string; firstName: string; lastName: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register`, data);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/api/auth/profile`, { headers: this.getHeaders() });
  }

  updateProfile(data: UpdateProfileDto): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/api/auth/profile`, data, { headers: this.getHeaders() });
  }

  promoteToAdmin(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/promote-admin`, {}, { headers: this.getHeaders() });
  }

  removeAdminRole(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/remove-admin`, {}, { headers: this.getHeaders() });
  }
}

