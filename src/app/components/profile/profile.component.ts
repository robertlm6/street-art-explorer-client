import {Component, OnInit} from '@angular/core';
import {ProfileService, UserAppDto} from '../../services/profile.service';
import {CloudinaryService} from '../../services/cloudinary.service';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  me?: UserAppDto;
  form!: FormGroup;
  fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="100%" height="100%" fill="%23ddd"/></svg>';

  constructor(private profile: ProfileService, private cloud: CloudinaryService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      bio: ['']
    });

    this.profile.getProfile().subscribe(u => {
      this.me = u;
      this.form.patchValue({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        bio: u.bio ?? ''
      });
    });
  }

  save(): void {
    this.profile.patchProfile(this.form.value).subscribe(u => this.me = u);
  }

  changeAvatar(): void {
    this.cloud.openUploadWidget(
      { folder: 'avatars', multiple: false, maxFiles: 1 },
      (info) => {
        const body = {
          avatarUrl: info.secure_url,
          avatarPublicId: info.public_id
        };
        this.profile.patchProfile(body).subscribe(u => this.me = u);
      }
    );
  }

  removeAvatar(): void {
    this.profile.patchProfile({ avatarUrl: '', avatarPublicId: '' })
      .subscribe(u => this.me = u);
  }
}
