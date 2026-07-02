import { AutoDetectOptions, Renderer, Texture, autoDetectRenderer } from 'pixi.js';

let renderer: Renderer = null;

const patchGlTextureSystem = (r: Renderer): void =>
{
    const textureSystem = (r as any).texture;

    if(!textureSystem) return;

    const proto = Object.getPrototypeOf(textureSystem);

    if(!proto) return;

    const origUpdateStyle = proto.updateStyle;

    if(origUpdateStyle && !proto.__patchedUpdateStyle)
    {
        proto.updateStyle = function(source: any, firstCreation: boolean)
        {
            if(!source || source.destroyed || !source.style) return;

            return origUpdateStyle.call(this, source, firstCreation);
        };

        proto.__patchedUpdateStyle = true;
    }

    const origBindSource = proto.bindSource;

    if(origBindSource && !proto.__patchedBindSource)
    {
        proto.bindSource = function(source: any, location = 0)
        {
            if(!source || source.destroyed || !source.style)
            {
                source = Texture.EMPTY.source;
            }

            return origBindSource.call(this, source, location);
        };

        proto.__patchedBindSource = true;
    }
};

export const PrepareRenderer = async (options: Partial<AutoDetectOptions>): Promise<Renderer> =>
{
    renderer = await autoDetectRenderer(options);

    renderer.events?.destroy();

    patchGlTextureSystem(renderer);

    return renderer;
};

export const GetRenderer = () => renderer;
