import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
