import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

interface RedirectStep {
  url: string;
  status: number;
  statusText: string;
  duration?: number;
}

interface RedirectResult {
  success: boolean;
  chain: RedirectStep[];
  finalUrl: string;
  totalRedirects: number;
  totalTime: number;
  error?: string;
}

// Проверка редиректов
router.post('/check-redirects', authenticateToken, async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL обязателен' });
  }

  // Валидация URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Некорректный URL' });
  }

  const chain: RedirectStep[] = [];
  let currentUrl = url;
  const maxRedirects = 20;
  const startTime = Date.now();

  try {
    for (let i = 0; i <= maxRedirects; i++) {
      const stepStart = Date.now();
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        clearTimeout(timeout);
        const stepDuration = Date.now() - stepStart;

        chain.push({
          url: currentUrl,
          status: response.status,
          statusText: response.statusText || getStatusText(response.status),
          duration: stepDuration,
        });

        // Если это редирект, получаем следующий URL
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            // Обрабатываем относительные URL
            try {
              currentUrl = new URL(location, currentUrl).toString();
            } catch {
              currentUrl = location;
            }
          } else {
            // Нет location header - конец цепочки
            break;
          }
        } else {
          // Не редирект - конец цепочки
          break;
        }
      } catch (fetchError: any) {
        clearTimeout(timeout);
        
        if (fetchError.name === 'AbortError') {
          chain.push({
            url: currentUrl,
            status: 0,
            statusText: 'Timeout',
            duration: 10000,
          });
        } else {
          chain.push({
            url: currentUrl,
            status: 0,
            statusText: fetchError.message || 'Error',
            duration: Date.now() - stepStart,
          });
        }
        break;
      }
    }

    const totalTime = Date.now() - startTime;
    const lastStep = chain[chain.length - 1];
    const success = lastStep && lastStep.status >= 200 && lastStep.status < 400;

    const result: RedirectResult = {
      success,
      chain,
      finalUrl: chain.length > 0 ? chain[chain.length - 1].url : url,
      totalRedirects: Math.max(0, chain.length - 1),
      totalTime,
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      chain: [],
      finalUrl: '',
      totalRedirects: 0,
      totalTime: Date.now() - startTime,
      error: error.message || 'Ошибка при проверке URL',
    });
  }
});

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return statusTexts[status] || 'Unknown';
}

export default router;

