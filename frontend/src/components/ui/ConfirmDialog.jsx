import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * In-app replacement for window.confirm — styled like the rest of the app
 * instead of the browser's native "localhost says" dialog.
 */
const ConfirmDialog = ({
    open, onClose, onConfirm,
    title = 'Are you sure?', body,
    confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    tone = 'danger', busy = false,
}) => (
    <Modal
        open={open}
        onClose={busy ? undefined : onClose}
        title={title}
        size="sm"
        footer={[
            <Button key="cancel" variant="outline" size="sm" onClick={onClose} disabled={busy}>{cancelLabel}</Button>,
            <Button
                key="confirm" size="sm" onClick={onConfirm} disabled={busy}
                className={tone === 'danger' ? '!bg-rose-600 hover:!bg-rose-700' : ''}
            >
                {busy ? 'Working…' : confirmLabel}
            </Button>,
        ]}
    >
        <div className="flex items-start gap-3">
            {tone === 'danger' && (
                <div className="shrink-0 w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" strokeWidth={2} />
                </div>
            )}
            <p className="text-sm text-gray-600 whitespace-pre-line">{body}</p>
        </div>
    </Modal>
);

export default ConfirmDialog;
