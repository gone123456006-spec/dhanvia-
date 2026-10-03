import { registrationSteps } from '../constants/data'
import { ProcessIllustration } from './ProcessIllustration'

/**
 * RegistrationProcess
 * Shows the 4-step company registration flow with illustrated cards.
 */
export function RegistrationProcess() {
  return (
    <section className="registration-process" aria-labelledby="registration-process-title">
      <div className="registration-process-inner">
        <div className="registration-process-header">
          <h2 id="registration-process-title">Registration</h2>
          <h3 className="registration-process-subheading">In 4 Easy Steps</h3>
        </div>
        <p className="registration-process-description">
          From completing forms to receiving your certificate, our guided process keeps company registration
          clear, simple, and efficient.
        </p>
        <ol className="registration-process-steps" aria-label="Company registration steps" tabIndex={0}>
          {registrationSteps.map((step, index) => (
            <li className="registration-process-step" key={step.number}>
              <span className="registration-step-number">{step.number}</span>
              {index < registrationSteps.length - 1 && (
                <span className="registration-step-arrow" aria-hidden="true">→</span>
              )}
              <div className="registration-step-art">
                <ProcessIllustration kind={step.kind} />
              </div>
              <h3>{step.title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
