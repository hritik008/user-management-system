import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  captchaSvg: SafeHtml = '';
  returnUrl: string = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      captcha: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.loadCaptcha();
  }

  get f() {
    return this.loginForm.controls;
  }

  loadCaptcha(): void {
    this.authService.getCaptcha().subscribe({
      next: (response) => {
        if (response.success) {
          this.captchaSvg = this.sanitizer.bypassSecurityTrustHtml(response.captcha);
        }
      },
      error: (error) => {
        this.error = 'Failed to load CAPTCHA';
      }
    });
  }

  refreshCaptcha(): void {
    this.loginForm.patchValue({ captcha: '' });
    this.loadCaptcha();
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const { username, password, captcha } = this.loginForm.value;

    this.authService.login(username, password, captcha).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Login failed. Please try again.';
        this.loading = false;
        this.refreshCaptcha();
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
