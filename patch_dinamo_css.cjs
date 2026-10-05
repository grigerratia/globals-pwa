const fs = require('fs');
const file = 'src/components/Dinamo/DinamoAgent.module.scss';
let content = fs.readFileSync(file, 'utf8');

// Replace .modal
content = content.replace(/\.modal \{\s*background: #1e293b;\s*width: 90%;\s*max-width: 450px;\s*border-radius: 20px;\s*padding: 2rem;/, `.modal {
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  width: calc(100% - 2rem);
  max-width: 450px;
  border-radius: 20px;
  padding: 1.25rem;`);

// Reduce .response padding to make text wider
content = content.replace(/\.response \{\s*background: rgba\(139, 92, 246, 0.1\);\s*border-left: 3px solid #8b5cf6;\s*padding: 1rem;/, `.response {
  background: rgba(59, 130, 246, 0.15);
  border-left: 3px solid #3b82f6;
  padding: 0.75rem 0.5rem;`);

// Fix scrolling issue: .modal already has overflow-y: auto, but maybe .chatArea or .response prevents it?
// Wait, the user said "cuando estoy en el modal de dinamo, no puedo hacer scoll". 
// In KanabnBoard, maybe body has overflow: hidden? Yes, many modals lock body scroll, but if .modal has overflow-y: auto, it should scroll!
// Let's ensure .modal has pointer-events: auto and .overlay has padding.

content = content.replace(/\.overlay \{\s*position: fixed;\s*inset: 0;/, `.overlay {
  position: fixed;
  inset: 0;
  padding: 1rem;`);

// Fix logo aspect ratio issue (mira el logo de IA en el modal de dinamo, está estirado)
// The avatar is .avatar with width 64 and height 64. But if flex is used, it might be stretched.
content = content.replace(/\.avatar \{\s*width: 64px;\s*height: 64px;\s*flex-shrink: 0;/, `.avatar {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  object-fit: cover; /* if it's an image, wait, it's a div with background */
`);
content = content.replace(/align-items: center;\s*justify-content: center;\s*margin-bottom: 0.5rem;\s*box-shadow/, `align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  aspect-ratio: 1/1;
  box-shadow`);

fs.writeFileSync(file, content);
console.log("Patched successfully.");
