import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GridShape } from '../../components/common/grid-shape/grid-shape';

@Component({
  selector: 'app-auth-page-layout',
  imports: [RouterModule, GridShape],
  templateUrl: './auth-page-layout.html',
  styleUrl: './auth-page-layout.css',
})
export class AuthPageLayout {}
