'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type NativeInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Password input with a per-field show/hide toggle.
 *
 * - Toggle is purely visual — type swaps between 'password' and 'text', native
 *   browser autofill behavior is preserved (input still has the right
 *   autoComplete value).
 * - aria-pressed reflects state for assistive tech; aria-label flips between
 *   "Show password" / "Hide password".
 * - Each mounted PasswordInput owns its own visibility state, so toggling
 *   "New password" does not toggle "Confirm password" on /reset-password.
 */
export function PasswordInput({ className = '', ...props }: NativeInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={`w-full px-3 py-2 pr-11 rounded bg-brand-navyDeep text-brand-white border border-brand-borderLight/20 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={inputId}
        className="absolute inset-y-0 right-0 px-3 flex items-center text-brand-textMuted hover:text-brand-white rounded-r focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="w-4 h-4" />
        ) : (
          <Eye aria-hidden="true" className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
