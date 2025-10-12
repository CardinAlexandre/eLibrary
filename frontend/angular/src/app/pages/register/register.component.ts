import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  validationError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.validationError = 'Veuillez remplir tous les champs correctement';
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    
    if (password !== confirmPassword) {
      this.validationError = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (password.length < 8) {
      this.validationError = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    this.loading = true;
    this.error = '';
    this.validationError = '';

    const { firstName, lastName, email } = this.registerForm.value;

    this.authService.register({ firstName, lastName, email, password }).subscribe({
      next: (response) => {
        this.loading = false;
        localStorage.setItem('token', response.token);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = err.error?.message || err.error?.error || 'Erreur lors de l\'inscription';
        this.loading = false;
      }
    });
  }
}

