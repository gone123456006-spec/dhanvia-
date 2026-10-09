import { contactPhone } from '../constants/data'
import { callIconPath, whatsappIconPath } from '../constants/socialIcons'

const whatsappMessage = 'Hi Dhanvia, I would like to know more about your services.'

/**
 * FloatingContactButtons
 * WhatsApp and Call shortcuts pinned to the bottom-right corner of every page.
 */
export function FloatingContactButtons() {
  return (
    <div className="floating-contact">
      <a
        className="floating-contact-button floating-contact-button--whatsapp"
        href={`https://wa.me/${contactPhone.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat on WhatsApp with ${contactPhone.display}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={whatsappIconPath} /></svg>
        <span className="floating-contact-label">WhatsApp us</span>
      </a>
      <a
        className="floating-contact-button floating-contact-button--call"
        href={`tel:${contactPhone.tel}`}
        aria-label={`Call ${contactPhone.display}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={callIconPath} /></svg>
        <span className="floating-contact-label">Call {contactPhone.display}</span>
      </a>
    </div>
  )
}
