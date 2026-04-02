import React, { createContext, useContext, useMemo, useState } from 'react';

type ProgramContextValue = {
  activeProgramId: string | null;
  setActiveProgramId: (programId: string | null) => void;
};

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined);

export const ProgramProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  const value = useMemo<ProgramContextValue>(
    () => ({
      activeProgramId,
      setActiveProgramId,
    }),
    [activeProgramId],
  );

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
};

export const useProgram = (): ProgramContextValue => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgram must be used within ProgramProvider');
  }
  return context;
};
