import SignInButton from "@/components/auth/SignInButton";
import LandingMarkField from "@/components/landing/LandingMarkField";

const POINTS = [
  {
    label: "Records",
    body: "You record vendor transactions. The application computes every figure from those rows.",
  },
  {
    label: "Explanation",
    body: "The model receives those computed values and writes the narrative. It never calculates or invents a metric.",
  },
  {
    label: "Trace",
    body: "A finalized report is locked. Every number in it stays traceable to a stored transaction.",
  },
] as const;

export default function SignedOutLanding() {
  return (
    <div className="landing min-h-dvh overflow-y-auto bg-cream lg:h-dvh lg:overflow-hidden">
      <div className="grid h-full lg:grid-cols-2">
        <div className="relative min-h-0 overflow-hidden">
          <LandingMarkField />
        </div>

        <div className="flex min-h-0 flex-col justify-center px-8 pb-10 sm:px-12 lg:px-16 lg:pb-0 xl:px-20">
          <div className="landing-card w-full max-w-md">
            <h1 className="landing-name font-display text-foreground">
              Vantage
            </h1>
            <p className="landing-kicker">Vendor Performance Platform</p>
            <div className="landing-points">
              {POINTS.map((point) => (
                <div key={point.label} className="landing-point">
                  <p className="landing-point-label">{point.label}</p>
                  <p className="landing-point-copy">{point.body}</p>
                </div>
              ))}
            </div>
            <div className="landing-action">
              <SignInButton tone="hero" />
              <p className="landing-auth">
                Microsoft Entra ID 
              </p>
            </div>
            <p className="landing-provenance">
              Built for K-Youth project, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
