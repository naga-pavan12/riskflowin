import { useProjectContext } from './ProjectContext';

// Re-export the context hook as useProjectStore for backward compatibility
export const useProjectStore = useProjectContext;
