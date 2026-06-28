import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-24">
      <img src="assets/logo.jpg" alt="CIC" class="w-16 h-16 rounded-xl animate-pulse" />
    </div>
  `
})
export class LoadingComponent {}
