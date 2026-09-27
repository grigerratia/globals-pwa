import { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, User, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../../supabase';
import styles from './GlobalSearch.module.scss';

const normalizeStr = (str) => {
  if (!str) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,/#!$%^&*;:{}=_`~()-]/g,"")
    .toLowerCase();
};

const deepSearch = (obj, term) => {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'string') return normalizeStr(obj).includes(term);
  if (typeof obj === 'number') return String(obj).includes(term);
  if (typeof obj === 'boolean') return false;
  if (Array.isArray(obj)) return obj.some(item => deepSearch(item, term));
  if (typeof obj === 'object') {
    return Object.values(obj).some(val => deepSearch(val, term));
  }
  return false;
};

const GlobalSearch = ({ onResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchAllProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('proyectos').select('*');
    if (!error && data) {
      setAllProjects(data);
    }
    setLoading(false);
  };

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    fetchAllProjects(); // Refresh data on focus
    if (searchTerm) setIsOpen(true);
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    setLoading(true);
    const term = normalizeStr(searchTerm.trim());
    
    // Use a small timeout to not block the UI thread while typing
    const timer = setTimeout(() => {
      const matches = allProjects.filter(p => deepSearch(p, term));
      setResults(matches);
      setLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm, allProjects]);

  return (
    <div className={styles.searchContainer} ref={wrapperRef}>
      <div className={styles.inputWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscador Global (Todo)..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button className={styles.clearBtn} onClick={() => { setSearchTerm(''); setIsOpen(false); }}>
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && searchTerm.trim() && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            {loading ? 'Buscando en toda la base de datos...' : `Resultados (${results.length})`}
          </div>
          
          <div className={styles.resultsList}>
            {!loading && results.length === 0 && (
              <div className={styles.noResults}>No se encontraron coincidencias para "{searchTerm}"</div>
            )}
            
            {!loading && results.map(p => (
              <div key={p.id} className={styles.resultItem} onClick={() => { setIsOpen(false); onResultClick(p.id); }}>
                <div className={styles.resultTitle}>
                  <Folder size={16} className={styles.iconBlue} />
                  <span>{p.titulo}</span>
                  <span className={styles.badge}>{p.estado}</span>
                </div>
                
                <div className={styles.resultDetails}>
                  {p.cliente_nombre && (
                    <span className={styles.detailTag}>
                      <User size={12} /> {p.cliente_nombre}
                    </span>
                  )}
                  {p.precio_venta && (
                    <span className={styles.detailTag}>
                      <DollarSign size={12} /> {Number(p.precio_venta).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  )}
                  {p.notas && (
                    <span className={styles.detailTag}>
                      <FileText size={12} /> {p.notas.substring(0, 40)}{p.notas.length > 40 ? '...' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
