import { describe, expect, it } from 'vitest';
import { ColorMatrix } from 'pixi.js';
import { normalizeCameraColorMatrix } from '../RoomCameraWidgetManager';

describe('normalizeCameraColorMatrix', () =>
{
    it('keeps explicit negative grayscale bias untouched', () =>
    {
        const matrix: ColorMatrix = [
            -0.5, -0.5, -0.5, 0, 1,
            -0.5, -0.5, -0.5, 0, 1,
            -0.5, -0.5, -0.5, 0, 1,
            0, 0, 0, 1, 0
        ];

        expect(normalizeCameraColorMatrix(matrix)).toEqual(matrix);
    });

    it('adds missing white bias for negative grayscale matrices', () =>
    {
        const matrix: ColorMatrix = [
            -0.5, -0.5, -0.5, 0, 0,
            -0.5, -0.5, -0.5, 0, 0,
            -0.5, -0.5, -0.5, 0, 0,
            0, 0, 0, 1, 0
        ];

        expect(normalizeCameraColorMatrix(matrix)).toEqual([
            -0.5, -0.5, -0.5, 0, 1,
            -0.5, -0.5, -0.5, 0, 1,
            -0.5, -0.5, -0.5, 0, 1,
            0, 0, 0, 1, 0
        ]);
    });

    it('normalizes legacy 255-based offsets to pixi range', () =>
    {
        const matrix: ColorMatrix = [
            1, 0, 0, 0, 255,
            0, 1, 0, 0, 128,
            0, 0, 1, 0, 64,
            0, 0, 0, 1, 255
        ];

        expect(normalizeCameraColorMatrix(matrix)).toEqual([
            1, 0, 0, 0, 1,
            0, 1, 0, 0, 128 / 255,
            0, 0, 1, 0, 64 / 255,
            0, 0, 0, 1, 1
        ]);
    });
});
