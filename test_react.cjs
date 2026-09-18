const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const KanbanColumn = ({ colorBg }) => {
  return React.createElement('div', {
    style: { backgroundColor: colorBg },
    className: 'column'
  }, 'Hello');
};

console.log(renderToStaticMarkup(React.createElement(KanbanColumn, { colorBg: '#fee2e2' })));
