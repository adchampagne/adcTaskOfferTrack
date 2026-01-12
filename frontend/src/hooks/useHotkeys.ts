import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type HotkeyCallback = () => void;

interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: HotkeyCallback;
  preventDefault?: boolean;
}

// Глобальные горячие клавиши
export function useGlobalHotkeys(
  onOpenCommandPalette: () => void,
  onNewTask?: () => void,
) {
  const navigate = useNavigate();
  const sequenceRef = useRef<string>('');
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Игнорируем, если фокус в input, textarea или contenteditable
    const target = e.target as HTMLElement;
    const isEditable = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('[contenteditable="true"]');

    // Cmd/Ctrl + K - открыть палитру команд (работает везде)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onOpenCommandPalette();
      return;
    }

    // Остальные хоткеи не работают в редактируемых полях
    if (isEditable) return;

    // N - новая задача
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (onNewTask) {
        onNewTask();
      } else {
        navigate('/tasks?new=1');
      }
      return;
    }

    // ? - показать подсказку по клавишам
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      onOpenCommandPalette();
      return;
    }

    // G + буква - навигация (двухклавишная последовательность)
    // Сбрасываем таймер предыдущей последовательности
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    // Добавляем букву к последовательности
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      sequenceRef.current += e.key.toLowerCase();
      
      // Проверяем последовательности G + буква
      if (sequenceRef.current.startsWith('g')) {
        const sequence = sequenceRef.current;
        
        // Ждём второй буквы
        if (sequence.length === 2) {
          switch (sequence) {
            case 'gd':
              e.preventDefault();
              navigate('/');
              break;
            case 'gt':
              e.preventDefault();
              navigate('/tasks');
              break;
            case 'go':
              e.preventDefault();
              navigate('/offers');
              break;
            case 'gp':
              e.preventDefault();
              navigate('/partners');
              break;
            case 'ga':
              e.preventDefault();
              navigate('/analytics');
              break;
            case 'gk':
              e.preventDefault();
              navigate('/knowledge-base');
              break;
            case 'gs':
              e.preventDefault();
              navigate('/settings');
              break;
            case 'gu':
              e.preventDefault();
              navigate('/users');
              break;
          }
          sequenceRef.current = '';
          return;
        }
      }

      // Сбрасываем последовательность через 1 секунду
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceRef.current = '';
      }, 1000);
    }
  }, [navigate, onOpenCommandPalette, onNewTask]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);
}

// Хук для отдельных горячих клавиш в компонентах
export function useHotkey(config: HotkeyConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { key, ctrl, meta, shift, alt, callback, preventDefault = true } = config;
    
    const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
    const metaMatch = meta ? e.metaKey : true;
    const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
    const altMatch = alt ? e.altKey : !e.altKey;
    
    if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && metaMatch && shiftMatch && altMatch) {
      if (preventDefault) {
        e.preventDefault();
      }
      callback();
    }
  }, [config]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Хук для Escape
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback, enabled]);
}

