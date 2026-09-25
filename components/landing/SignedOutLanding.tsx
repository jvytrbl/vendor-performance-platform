import SignInButton from "@/components/auth/SignInButton";
import LandingMarkField from "@/components/landing/LandingMarkField";
import LandingPointMark from "@/components/landing/LandingPointMark";

export default function SignedOutLanding() {
  return (
    <div className="landing min-h-dvh overflow-y-auto bg-cream lg:h-dvh lg:overflow-hidden">
      <div className="grid h-full lg:grid-cols-2">
        <div className="relative min-h-0 overflow-hidden">
          <LandingMarkField />
        </div>

        <div className="flex min-h-0 flex-col justify-center px-8 pb-10 sm:px-12 lg:px-16 lg:pb-0 xl:px-20">
          <div className="w-full max-w-lg">
            <div className="landing-copy">
              <span className="landing-rule landing-enter-rule" aria-hidden="true" />
              <div>
                <div className="landing-enter landing-enter-title">
                  <h1 className="landing-name font-display text-foreground">
                    Vantage
                  </h1>
                  <p className="landing-kicker">Vendor Performance Platform</p>
                  <p className="landing-intro">
                    Record vendor transactions, then generate a period report.
                    The application computes the performance figures. The model
                    writes an explanation of those numbers and cannot invent
                    one. A finalized report stays locked.
                  </p>
                </div>
                <div className="landing-points">
                  <div className="landing-enter landing-enter-card-lead">
                    <article className="landing-point-card landing-point-card-lead">
                      <LandingPointMark rotate={-18} size="lead" />
                      <div>
                        <h2 className="landing-point-label">
                          AI-written performance reports
                        </h2>
                        <p className="landing-point-copy">
                          The model turns your recorded vendor transactions into a
                          narrative report. Generation runs from the figures the
                          application has already computed.
                        </p>
                      </div>
                    </article>
                  </div>
                  <div className="landing-point-support-row">
                    <div className="landing-enter landing-enter-card-support">
                      <article className="landing-point-card landing-point-card-support">
                        <div className="landing-point-head">
                          <LandingPointMark rotate={10} />
                          <h2 className="landing-point-label">
                            Grounded in your data
                          </h2>
                        </div>
                        <p className="landing-point-copy">
                          Every number the model writes about is computed by the
                          application first. It only explains figures it is
                          given, and never invents one.
                        </p>
                      </article>
                    </div>
                    <div className="landing-enter landing-enter-card-support">
                      <article className="landing-point-card landing-point-card-support">
                        <div className="landing-point-head">
                          <LandingPointMark rotate={26} />
                          <h2 className="landing-point-label">
                            Locked once finalized
                          </h2>
                        </div>
                        <p className="landing-point-copy">
                          A finalized report cannot be changed. Every figure
                          stays traceable to a stored transaction.
                        </p>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-enter landing-enter-gate">
              <div className="landing-action landing-copy-follow">
                <SignInButton tone="hero" />
                <p className="landing-auth">Microsoft Entra ID</p>
              </div>
              <p className="landing-provenance landing-copy-follow">
                Built for K-Youth project, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
