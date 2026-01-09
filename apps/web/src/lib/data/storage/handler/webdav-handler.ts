/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { BaseStorageHandler } from '$lib/data/storage/handler/base-handler';
import type { ReplicationDeleteResult } from '$lib/functions/replication/replication-progress';
import type {
  BooksDbAudioBook,
  BooksDbBookData,
  BooksDbBookmarkData,
  BooksDbReadingGoal,
  BooksDbStatistic,
  BooksDbSubtitleData
} from '$lib/data/database/books-db/versions/books-db';
import type { BookCardProps } from '$lib/components/book-card/book-card-props';
import type { MergeMode } from '$lib/data/merge-mode';

export class WebdavStorageHandler extends BaseStorageHandler {
  areReadingGoalsPresentAndUpToDate(referenceFilename: string | undefined): Promise<boolean> {
    console.log(`Reading goals presented for ${referenceFilename}`);
    return Promise.resolve(false);
  }

  areStatisticsPresentAndUpToDate(referenceFilename: string | undefined): Promise<boolean> {
    console.log(`Reading goals presented for ${referenceFilename}`);
    return Promise.resolve(false);
  }

  clearData(clearAll?: boolean): void {
    console.log(`Clear all data for ${clearAll}`);
  }

  deleteBookData(
    booksToDelete: string[],
    cancelSignal: AbortSignal,
    keepLocalStatistics: boolean
  ): Promise<ReplicationDeleteResult> {
    console.log(
      `Reading goals deleted for ${booksToDelete} and ${cancelSignal} and  ${keepLocalStatistics}`
    );
    return Promise.resolve(undefined as never);
  }

  getAudioBook(): Promise<BooksDbAudioBook | File | undefined> {
    return Promise.resolve(undefined as never);
  }

  getBook(): Promise<Omit<BooksDbBookData, 'id'> | File | undefined> {
    return Promise.resolve(undefined as never);
  }

  getBookList(): Promise<BookCardProps[]> {
    return Promise.resolve([]);
  }

  getCover(): Promise<Blob | undefined> {
    return Promise.resolve(undefined as never);
  }

  getFilenameForRecentCheck(fileIdentifier: string): Promise<string | undefined> {
    console.log(`Reading filename for ${fileIdentifier}`);
    return Promise.resolve(undefined as never);
  }

  getProgress(): Promise<BooksDbBookmarkData | File | undefined> {
    return Promise.resolve(undefined);
  }

  getReadingGoals(): Promise<{
    readingGoals: BooksDbReadingGoal[] | undefined;
    lastGoalModified: number;
  }> {
    return Promise.resolve({ lastGoalModified: 0, readingGoals: undefined });
  }

  getStatistics(): Promise<{
    statistics: BooksDbStatistic[] | undefined;
    lastStatisticModified: number;
  }> {
    return Promise.resolve({ lastStatisticModified: 0, statistics: undefined });
  }

  getSubtitleData(): Promise<BooksDbSubtitleData | File | undefined> {
    return Promise.resolve(undefined);
  }

  isAudioBookPresentAndUpToDate(referenceFilename: string | undefined): Promise<boolean> {
    console.log(`Reading goals presented for ${referenceFilename}`);
    return Promise.resolve(false);
  }

  isBookPresentAndUpToDate(referenceFilename: string | undefined): Promise<boolean> {
    console.log(`Reading goals presented for ${referenceFilename}`);
    return Promise.resolve(false);
  }

  isProgressPresentAndUpToDate(referenceFilename: string | undefined): Promise<boolean> {
    console.log(`Reading goals presented for ${referenceFilename}`);
    return Promise.resolve(false);
  }

  isSubtitleDataPresentAndUpToDate(referenceFilename: string | undefined): Promise<boolean> {
    console.log(`Reading goals presented for ${referenceFilename}`);
    return Promise.resolve(false);
  }

  prepareBookForReading(): Promise<number> {
    return Promise.resolve(0);
  }

  saveAudioBook(data: BooksDbAudioBook | File): Promise<void> {
    console.log(`Reading goals saved for ${data}`);
    return Promise.resolve(undefined);
  }

  saveBook(
    data: Omit<BooksDbBookData, 'id'> | File,
    skipTimestampFallback?: boolean,
    removeStorageContext?: boolean
  ): Promise<number> {
    console.log(
      `Reading goals saved for ${data} and ${skipTimestampFallback} and ${removeStorageContext}`
    );
    return Promise.resolve(0);
  }

  saveCover(data: Blob | undefined): Promise<void> {
    console.log(`Reading goals saved for ${data}`);
    return Promise.resolve(undefined);
  }

  saveProgress(data: BooksDbBookmarkData | File): Promise<void> {
    console.log(`Reading goals saved for ${data}`);
    return Promise.resolve(undefined);
  }

  saveReadingGoals(data: BooksDbReadingGoal[], lastGoalModified: number): Promise<void> {
    console.log(`Reading goals saved for ${data} and ${lastGoalModified} and ${lastGoalModified}`);
    return Promise.resolve(undefined);
  }

  saveStatistics(data: BooksDbStatistic[], lastStatisticModified: number): Promise<void> {
    console.log(
      `Reading goals saved for ${data} and ${lastStatisticModified} and ${lastStatisticModified}`
    );
    return Promise.resolve(undefined);
  }

  saveSubtitleData(data: BooksDbSubtitleData | File): Promise<void> {
    console.log(`Reading goals saved for ${data}`);
    return Promise.resolve(undefined);
  }

  updateLastRead(book: BooksDbBookData): Promise<void> {
    console.log(`Reading goals updated for ${book}`);
    return Promise.resolve(undefined);
  }

  updateSettings(
    window: Window,
    isForBrowser: boolean,
    saveBehavior: string,
    statisticsMergeMode: MergeMode,
    readingGoalsMergeMode: MergeMode,
    cacheStorageData: boolean,
    askForStorageUnlock: boolean,
    storageSourceName: string
  ): void {
    console.log(
      `Reading goals updated for ${window} and ${isForBrowser} and ${saveBehavior} and ${statisticsMergeMode} and ${readingGoalsMergeMode} and ${cacheStorageData} and ${askForStorageUnlock} and ${storageSourceName}`
    );
  }
}
