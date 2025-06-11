// src/utils/markdownUtils.js

import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

// 🌟 Плагин для извлечения атрибутов вида {width=300 height=200} из alt-текста
export function imageAttributesPlugin() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      // Ищем параметры в alt-тексте: ![Описание{width=300 height=200}]
      const match = /\{(.+?)\}$/.exec(node.alt || '');
      if (match) {
        const attrs = match[1].split(/\s+/);
        node.alt = node.alt.replace(/\{.+\}$/, '').trim(); // убираем {..} из alt

        // Сохраняем в properties (именно сюда потом попадает)
        node.properties = node.properties || {};
        attrs.forEach(attr => {
          const [key, value] = attr.split('=');
          if (key && value) {
            node.properties[key] = value;
          }
        });
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
