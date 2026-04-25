export const Label = ({ children, required, className = '' }) => (
    <label className={`block text-sm font-medium text-ink mb-1.5 ${className}`}>
        {children}{required && <span className="text-secondary ml-0.5">*</span>}
    </label>
);

const baseCls    = "block w-full bg-white border rounded-xl px-4 py-3 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 transition";
const okCls      = "border-gray-200 focus:border-primary focus:ring-primary-soft";
const errorCls   = "border-rose-400 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/40";

const ringFor = (hasError) => `${baseCls} ${hasError ? errorCls : okCls}`;

export const Input = ({ className = '', error = false, ...rest }) => (
    <input className={`${ringFor(error)} ${className}`} aria-invalid={error || undefined} {...rest} />
);

export const Textarea = ({ className = '', rows = 4, error = false, ...rest }) => (
    <textarea rows={rows} className={`${ringFor(error)} resize-y ${className}`} aria-invalid={error || undefined} {...rest} />
);

export const Select = ({ children, className = '', error = false, ...rest }) => (
    <select className={`${ringFor(error)} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236B7280%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10 ${className}`} aria-invalid={error || undefined} {...rest}>
        {children}
    </select>
);

export const FileInput = ({ className = '', ...rest }) => (
    <input
        type="file"
        className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-soft file:text-primary-dark hover:file:bg-primary hover:file:text-white transition ${className}`}
        {...rest}
    />
);

/**
 * Field shell. Pass `error` to show a red helper line + tint the input.
 * NB: pass the error into BOTH the wrapping <Field error="..."> AND the
 * inner <Input error={!!error}>.
 */
const Field = ({ label, required, children, hint, error, className = '' }) => (
    <div className={className}>
        {label && <Label required={required}>{label}</Label>}
        {children}
        {hint && !error && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
        {error && <p role="alert" className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
);

export default Field;
