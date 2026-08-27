import Phaser from 'phaser';
import type { GameStore } from '../domain/game-store';
import { MainScene } from './main-scene';

export function createPhaserGame(parent: string, store: GameStore): Phaser.Game {
  const scene = new MainScene(store);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#17191e',
    transparent: false,
    render: {
      antialias: true,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [scene],
  });
}
