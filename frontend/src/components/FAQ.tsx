import type { FaqItem } from '../constants/faqs'

interface FAQProps {
  items: FaqItem[]
}

/**
 * FAQ
 * Accordion-style list of frequently asked questions using native
 * `<details>` / `<summary>` elements for zero-JS accessibility.
 */
export function FAQ({ items }: FAQProps) {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="faq-inner section-wrap">
        <h2 className="faq-title" id="faq-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {items.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>
                {question}
                <span aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
