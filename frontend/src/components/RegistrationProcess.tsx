import { registrationSteps } from '../constants/data'

/**
 * RegistrationProcess
 * Shows the 4-step company registration flow in a clean timeline.
 */
export function RegistrationProcess() {
  return (
    <section className="registration-process" aria-labelledby="registration-process-title">
      <div className="registration-process-inner">
        <h2 id="registration-process-title" className="sr-only">Registration process</h2>
        <p className="registration-process-description">
          From completing forms to receiving your certificate, our guided process keeps company registration
          clear, simple, and efficient.
        </p>
        <ol className="registration-process-steps" aria-label="Company registration steps" tabIndex={0}>
          {registrationSteps.map((step) => (
            <li className="registration-process-step" key={step.number}>
              <span className="registration-step-number">{step.number}</span>
              <h3>{step.title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
