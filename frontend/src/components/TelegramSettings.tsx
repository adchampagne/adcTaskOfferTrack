import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '../api';

interface TelegramSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelegramSettings({ isOpen, onClose }: TelegramSettingsProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['telegram-link'],
    queryFn: telegramApi.getLink,
    enabled: isOpen,
  });

  const unlinkMutation = useMutation({
    mutationFn: telegramApi.unlink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-link'] });
      refetch();
    },
  });

  const testMutation = useMutation({
    mutationFn: telegramApi.sendTest,
  });

  const copyCode = async () => {
    if (data?.code) {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-800 sm:rounded-2xl rounded-none shadow-2xl w-full h-full sm:h-auto sm:max-w-md border-0 sm:border border-slate-700 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.057-.692-1.654-1.124-2.682-1.8-1.187-.78-.418-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.12.098.153.228.168.326.015.097.034.318.019.49z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Telegram</h3>
              <p className="text-slate-400 text-sm">Уведомления о задачах</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : data?.linked ? (
            // Telegram привязан
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">Telegram подключён</p>
                    {data.telegram_username && (
                      <p className="text-slate-400 text-sm">@{data.telegram_username}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-slate-300 text-sm">
                Вы будете получать уведомления о новых задачах, изменениях статуса и приближающихся дедлайнах.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {testMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Отправить тестовое уведомление
                    </>
                  )}
                </button>

                {testMutation.isSuccess && (
                  <p className="text-green-400 text-sm text-center">✓ Уведомление отправлено!</p>
                )}

                <button
                  onClick={() => {
                    if (confirm('Отвязать Telegram? Вы перестанете получать уведомления.')) {
                      unlinkMutation.mutate();
                    }
                  }}
                  disabled={unlinkMutation.isPending}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Отвязать Telegram
                </button>
              </div>
            </div>
          ) : (
            // Telegram не привязан
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-amber-400 font-semibold">Telegram не подключён</p>
                    <p className="text-slate-400 text-sm">Привяжите для получения уведомлений</p>
                  </div>
                </div>
              </div>

              {/* Код привязки */}
              {data?.code && (
                <div className="bg-slate-900 rounded-xl p-4 sm:p-6 text-center">
                  <p className="text-slate-400 text-sm mb-3">Ваш код привязки:</p>
                  <div 
                    onClick={copyCode}
                    className="text-3xl sm:text-4xl font-mono font-bold text-blue-400 tracking-[0.2em] sm:tracking-[0.3em] cursor-pointer hover:text-blue-300 transition-colors select-all"
                  >
                    {data.code}
                  </div>
                  <button
                    onClick={copyCode}
                    className="mt-3 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Нажмите, чтобы скопировать
                      </>
                    )}
                  </button>
                  <p className="text-slate-500 text-xs mt-3">Код действителен 10 минут</p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-white font-medium">Как подключить:</h4>
                <ol className="text-slate-300 text-sm space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">1</span>
                    <span>Откройте бота <a href="https://t.me/adcTasksBot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@adcTasksBot</a> в Telegram</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">2</span>
                    <span>Скопируйте код выше и отправьте его боту</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">3</span>
                    <span>Готово! Уведомления будут приходить в этот чат</span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-3">
                <a
                  href="https://t.me/adcTasksBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.057-.692-1.654-1.124-2.682-1.8-1.187-.78-.418-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.12.098.153.228.168.326.015.097.034.318.019.49z"/>
                  </svg>
                  Открыть бота
                </a>
                <button
                  onClick={() => refetch()}
                  className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors"
                  title="Обновить статус"
                >
                  🔄
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
