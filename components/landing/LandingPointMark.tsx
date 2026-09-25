import Image from "next/image";

export default function LandingPointMark({
  rotate,
  size = "support",
}: {
  rotate: number;
  size?: "lead" | "support";
}) {
  return (
    <Image
      src="/vpp_logo.svg"
      alt=""
      width={size === "lead" ? 48 : 40}
      height={size === "lead" ? 48 : 40}
      className={
        size === "lead" ? "landing-point-mark landing-point-mark-lead" : "landing-point-mark"
      }
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  );
}
