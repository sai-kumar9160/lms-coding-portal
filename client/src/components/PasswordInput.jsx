import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({ id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  return <span className="password-input">
    <input {...props} id={inputId} type={visible ? 'text' : 'password'}/>
    <button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} aria-controls={inputId} disabled={props.disabled} onClick={() => setVisible(value => !value)}>
      {visible ? <EyeOff size={19}/> : <Eye size={19}/>}
    </button>
  </span>;
}
