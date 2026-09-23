import Image from "next/image";

const ECHOES = [
  {
    className:
      "absolute left-[4%] top-[10%] h-[58%] w-auto -rotate-[20deg] opacity-[0.07] scale-125",
  },
  {
    className:
      "absolute right-[2%] top-[8%] h-[48%] w-auto rotate-[24deg] opacity-[0.09]",
  },
  {
    className:
      "absolute left-[10%] bottom-[6%] h-[62%] w-auto rotate-[8deg] opacity-[0.06] scale-150",
  },
  {
    className:
      "absolute right-[6%] bottom-[12%] h-[44%] w-auto -rotate-[14deg] opacity-[0.10]",
  },
  {
    className:
      "absolute left-1/2 top-1/2 h-[78%] w-auto -translate-x-1/2 -translate-y-1/2 rotate-[28deg] opacity-[0.05] scale-[1.7]",
  },
] as const;

export default function LandingMarkField() {
  return (
    <div className="relative flex h-full min-h-[22rem] w-full items-center justify-center overflow-hidden sm:min-h-[28rem]">
      <div className="absolute inset-0" aria-hidden="true">
        {ECHOES.map((echo) => (
          <Image
            key={echo.className}
            src="/vpp_logo.svg"
            alt=""
            width={512}
            height={512}
            className={echo.className}
          />
        ))}
      </div>

      <Image
        src="/vpp_logo.svg"
        alt=""
        width={512}
        height={512}
        className="relative z-10 h-[min(46vh,22rem)] w-auto"
        priority
      />
    </div>
  );
}
