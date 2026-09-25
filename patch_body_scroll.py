with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

import re

# Insert useEffect for body scroll lock
scroll_lock = """  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
"""

content = re.sub(r'  const \[uploadingFile, setUploadingFile\] = useState\(false\);\n', f'  const [uploadingFile, setUploadingFile] = useState(false);\n\n{scroll_lock}', content)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
