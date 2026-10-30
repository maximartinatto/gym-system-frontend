import { useWorkspace } from "../contexts/workspace-context";
import { useToast } from "../components/toast-context";
export function useCommit() {
  const { reload } = useWorkspace(),
    notify = useToast();
  return async (work: () => Promise<unknown>, message: string) => {
    await work();
    notify(message);
    void reload();
  };
}
