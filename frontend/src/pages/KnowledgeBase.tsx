import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Code, 
  Globe,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  FolderPlus
} from 'lucide-react';
import { knowledgeApi, KnowledgeCategory, KnowledgeInstruction } from '../api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Маппинг иконок
const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
};

// Компонент для отображения markdown-подобного контента
function ContentRenderer({ content }: { content: string }) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(index);
    toast.success('Скопировано!');
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const renderContent = () => {
    const lines = content.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockIndex = 0;

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlock = [];
        } else {
          const codeContent = codeBlock.join('\n');
          const currentIndex = codeBlockIndex++;
          elements.push(
            <div key={`code-${i}`} className="relative group my-4">
              {codeBlockLang && (
                <div className="absolute top-0 left-0 px-3 py-1 text-xs text-dark-400 bg-dark-800 rounded-tl-lg rounded-br-lg">
                  {codeBlockLang}
                </div>
              )}
              <button
                onClick={() => copyToClipboard(codeContent, currentIndex)}
                className="absolute top-2 right-2 p-1.5 text-dark-400 hover:text-dark-200 bg-dark-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Копировать"
              >
                {copiedBlock === currentIndex ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <pre className="bg-dark-800 rounded-xl p-4 pt-8 overflow-x-auto text-sm text-dark-200 font-mono">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockLang = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold text-dark-100 mb-4 mt-6 first:mt-0">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold text-dark-200 mb-3 mt-5">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-medium text-dark-300 mb-2 mt-4">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={i} className="my-6 border-dark-600" />);
      } else if (line.match(/^- \[[ x]\]/)) {
        const checked = line.includes('[x]');
        const text = line.replace(/^- \[[ x]\] /, '');
        elements.push(
          <div key={i} className="flex items-center gap-2 my-1 text-dark-300">
            {checked ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <div className="w-4 h-4 border border-dark-500 rounded" />
            )}
            <span>{text}</span>
          </div>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="text-dark-300 ml-4 my-1 list-disc">
            {line.slice(2)}
          </li>
        );
      } else if (line.match(/^\d+\. /)) {
        elements.push(
          <li key={i} className="text-dark-300 ml-4 my-1 list-decimal">
            {line.replace(/^\d+\. /, '')}
          </li>
        );
      } else if (line.includes('`')) {
        const parts = line.split(/(`[^`]+`)/);
        elements.push(
          <p key={i} className="text-dark-300 my-2">
            {parts.map((part, j) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={j} className="px-1.5 py-0.5 bg-dark-700 rounded text-primary-400 text-sm font-mono">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return part;
            })}
          </p>
        );
      } else if (line.trim()) {
        // Handle bold text
        const processedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        if (processedLine.includes('<strong>')) {
          elements.push(
            <p key={i} className="text-dark-300 my-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
          );
        } else {
          elements.push(
            <p key={i} className="text-dark-300 my-2">
              {line}
            </p>
          );
        }
      }
    });

    return elements;
  };

  return <div className="prose-dark">{renderContent()}</div>;
}

// Модальное окно редактирования инструкции
function InstructionModal({
  instruction,
  onClose,
  onSave,
}: {
  instruction?: KnowledgeInstruction;
  onClose: () => void;
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
}) {
  const [title, setTitle] = useState(instruction?.title || '');
  const [content, setContent] = useState(instruction?.content || '');
  const [tagsInput, setTagsInput] = useState(instruction?.tags?.join(', ') || '');
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Заполните название и содержимое');
      return;
    }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ title: title.trim(), content: content.trim(), tags });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-xl font-bold text-dark-100">
            {instruction ? 'Редактировать инструкцию' : 'Новая инструкция'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Название *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input w-full"
                placeholder="Название инструкции"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Теги (через запятую)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="glass-input w-full"
                placeholder="тег1, тег2, тег3"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-dark-300">
                  Содержимое * (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  {showPreview ? 'Редактор' : 'Предпросмотр'}
                </button>
              </div>
              
              {showPreview ? (
                <div className="glass-card p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                  <ContentRenderer content={content} />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="glass-input w-full h-[400px] font-mono text-sm resize-none"
                  placeholder="# Заголовок

## Подзаголовок

Текст инструкции...

- Пункт списка
- [ ] Чекбокс

```javascript
// Код
```"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно категории
function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category?: KnowledgeCategory;
  onClose: () => void;
  onSave: (data: { title: string; icon: string }) => void;
}) {
  const [title, setTitle] = useState(category?.title || '');
  const [icon, setIcon] = useState(category?.icon || 'FileText');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Введите название категории');
      return;
    }
    onSave({ title: title.trim(), icon });
  };

  const iconOptions = ['FileText', 'Code', 'Globe', 'BookOpen'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-xl font-bold text-dark-100">
            {category ? 'Редактировать категорию' : 'Новая категория'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full"
              placeholder="Название категории"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Иконка
            </label>
            <div className="flex gap-2">
              {iconOptions.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-3 rounded-xl transition-colors ${
                    icon === iconName
                      ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {iconMap[iconName]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Маппинг роли -> отдел
const roleToDepartment: Record<string, string> = {
  'webdev': 'development',
  'dev_head': 'development',
  'creo_manager': 'creo',
  'creo_head': 'creo',
  'buyer': 'buying',
  'buying_head': 'buying',
  'bizdev': 'buying',
};

// Названия отделов
const departmentNames: Record<string, string> = {
  'general': 'Общие',
  'development': 'Разработка',
  'creo': 'Крео',
  'buying': 'Баинг',
};

function KnowledgeBase() {
  const { hasRole, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedInstruction, setSelectedInstruction] = useState<KnowledgeInstruction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingInstruction, setEditingInstruction] = useState<KnowledgeInstruction | undefined>();
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | undefined>();
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Определяем отдел пользователя по его роли
  const userDepartment = user?.role ? roleToDepartment[user.role] : null;
  const isAdmin = hasRole('admin');
  
  // Доступные отделы для просмотра (general доступен всем)
  const availableDepartments = isAdmin 
    ? ['general', 'development', 'creo', 'buying'] 
    : userDepartment 
      ? ['general', userDepartment] 
      : ['general'];

  // Текущий выбранный отдел
  const [departmentCode, setDepartmentCode] = useState<string>(
    availableDepartments[0] || 'general'
  );

  // Загрузка данных
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['knowledge', departmentCode],
    queryFn: () => knowledgeApi.getByDepartment(departmentCode),
  });

  const { data: canEditData } = useQuery({
    queryKey: ['knowledge-can-edit', departmentCode],
    queryFn: () => knowledgeApi.canEdit(departmentCode),
  });

  const canEdit = canEditData?.canEdit || false;

  // Мутации
  const createCategoryMutation = useMutation({
    mutationFn: (data: { title: string; icon: string }) =>
      knowledgeApi.createCategory({ department_code: departmentCode, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', departmentCode] });
      toast.success('Категория создана');
      setShowCategoryModal(false);
    },
    onError: () => toast.error('Ошибка создания категории'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; icon?: string } }) =>
      knowledgeApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', departmentCode] });
      toast.success('Категория обновлена');
      setShowCategoryModal(false);
      setEditingCategory(undefined);
    },
    onError: () => toast.error('Ошибка обновления категории'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => knowledgeApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', departmentCode] });
      toast.success('Категория удалена');
    },
    onError: () => toast.error('Ошибка удаления категории'),
  });

  const createInstructionMutation = useMutation({
    mutationFn: (data: { category_id: string; title: string; content: string; tags: string[] }) =>
      knowledgeApi.createInstruction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', departmentCode] });
      toast.success('Инструкция создана');
      setShowInstructionModal(false);
    },
    onError: () => toast.error('Ошибка создания инструкции'),
  });

  const updateInstructionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; tags?: string[] } }) =>
      knowledgeApi.updateInstruction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', departmentCode] });
      toast.success('Инструкция обновлена');
      setShowInstructionModal(false);
      setEditingInstruction(undefined);
      // Обновляем выбранную инструкцию если она открыта
      if (selectedInstruction) {
        setSelectedInstruction(null);
      }
    },
    onError: () => toast.error('Ошибка обновления инструкции'),
  });

  const deleteInstructionMutation = useMutation({
    mutationFn: (id: string) => knowledgeApi.deleteInstruction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', departmentCode] });
      toast.success('Инструкция удалена');
      if (selectedInstruction) {
        setSelectedInstruction(null);
      }
    },
    onError: () => toast.error('Ошибка удаления инструкции'),
  });

  // Фильтрация по поиску
  const filteredCategories = categories.map(category => ({
    ...category,
    instructions: category.instructions.filter(instruction => {
      const query = searchQuery.toLowerCase();
      return (
        instruction.title.toLowerCase().includes(query) ||
        instruction.content.toLowerCase().includes(query) ||
        instruction.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }),
  })).filter(category => category.instructions.length > 0 || !searchQuery);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Проверка доступа (general всегда доступен, так что доступ есть у всех)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 pb-4 mb-4 border-b border-dark-700">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-100">База знаний</h1>
                <p className="text-sm text-dark-400">{departmentNames[departmentCode]}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Поиск */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input w-full pl-10"
                />
              </div>

              {canEdit && (
                <button
                  onClick={() => {
                  setEditingCategory(undefined);
                  setShowCategoryModal(true);
                }}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Категория</span>
              </button>
            )}
            </div>
          </div>

          {/* Вкладки отделов */}
          {availableDepartments.length > 1 && (
            <div className="flex gap-2 mt-4">
              {availableDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setDepartmentCode(dept);
                    setSelectedInstruction(null);
                    setExpandedCategories([]);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    departmentCode === dept
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {departmentNames[dept]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        {/* Sidebar */}
        <aside className="w-80 border-r border-dark-700 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 hidden lg:block">
          <div className="space-y-2">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-dark-700/50 transition-colors text-left"
                  >
                    <span className="text-primary-400">{iconMap[category.icon] || <FileText className="w-5 h-5" />}</span>
                    <span className="flex-1 font-medium text-dark-200 truncate">
                      {category.title}
                    </span>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="w-4 h-4 text-dark-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-400" />
                    )}
                  </button>

                  {canEdit && (
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className="p-1.5 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить категорию и все инструкции в ней?')) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                        className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded-lg"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {expandedCategories.includes(category.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {category.instructions.map(instruction => (
                      <div key={instruction.id} className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedInstruction(instruction)}
                          className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                            selectedInstruction?.id === instruction.id
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'text-dark-300 hover:bg-dark-700/50 hover:text-dark-200'
                          }`}
                        >
                          {instruction.title}
                        </button>

                        {canEdit && (
                          <div className="flex items-center">
                            <button
                              onClick={() => {
                                setEditingInstruction(instruction);
                                setSelectedCategoryId(instruction.category_id);
                                setShowInstructionModal(true);
                              }}
                              className="p-1 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded"
                              title="Редактировать"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Удалить инструкцию?')) {
                                  deleteInstructionMutation.mutate(instruction.id);
                                }
                              }}
                              className="p-1 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded"
                              title="Удалить"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingInstruction(undefined);
                          setSelectedCategoryId(category.id);
                          setShowInstructionModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-400 hover:bg-primary-500/10 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8 text-dark-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет категорий</p>
                {canEdit && (
                  <button
                    onClick={() => {
                      setEditingCategory(undefined);
                      setShowCategoryModal(true);
                    }}
                    className="mt-2 text-primary-400 hover:text-primary-300"
                  >
                    Создать первую
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Mobile view */}
        <div className="lg:hidden w-full overflow-y-auto px-4 sm:px-6 py-4">
          {!selectedInstruction ? (
            <div className="space-y-4">
              {filteredCategories.map(category => (
                <div key={category.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-primary-400">{iconMap[category.icon] || <FileText className="w-5 h-5" />}</span>
                      <h3 className="font-medium text-dark-200">{category.title}</h3>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingInstruction(undefined);
                          setSelectedCategoryId(category.id);
                          setShowInstructionModal(true);
                        }}
                        className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {category.instructions.map(instruction => (
                      <button
                        key={instruction.id}
                        onClick={() => setSelectedInstruction(instruction)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                      >
                        <span className="text-dark-300 text-sm">{instruction.title}</span>
                        <ChevronRight className="w-4 h-4 text-dark-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setSelectedInstruction(null)}
                className="flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-4"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Назад</span>
              </button>
              <ContentRenderer content={selectedInstruction.content} />
              {selectedInstruction.tags && selectedInstruction.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-dark-700">
                  {selectedInstruction.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded-lg">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main content - desktop */}
        <main className="flex-1 overflow-y-auto px-6 py-4 hidden lg:block">
          {selectedInstruction ? (
            <div>
              {canEdit && (
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => {
                      setEditingInstruction(selectedInstruction);
                      setSelectedCategoryId(selectedInstruction.category_id);
                      setShowInstructionModal(true);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Редактировать
                  </button>
                </div>
              )}
              
              <ContentRenderer content={selectedInstruction.content} />
              
              {selectedInstruction.tags && selectedInstruction.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-dark-700">
                  {selectedInstruction.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded-lg">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BookOpen className="w-16 h-16 text-dark-600 mb-4" />
              <h2 className="text-xl font-medium text-dark-400 mb-2">
                Выберите инструкцию
              </h2>
              <p className="text-dark-500 max-w-md">
                Выберите категорию и инструкцию из списка слева
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(undefined);
          }}
          onSave={(data) => {
            if (editingCategory) {
              updateCategoryMutation.mutate({ id: editingCategory.id, data });
            } else {
              createCategoryMutation.mutate(data);
            }
          }}
        />
      )}

      {showInstructionModal && (
        <InstructionModal
          instruction={editingInstruction}
          onClose={() => {
            setShowInstructionModal(false);
            setEditingInstruction(undefined);
          }}
          onSave={(data) => {
            if (editingInstruction) {
              updateInstructionMutation.mutate({ id: editingInstruction.id, data });
            } else {
              createInstructionMutation.mutate({ category_id: selectedCategoryId, ...data });
            }
          }}
        />
      )}
    </div>
  );
}

export default KnowledgeBase;
