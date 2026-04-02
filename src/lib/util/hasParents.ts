import type {ASTNode} from '../types';

export default function hasParents(
  parents: ReadonlyArray<ASTNode>,
  type: string,
): boolean {
  return parents.some((parentNode) => parentNode.type === type);
}
