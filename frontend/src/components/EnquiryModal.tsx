import { useEffect, useRef } from 'react'
import { contactPhone } from '../constants/data'
import { useLeadSubmission } from '../hooks/useLeadSubmission'
import { HoneypotField } from './HoneypotField'

interface EnquiryModalProps {
  /** Product the visitor asked about, e.g. "Home Loan"; saved as the lead's service. */
  service: string
  group: string
  onClose: () => void
}

/**
 * EnquiryModal
 * Popup offering two ways to enquire about a product: WhatsApp or the enquiry form.
 */
export function EnquiryModal({ service, group, onClose }: EnquiryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { state, message, handleSubmit } = useLeadSubmission('other')
  const whatsappText = `Hi Dhanvia, I would like to know more about ${service} (${group}).`
  const whatsappHref = `https://wa.me/${contactPhone.whatsapp}?text=${encodeURIComponent(whatsappText)}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    // No dialog.close() here: it fires the close event, which would call onClose and dismiss the
    // popup straight after React's development double-mount. Unmounting removes the dialog anyway.
    return () => {
      document.documentElement.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="enquiry-modal"
      aria-labelledby="enquiry-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="enquiry-modal-panel">
        <button className="enquiry-modal-close" type="button" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        <p className="enquiry-modal-eyebrow">{group}</p>
        <h2 id="enquiry-modal-title">Enquire about {service}</h2>
        <p className="enquiry-modal-lead">Choose how you would like to reach us. Our team usually replies within a few hours.</p>

        <a className="enquiry-modal-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z" />
          </svg>
          <span>
            <strong>Chat on WhatsApp</strong>
            <small>{contactPhone.display}</small>
          </span>
        </a>

        <p className="enquiry-modal-divider"><span>or send an enquiry</span></p>

        {state === 'success' ? (
          <div className="enquiry-modal-success" role="status">
            <strong>Enquiry sent</strong>
            <p>{message}</p>
            <button type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="enquiry-modal-form" onSubmit={handleSubmit}>
            <HoneypotField />
            <input type="hidden" name="service" value={service} />

            <label htmlFor="enquiry-name">Full name*</label>
            <input id="enquiry-name" name="name" type="text" placeholder="Enter your name" autoComplete="name" required />

            <label htmlFor="enquiry-phone">Phone number*</label>
            <div className="enquiry-modal-phone">
              <select aria-label="Country calling code" name="callingCode" defaultValue="+91">
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
              </select>
              <input id="enquiry-phone" name="phone" type="tel" placeholder="Enter your phone number" autoComplete="tel-national" inputMode="tel" required />
            </div>

            <label htmlFor="enquiry-email">Email <span className="enquiry-modal-optional">(optional)</span></label>
            <input id="enquiry-email" name="email" type="email" placeholder="Enter your email" autoComplete="email" />

            <button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? 'Sending…' : 'Send enquiry'}
            </button>
            {state === 'error' && <p className="enquiry-modal-error" role="alert">{message}</p>}
          </form>
        )}
      </div>
    </dialog>
  )
}
