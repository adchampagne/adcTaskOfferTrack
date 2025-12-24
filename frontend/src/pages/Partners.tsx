import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, ExternalLink, Edit2, Trash2, X } from 'lucide-react';
import { partnersApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { Partner } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface PartnerFormData {
  name: string;
  description: string;
  website: string;
}

function PartnerModal({
  partner,
  onClose,
  onSave,
}: {
  partner?: Partner;
  onClose: () => void;
  onSave: (data: PartnerFormData) => void;
}) {
  const [formData, setFormData] = useState<PartnerFormData>({
    name: partner?.name || '',
    description: partner?.description || '',
    website: partner?.website || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Введите название партнёрки');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-card w-full h-full sm:h-auto sm:max-w-lg p-4 sm:p-6 animate-scale-in sm:rounded-2xl rounded-none overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            {partner ? 'Редактировать партнёрку' : 'Новая партнёрка'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Название *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass-input w-full"
              placeholder="Например: LemonAd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input w-full h-24 resize-none"
              placeholder="Краткое описание партнёрки"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Сайт
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="glass-input w-full"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              {partner ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Partners() {
  const { canManageOffers, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | undefined>();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: partnersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: partnersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setShowModal(false);
      toast.success('Партнёрка создана');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartnerFormData }) =>
      partnersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setEditingPartner(undefined);
      toast.success('Партнёрка обновлена');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка обновления');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: partnersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success('Партнёрка удалена');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления');
    },
  });

  const handleSave = (data: PartnerFormData) => {
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (partner: Partner) => {
    if (confirm(`Удалить партнёрку "${partner.name}"? Все офферы также будут удалены.`)) {
      deleteMutation.mutate(partner.id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 animate-slide-down">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2 sm:gap-3">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
            Партнёрки
          </h1>
          <p className="text-dark-400 mt-1 text-sm hidden sm:block">
            Управление партнёрскими сетями
          </p>
        </div>
        {canManageOffers() && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2 sm:px-6 sm:py-3"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Добавить</span>
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 sm:p-6">
              <div className="skeleton h-6 w-32 rounded mb-3" />
              <div className="skeleton h-4 w-full rounded mb-2" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300">Нет партнёрок</h3>
          <p className="text-dark-500 mt-1 text-sm">
            {canManageOffers() 
              ? 'Добавьте первую партнёрку, чтобы начать' 
              : 'Партнёрки пока не добавлены'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {partners.map((partner, index) => (
            <div
              key={partner.id}
              className="glass-card p-4 sm:p-6 animate-fade-in hover:border-primary-500/30 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-dark-100 truncate">
                    {partner.name}
                  </h3>
                  {partner.description && (
                    <p className="text-sm text-dark-400 mt-1 line-clamp-2">
                      {partner.description}
                    </p>
                  )}
                </div>
                {canManageOffers() && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingPartner(partner)}
                      className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {hasRole('admin') && (
                      <button
                        onClick={() => handleDelete(partner)}
                        className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dark-700/50 flex items-center justify-between gap-2">
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Открыть сайт</span>
                    <span className="sm:hidden">Сайт</span>
                  </a>
                ) : (
                  <span className="text-xs sm:text-sm text-dark-500">Нет сайта</span>
                )}
                <span className="text-xs text-dark-500">
                  {format(new Date(partner.created_at), 'd MMM', { locale: ru })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {(showModal || editingPartner) && (
        <PartnerModal
          partner={editingPartner}
          onClose={() => {
            setShowModal(false);
            setEditingPartner(undefined);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Partners;

