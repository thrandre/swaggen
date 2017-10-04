export interface TopoNode<T> {
  marked: boolean;
  tempMarked: boolean;
  contained: T;
}

export const NOOP = () => {
  return;
};
export const DEFAULT_EQUALITY = <T>(n1: T, n2: T) => n1 === n2;

function getVisitor<T>(
  getChildrenFn: (node: T) => T[],
  nodeEqualityFn: (n1: T, n2: T) => boolean = DEFAULT_EQUALITY,
  onVisited: (node: T) => void = NOOP
) {
  return function visit(node: TopoNode<T>, pool: TopoNode<T>[], stack: T[]) {
    if (node.tempMarked) {
      throw new Error("Cyclic Reference Error");
    }

    if (node.marked) {
      return;
    }

    node.tempMarked = true;

    getChildrenFn(node.contained).forEach(c => {
      let resolved = pool.find(n => nodeEqualityFn(n.contained, c));

      if (!resolved) {
        resolved = { marked: false, tempMarked: false, contained: c };
        pool.push(resolved);
      }

      visit(resolved, pool, stack);
    });

    node.marked = true;
    node.tempMarked = false;

    stack.push(node.contained);
    onVisited(node.contained);
  };
}

export interface SortArgs<T> {
  root: T;
  getChildrenFn: (n: T) => T[];
  nodeEqualityFn?: (n1: T, n2: T) => boolean;
  onVisited?: (n: T) => void;
}

export function sort<T>({
  root,
  getChildrenFn,
  nodeEqualityFn = DEFAULT_EQUALITY,
  onVisited = NOOP
}: SortArgs<T>) {
  const rootNode: TopoNode<T> = {
    marked: false,
    tempMarked: false,
    contained: root
  };

  const pool = [rootNode];
  const stack: T[] = [];

  const visitor = getVisitor<T>(getChildrenFn, nodeEqualityFn, onVisited);

  visitor(rootNode, pool, stack);

  return stack;
}

export interface ResolveArgs<T, T2> {
  root: T;
  getChildrenFn: (n: T) => T[];
  resolveFn: (n: T, pool: T2[]) => T2;
  resolveRoot?: boolean;
  nodeEqualityFn?: (n1: T, n2: T) => boolean;
}

export function resolve<T, T2>({
  root,
  getChildrenFn,
  resolveFn,
  resolveRoot = false,
  nodeEqualityFn = DEFAULT_EQUALITY
}: ResolveArgs<T, T2>): T2[] {
  const pool: T2[] = [];

  sort({
    root,
    getChildrenFn,
    nodeEqualityFn,
    onVisited: node => {
      if (node !== root || resolveRoot) {
        pool.push(resolveFn(node, pool));
      }
    }
  });

  return pool;
}
