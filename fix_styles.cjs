const fs = require('fs');
const file = './src/components/Modals/ProjectDetailModal.module.scss';
let css = fs.readFileSync(file, 'utf8');

// Fix titleInput focus state
css = css.replace(/&:focus \{\s*background: #ffffff;\s*border-color: #cbd5e1;\s*box-shadow: 0 0 0 3px rgba\(226, 232, 240, 0\.5\);\s*color: #1e293b;\s*outline: none;\s*\}/,
`&:focus {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
      color: #ffffff;
      outline: none;
    }`);

// Fix btnClose on mobile
css = css.replace(/@media \(max-width: 768px\) \{\s*top: 0\.75rem;\s*right: 0\.75rem;\s*padding: 0\.5rem;\s*\}/,
`@media (max-width: 768px) {
    top: 1rem;
    right: 1rem;
    padding: 0.6rem;
  }`);

// Make standard HTML select look better in addEncargadoBox
css = css.replace(/input, select \{\s*padding: 1rem;\s*border: 1px solid #cbd5e1;\s*border-radius: 8px;\s*font-size: 0\.95rem;\s*outline: none;\s*transition: border-color 0\.2s ease;\s*&:focus \{\s*border-color: #3b82f6;\s*\}\s*\}/,
`input, select {
    padding: 0.75rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    outline: none;
    background-color: #ffffff;
    color: #334155;
    transition: all 0.2s ease;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }`);

fs.writeFileSync(file, css);
