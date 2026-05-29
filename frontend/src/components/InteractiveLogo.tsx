import { motion } from "framer-motion";

// â”€â”€â”€ Full hero-size animation (Overview page) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FullLogo() {
  const flyInVariants = {
    initial: { x: -1200, y: 100, scale: 0.1, rotate: -180, opacity: 0 },
    animate: (customDelay: number) => ({
      x: 0,
      y: 0,
      scale: [0.1, 1.2, 1],
      rotate: 0,
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 1.5,
        delay: customDelay,
        ease: [0.25, 1, 0.5, 1],
        opacity: { times: [0, 0.1, 0.9, 1], duration: 1.5 + customDelay },
      },
    }),
  };

  return (
    <div className="relative flex items-center justify-center w-full h-96">
      {/* Motion blur echoes */}
      <motion.div
        custom={0}
        variants={flyInVariants}
        initial="initial"
        animate="animate"
        className="absolute z-10 pointer-events-none opacity-20 blur-sm"
      >
        <img
          src="/sqa-logo.png"
          alt="SQA"
          className="w-40 h-40 rounded-full object-cover drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]"
        />
      </motion.div>
      <motion.div
        custom={0.08}
        variants={flyInVariants}
        initial="initial"
        animate="animate"
        className="absolute z-[15] pointer-events-none opacity-40 blur-[2px]"
      >
        <img
          src="/sqa-logo.png"
          alt="SQA"
          className="w-40 h-40 rounded-full object-cover drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]"
        />
      </motion.div>
      <motion.div
        custom={0.15}
        variants={flyInVariants}
        initial="initial"
        animate="animate"
        className="absolute z-20 pointer-events-none drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]"
      >
        <img
          src="/sqa-logo.png"
          alt="SQA"
          className="w-40 h-40 rounded-full object-cover"
        />
      </motion.div>

      {/* Shockwave impact ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 3], opacity: [0, 1, 0] }}
        transition={{ delay: 1.6, duration: 0.6, ease: "easeOut" }}
        className="absolute w-80 h-80 rounded-full border-2 border-yellow-400 shadow-[0_0_80px_#eab308] pointer-events-none"
      />

      {/* Final SQA logo badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3, filter: "brightness(3)" }}
        animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
        transition={{ delay: 1.6, duration: 0.4, type: "spring", stiffness: 140, damping: 12 }}
        className="w-80 h-80 z-30 rounded-full drop-shadow-[0_0_60px_rgba(234,179,8,0.7)] flex items-center justify-center overflow-hidden"
        style={{ boxShadow: '0 0 80px rgba(201,162,39,0.5), 0 0 160px rgba(201,162,39,0.2)' }}
      >
        <img
          src="/sqa-logo.png"
          alt="Skadoosh Quantum Aegis"
          className="w-full h-full object-cover rounded-full"
        />
      </motion.div>
    </div>
  );
}

// â”€â”€â”€ Small inline badge (sidebar header, topbar, etc.) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SmallLogo({ size = 32 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
      className="relative flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <motion.div
        animate={{ boxShadow: ["0 0 6px #eab30840", "0 0 18px #eab30880", "0 0 6px #eab30840"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
      />
      <img
        src="/sqa-logo.png"
        alt="SQA"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }}
      />
    </motion.div>
  );
}

// â”€â”€â”€ Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function InteractiveLogo({ size = "lg" }: { size?: "xs" | "sm" | "md" | "lg" }) {
  if (size === "xs") return <SmallLogo size={24} />;
  if (size === "sm") return <SmallLogo size={32} />;
  if (size === "md") return <SmallLogo size={48} />;
  return <FullLogo />;
}

export default InteractiveLogo;
