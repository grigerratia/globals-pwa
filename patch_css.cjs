const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.module.scss', 'utf8');
code = code.replace(/@media \(max-width: 768px\) {[\s\S]*?}\n}/, `@media (max-width: 768px) {
  .modal {
    width: 100% !important;
    max-width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
    padding: 1rem !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }
  .content {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }
  .clientInfoBox {
    flex-direction: column !important;
  }
  .clientField {
    width: 100% !important;
    min-width: 0 !important;
  }
  .clientField input {
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .textareaBox {
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .header {
    flex-wrap: wrap !important;
  }
  .titleInput {
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .checkItem {
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .financeGrid {
    flex-direction: column !important;
  }
  .financeField {
    width: 100% !important;
    min-width: 0 !important;
  }
  .financeField input {
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .addMaterialBox {
    flex-direction: column;
    button {
      width: 100%;
    }
  }
  .financeSummary {
    flex-direction: column;
    gap: 1rem;
  }
}`);
fs.writeFileSync('src/components/Modals/ProjectDetailModal.module.scss', code);
