
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Calendar } from 'lucide-react';

interface UserHoverCardProps {
  user: {
    name: string;
    avatar: string;
    role?: string;
    email?: string;
    joinedDate?: string;
  };
  children: React.ReactNode;
}

const CARD_WIDTH = 288;
const CARD_HEIGHT = 220;
const GAP = 8;

export const UserHoverCard: React.FC<UserHoverCardProps> = ({ user, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.left;
    let top = r.bottom + GAP;
    if (left + CARD_WIDTH + 8 > vw) left = vw - CARD_WIDTH - 8;
    if (left < 8) left = 8;
    if (top + CARD_HEIGHT + 8 > vh) {
      top = r.top - CARD_HEIGHT - GAP;
      if (top < 8) top = 8;
    }
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!isHovered) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isHovered]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
      hoverTimeoutRef.current = null;
    }, 180);
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isHovered && pos && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ position: 'fixed', top: pos.top, left: pos.left, width: CARD_WIDTH, zIndex: 9999 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                <div className="absolute -bottom-6 left-6">
                  <div className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </div>

              <div className="pt-8 px-6 pb-6">
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-slate-900 leading-tight">{user.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{user.role || 'Member'}</p>
                </div>

                <div className="space-y-3 mt-4">
                  {user.email && (
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {user.joinedDate && (
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
