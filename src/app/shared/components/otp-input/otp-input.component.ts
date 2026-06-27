/**
 * 6-box OTP input with auto-advance and backspace handling.
 * Emits complete(value: string) when all 6 digits are filled.
 */
import { Component, EventEmitter, Output, ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-3 justify-center">
      <input
        *ngFor="let box of boxes; let i = index"
        #otpBox
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg
               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
               transition-colors"
        [class.border-primary]="values[i]"
        (keydown)="onKeyDown($event, i)"
        (input)="onInput($event, i)"
        (paste)="onPaste($event)"
      />
    </div>
  `
})
export class OtpInputComponent {
  @Output() complete = new EventEmitter<string>();
  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  boxes = [0, 1, 2, 3, 4, 5];
  values: string[] = ['', '', '', '', '', ''];

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.values[index] = val;
    input.value = val;
    if (val && index < 5) {
      this.focusBox(index + 1);
    }
    this.emitIfComplete();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.values[index] && index > 0) {
        this.values[index - 1] = '';
        this.focusBox(index - 1);
      } else {
        this.values[index] = '';
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) this.focusBox(index - 1);
    if (event.key === 'ArrowRight' && index < 5) this.focusBox(index + 1);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => { this.values[i] = d; });
    const boxes = this.otpBoxes.toArray();
    digits.forEach((d, i) => { boxes[i].nativeElement.value = d; });
    this.focusBox(Math.min(digits.length, 5));
    this.emitIfComplete();
  }

  reset(): void {
    this.values = ['', '', '', '', '', ''];
    this.otpBoxes.toArray().forEach(b => { b.nativeElement.value = ''; });
    this.focusBox(0);
  }

  private focusBox(index: number): void {
    const boxes = this.otpBoxes.toArray();
    boxes[index]?.nativeElement.focus();
  }

  private emitIfComplete(): void {
    if (this.values.every(v => v !== '')) {
      this.complete.emit(this.values.join(''));
    }
  }
}
