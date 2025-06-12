// src/utils/markdownUtils.js

import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

// 🌟 Плагин для извлечения атрибутов вида {width=300 height=200} из alt-текста
function imageAttributesPlugin() {
  

  return (tree) => {
    visit(tree, 'image', (node) => {
      const match = /\{(.+?)\}$/.exec(node.alt || '');
      if (match) {
        const attrs = match[1].split(/\s+/);
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};

        attrs.forEach(attr => {
          const [key, value] = attr.split('=');
          if (key && value) {
            node.data.hProperties[key] = value;
          }
        });

        node.alt = node.alt.replace(/\{.+\}$/, '').trim();
      }
    });
  };
}

// 🌟 Экспорт всех Markdown плагинов
export const markdownPlugins = {
  remark: [remarkGfm, remarkDirective, imageAttributesPlugin],
  rehype: [rehypeRaw, rehypeHighlight],
};

// 🌟 Кастомный компонент изображения
export const markdownComponents = {
  img: ({ node, ...props }) => {
    console.log(node)
    const { width, height } = node?.properties || {};
    return (
      <img
        {...props}
        width={width}
        height={height}
        style={{
          display: 'inline',
          marginLeft: '0',
          maxWidth: '100%',
          objectFit: 'cover',
          borderRadius: '8px',
          margin: '0 4px',
          width: width ? `${width}px` : '400px',
          height: height ? `${height}px` : 'auto',
        }}
      />
      
    );
  }
};
