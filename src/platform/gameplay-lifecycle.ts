import type { PlatformAdapter } from './platform-adapter';

export class GameplayLifecycle {
  private readonly pauseReasons = new Set<string>();
  private appliedActive: boolean | undefined;
  private syncChain: Promise<void> = Promise.resolve();

  public constructor(private readonly platform: PlatformAdapter) {}

  public get isActive(): boolean {
    return this.pauseReasons.size === 0;
  }

  public async start(): Promise<void> {
    await this.sync(true);
  }

  public async pause(reason: string): Promise<void> {
    if (!reason) return;
    this.pauseReasons.add(reason);
    await this.sync(false);
  }

  public async resume(reason: string): Promise<void> {
    this.pauseReasons.delete(reason);
    await this.sync(this.isActive);
  }

  private async sync(active: boolean): Promise<void> {
    if (this.appliedActive === active) return this.syncChain;
    this.appliedActive = active;
    this.syncChain = this.syncChain
      .catch(() => undefined)
      .then(() => this.platform.setGameplayActive(active))
      .catch((error) => {
        console.warn('Platform gameplay lifecycle signal failed.', error);
      });
    await this.syncChain;
  }
}
