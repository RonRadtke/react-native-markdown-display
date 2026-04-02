import {
  MarkdownIt,
  stringToTokens,
  tokensToAST,
  type ASTNode,
} from '../src';
import {cleanupTokens} from '../src/lib/util/cleanupTokens';
import groupTextTokens from '../src/lib/util/groupTextTokens';
import omitListItemParagraph from '../src/lib/util/omitListItemParagraph';

const createAst = (source: string): ASTNode[] => {
  const markdownIt = MarkdownIt({typographer: true});
  const tokens = stringToTokens(source, markdownIt);
  const cleanedTokens = cleanupTokens(tokens);
  const groupedTokens = groupTextTokens(cleanedTokens);
  const normalizedTokens = omitListItemParagraph(groupedTokens);

  return tokensToAST(normalizedTokens);
};

describe('parser pipeline', () => {
  test('converts image links into block links and keeps image alt text', () => {
    const markdownIt = MarkdownIt({typographer: true});
    const tokens = cleanupTokens(
      stringToTokens(
        '[![Example alt](image.png)](https://example.com)',
        markdownIt,
      ),
    );

    expect(tokens.filter((token) => token.type === 'blocklink')).toHaveLength(2);

    const imageToken = tokens.find((token) => token.type === 'image');

    expect(imageToken?.block).toBe(true);
    expect(imageToken?.attrs?.[imageToken.attrIndex('alt')]?.[1]).toBe(
      'Example alt',
    );
  });

  test('removes paragraph wrappers directly under list items', () => {
    const ast = createAst('* first item');

    expect(ast[0]?.type).toBe('bullet_list');
    expect(ast[0]?.children[0]?.type).toBe('list_item');
    expect(ast[0]?.children[0]?.children.map((child) => child.type)).toEqual([
      'textgroup',
    ]);
    expect(ast[0]?.children[0]?.children[0]?.children[0]?.content).toBe(
      'first item',
    );
  });

  test('maps markdown-it tokens to AST nodes with stable rule names and attributes', () => {
    const ast = createAst('# Title\n\n[site](https://example.com)');

    expect(ast[0]?.type).toBe('heading1');
    expect(ast[0]?.children[0]?.type).toBe('textgroup');
    expect(ast[0]?.children[0]?.children[0]?.content).toBe('Title');

    expect(ast[1]?.type).toBe('paragraph');
    expect(ast[1]?.children[0]?.type).toBe('textgroup');
    expect(ast[1]?.children[0]?.children[0]?.type).toBe('link');
    expect(ast[1]?.children[0]?.children[0]?.attributes.href).toBe(
      'https://example.com',
    );
  });
});
