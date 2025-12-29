import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, ExternalLink, Edit2, Trash2, X, Filter, Globe } from 'lucide-react';
import { offersApi, partnersApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { Offer, Partner, geoOptions } from '../types';
import GeoSelect from '../components/GeoSelect';
import toast from 'react-hot-toast';

interface OfferFormData {
  partner_id: string;
  name: string;
  theme: string;
  geo: string;
  partner_link: string;
  landing_price: string;
  promo_link: string;
  payout: string;
}

function OfferModal({
  offer,
  partners,
  onClose,
  onSave,
}: {
  offer?: Offer;
  partners: Partner[];
  onClose: () => void;
  onSave: (data: OfferFormData) => void;
}) {
  const [formData, setFormData] = useState<OfferFormData>({
    partner_id: offer?.partner_id || partners[0]?.id || '',
    name: offer?.name || '',
    theme: offer?.theme || '',
    geo: offer?.geo || '',
    partner_link: offer?.partner_link || '',
    landing_price: offer?.landing_price || '',
    promo_link: offer?.promo_link || '',
    payout: offer?.payout || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partner_id || !formData.name.trim() || !formData.theme.trim() || !formData.geo) {
      toast.error('Заполните обязательные поля');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-card w-full h-full sm:h-auto sm:max-w-2xl p-4 sm:p-6 animate-scale-in sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-dark-100">
            {offer ? 'Редактировать оффер' : 'Новый оффер'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors p-2 -mr-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Партнёрка *
              </label>
              <select
                value={formData.partner_id}
                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                className="glass-input w-full"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass-input w-full"
                placeholder="Название оффера"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Тематика *
              </label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="glass-input w-full"
                placeholder="Суставы/гипер/паразиты/похудение"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                GEO *
              </label>
              <GeoSelect
                value={formData.geo}
                onChange={(geo) => setFormData({ ...formData, geo })}
                placeholder="Выберите GEO..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Ставка/Апп
              </label>
              <input
                type="text"
                value={formData.payout}
                onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                className="glass-input w-full"
                placeholder="50$/dep"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Цена на ленде
              </label>
              <input
                type="text"
                value={formData.landing_price}
                onChange={(e) => setFormData({ ...formData, landing_price: e.target.value })}
                className="glass-input w-full"
                placeholder="500 руб"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Ссылка в ПП
            </label>
            <input
              type="url"
              value={formData.partner_link}
              onChange={(e) => setFormData({ ...formData, partner_link: e.target.value })}
              className="glass-input w-full"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Ссылка на промо
            </label>
            <input
              type="url"
              value={formData.promo_link}
              onChange={(e) => setFormData({ ...formData, promo_link: e.target.value })}
              className="glass-input w-full"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              {offer ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Карточка оффера для мобильных
function OfferCard({
  offer,
  onEdit,
  onDelete,
  canManage,
  isAdmin,
}: {
  offer: Offer;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark-100 truncate">{offer.name}</h3>
          <p className="text-sm text-dark-400 truncate">{offer.partner_name}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={onDelete}
                className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-md border border-primary-500/20">
          {offer.theme}
        </span>
        {offer.geo && (
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {geoOptions.find(g => g.code === offer.geo)?.label || offer.geo.toUpperCase()}
          </span>
        )}
        {offer.payout && (
          <span className="text-green-400 font-mono text-sm">{offer.payout}</span>
        )}
        {offer.landing_price && (
          <span className="text-dark-400 font-mono text-sm">{offer.landing_price}</span>
        )}
      </div>

      {(offer.partner_link || offer.promo_link) && (
        <div className="mt-3 pt-3 border-t border-dark-700/50 flex gap-3">
          {offer.partner_link && (
            <a
              href={offer.partner_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              ПП
            </a>
          )}
          {offer.promo_link && (
            <a
              href={offer.promo_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Промо
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Offers() {
  const { canManageOffers, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>();
  const [filterPartnerId, setFilterPartnerId] = useState<string>('');
  const [filterGeo, setFilterGeo] = useState<string>('');
  const [filterTheme, setFilterTheme] = useState<string>('');

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: partnersApi.getAll,
  });

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['offers', filterPartnerId],
    queryFn: () => offersApi.getAll(filterPartnerId || undefined),
  });

  const createMutation = useMutation({
    mutationFn: offersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setShowModal(false);
      toast.success('Оффер создан');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OfferFormData }) =>
      offersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setEditingOffer(undefined);
      toast.success('Оффер обновлён');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка обновления');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: offersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Оффер удалён');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления');
    },
  });

  const handleSave = (data: OfferFormData) => {
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (offer: Offer) => {
    if (confirm(`Удалить оффер "${offer.name}"?`)) {
      deleteMutation.mutate(offer.id);
    }
  };

  // Получаем уникальные тематики из офферов
  const uniqueThemes = [...new Set(offers.map(o => o.theme).filter(Boolean))].sort();
  
  // Получаем уникальные GEO из офферов
  const uniqueGeos = [...new Set(offers.map(o => o.geo).filter(Boolean) as string[])].sort();

  // Применяем фильтры
  let filteredOffers = offers;
  
  if (filterGeo) {
    filteredOffers = filteredOffers.filter(o => o.geo === filterGeo);
  }
  
  if (filterTheme) {
    filteredOffers = filteredOffers.filter(o => o.theme === filterTheme);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4 animate-slide-down">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2 sm:gap-3">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
            Офферы
          </h1>
          <p className="text-dark-400 mt-1 text-sm hidden sm:block">
            Каталог офферов по партнёркам
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
          {/* Filters */}
          <Filter className="w-4 h-4 text-dark-400 hidden sm:block" />
          
          <select
            value={filterPartnerId}
            onChange={(e) => setFilterPartnerId(e.target.value)}
            className="glass-input py-2 px-3 text-sm"
          >
            <option value="">Все партнёрки</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filterGeo}
            onChange={(e) => setFilterGeo(e.target.value)}
            className="glass-input py-2 px-3 text-sm"
          >
            <option value="">Все GEO</option>
            {uniqueGeos.map((geo) => (
              <option key={geo} value={geo}>
                {geoOptions.find(g => g.code === geo)?.label || geo.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filterTheme}
            onChange={(e) => setFilterTheme(e.target.value)}
            className="glass-input py-2 px-3 text-sm"
          >
            <option value="">Все тематики</option>
            {uniqueThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
          {canManageOffers() && partners.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4">
              <div className="skeleton h-5 w-48 rounded mb-2" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300">Сначала добавьте партнёрку</h3>
          <p className="text-dark-500 mt-1 text-sm">
            Офферы привязываются к партнёркам
          </p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300">
            {offers.length === 0 ? 'Нет офферов' : 'Ничего не найдено'}
          </h3>
          <p className="text-dark-500 mt-1 text-sm">
            {offers.length === 0 
              ? (canManageOffers() ? 'Добавьте первый оффер' : 'Офферы пока не добавлены')
              : 'Попробуйте изменить фильтры'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filteredOffers.map((offer, index) => (
              <div key={offer.id} style={{ animationDelay: `${index * 30}ms` }}>
                <OfferCard
                  offer={offer}
                  onEdit={() => setEditingOffer(offer)}
                  onDelete={() => handleDelete(offer)}
                  canManage={canManageOffers()}
                  isAdmin={hasRole('admin')}
                />
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Название</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Партнёрка</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Тематика</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">GEO</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Ставка</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Цена</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Ссылки</th>
                  {canManageOffers() && (
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Действия</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer, index) => (
                  <tr 
                    key={offer.id} 
                    className="table-row animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-dark-100">{offer.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-dark-300">{offer.partner_name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded-md border border-primary-500/20">
                        {offer.theme}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {offer.geo ? (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20">
                          {geoOptions.find(g => g.code === offer.geo)?.label || offer.geo.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-dark-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-400 font-mono text-sm">
                        {offer.payout || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-dark-300 font-mono text-sm">
                        {offer.landing_price || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        {offer.partner_link && (
                          <a
                            href={offer.partner_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            ПП
                          </a>
                        )}
                        {offer.promo_link && (
                          <a
                            href={offer.promo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Промо
                          </a>
                        )}
                        {!offer.partner_link && !offer.promo_link && (
                          <span className="text-dark-500 text-sm">—</span>
                        )}
                      </div>
                    </td>
                    {canManageOffers() && (
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {hasRole('admin') && (
                            <button
                              onClick={() => handleDelete(offer)}
                              className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {(showModal || editingOffer) && partners.length > 0 && (
        <OfferModal
          offer={editingOffer}
          partners={partners}
          onClose={() => {
            setShowModal(false);
            setEditingOffer(undefined);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Offers;
