// A cancelled native gesture retains the route. Only a committed pop removes it.
export function createRemovalObserver(name: string, onRemoved: () => void) {
  let present = false;
  return (event: { data: { state: { routes: readonly { name: string }[] } } }) => {
    const next = event.data.state.routes.some(route => route.name === name);
    const removed = present && !next;
    present = next;
    if (removed) onRemoved();
  };
}
