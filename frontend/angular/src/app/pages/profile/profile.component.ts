import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthService, UserProfile, UpdateProfileDto } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  loading = false;
  editing = false;
  saving = false;
  promoting = false;
  removing = false;
  error = '';
  success = '';
  
  profileForm: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private store: Store
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', Validators.minLength(6)]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  isAdmin(): boolean {
    return this.profile?.roles.includes('Admin') || false;
  }

  isLibrarian(): boolean {
    return this.profile?.roles.includes('Librarian') || false;
  }

  enableEditing(): void {
    this.editing = true;
  }

  cancelEditing(): void {
    this.editing = false;
    if (this.profile) {
      this.profileForm.patchValue({
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        email: this.profile.email,
        currentPassword: '',
        newPassword: ''
      });
    }
    this.error = '';
  }

  saveProfile(): void {
    if (!this.profileForm.valid) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    const updateData: UpdateProfileDto = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      email: this.profileForm.value.email
    };

    if (this.profileForm.value.currentPassword && this.profileForm.value.newPassword) {
      updateData.currentPassword = this.profileForm.value.currentPassword;
      updateData.newPassword = this.profileForm.value.newPassword;
    }

    this.authService.updateProfile(updateData).subscribe({
      next: (data) => {
        this.profile = data;
        this.editing = false;
        this.success = 'Profil mis à jour avec succès !';
        this.saving = false;
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: ''
        });
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors de la mise à jour du profil';
        this.saving = false;
      }
    });
  }

  promoteToAdmin(): void {
    this.promoting = true;
    this.error = '';
    this.success = '';

    this.authService.promoteToAdmin().subscribe({
      next: (response) => {
        const newToken = response.token;
        localStorage.setItem('token', newToken);
        this.success = 'Vous êtes maintenant administrateur !';
        this.promoting = false;
        this.loadProfile();
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors de la promotion';
        this.promoting = false;
      }
    });
  }

  removeAdmin(): void {
    this.removing = true;
    this.error = '';
    this.success = '';

    this.authService.removeAdminRole().subscribe({
      next: (response) => {
        const newToken = response.token;
        localStorage.setItem('token', newToken);
        this.success = 'Rôle administrateur retiré.';
        this.removing = false;
        this.loadProfile();
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors du retrait du rôle';
        this.removing = false;
      }
    });
  }
}

