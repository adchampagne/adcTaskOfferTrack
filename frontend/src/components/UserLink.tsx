import { Send } from 'lucide-react';

interface UserLinkProps {
  name: string;
  username?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Компонент для отображения имени пользователя со ссылкой на Telegram.
 * Не показывает ссылку для пользователя admin.
 */
export default function UserLink({ name, username, showIcon = true, className = '' }: UserLinkProps) {
  // Если username не передан или это admin - просто показываем имя
  if (!username || username === 'admin') {
    return <span className={className}>{name}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{name}</span>
      <a
        href={`https://t.me/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
        title={`Написать в Telegram (@${username})`}
        onClick={(e) => e.stopPropagation()}
      >
        {showIcon && <Send className="w-3.5 h-3.5" />}
      </a>
    </span>
  );
}

