import { useContext } from 'react';
import { SessionContext, SessionContextType } from '@/integrations/supabase/session-context';

export type { SessionContextType };

/**
 * Custom hook to access the Supabase session context.
 * @returns The session context including user, profile, admin status, studio ID, and loading state.
 */
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};