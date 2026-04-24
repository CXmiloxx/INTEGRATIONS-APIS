import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  chromium,
  LaunchOptions,
  Page,
} from 'playwright';

export interface RunInPageOptions {
  contextOptions?: BrowserContextOptions;
  navigationTimeoutMs?: number;
  defaultTimeoutMs?: number;
}

export type PageTask<T> = (page: Page, context: BrowserContext) => Promise<T>;

@Injectable()
export class PlaywrightService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightService.name);

  private browser: Browser | null = null;
  private launchPromise: Promise<Browser> | null = null;

  private readonly maxConcurrency = Math.max(
    1,
    Number(process.env.PLAYWRIGHT_MAX_CONCURRENCY ?? 5),
  );
  private readonly headless =
    (process.env.PLAYWRIGHT_HEADLESS ?? 'true') !== 'false';
  private readonly defaultNavTimeoutMs = Number(
    process.env.PLAYWRIGHT_NAV_TIMEOUT_MS ?? 30_000,
  );

  private active = 0;
  private readonly queue: Array<() => void> = [];

  async onModuleInit() {
    await this.getBrowser();
  }

  async onModuleDestroy() {
    const browser = this.browser;
    this.browser = null;
    this.launchPromise = null;
    if (browser) {
      await browser.close().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Error closing browser: ${msg}`);
      });
      this.logger.log('🛑 Browser cerrado');
    }
  }

  async runInPage<T>(
    task: PageTask<T>,
    opts: RunInPageOptions = {},
  ): Promise<T> {
    await this.acquire();
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    try {
      const browser = await this.getBrowser();
      context = await browser.newContext(opts.contextOptions);
      page = await context.newPage();
      page.setDefaultNavigationTimeout(
        opts.navigationTimeoutMs ?? this.defaultNavTimeoutMs,
      );
      if (opts.defaultTimeoutMs) {
        page.setDefaultTimeout(opts.defaultTimeoutMs);
      }
      return await task(page, context);
    } finally {
      if (page) await page.close().catch(() => undefined);
      if (context) await context.close().catch(() => undefined);
      this.release();
    }
  }

  async runBatch<T>(
    tasks: Array<PageTask<T>>,
    opts: RunInPageOptions = {},
  ): Promise<T[]> {
    return Promise.all(tasks.map((t) => this.runInPage(t, opts)));
  }

  async newContext(options?: BrowserContextOptions): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    return browser.newContext(options);
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    if (this.launchPromise) return this.launchPromise;

    const launchOpts: LaunchOptions = { headless: this.headless };
    this.launchPromise = chromium
      .launch(launchOpts)
      .then((browser) => {
        this.browser = browser;
        this.logger.log('🚀 Browser iniciado');
        browser.on('disconnected', () => {
          this.logger.warn('Browser disconnected');
          this.browser = null;
          this.launchPromise = null;
        });
        return browser;
      })
      .catch((err) => {
        this.launchPromise = null;
        throw err;
      });
    return this.launchPromise;
  }

  private acquire(): Promise<void> {
    if (this.active < this.maxConcurrency) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}
