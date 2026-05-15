import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hitCount: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(
    maxSize: number = 1000,
    ttlMs: number = 60 * 60 * 1000, // 1 hora default
  ) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Get cached value or null si no existe/expiró
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.store.delete(key);
      this.logger.debug(`⏱️ Cache expired: ${key}`);
      return null;
    }

    entry.hitCount++;
    return entry.value;
  }

  /**
   * Set cache entry. Auto-evict LRU si > maxSize
   */
  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
      hitCount: 0,
    });

    if (this.store.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Hash buffer para usar como key (CAPTCHA image → SHA256)
   */
  hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (
        entry.hitCount < minHits ||
        (entry.hitCount === minHits && entry.timestamp < oldestTime)
      ) {
        lruKey = key;
        minHits = entry.hitCount;
        oldestTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.store.delete(lruKey);
      this.logger.debug(
        `🗑️ LRU evicted (size=${this.store.size}): ${lruKey.substring(0, 8)}...`,
      );
    }
  }

  clear(): void {
    this.store.clear();
    this.logger.log('🗑️ Cache cleared');
  }

  stats(): { size: number; maxSize: number } {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
    };
  }
}
