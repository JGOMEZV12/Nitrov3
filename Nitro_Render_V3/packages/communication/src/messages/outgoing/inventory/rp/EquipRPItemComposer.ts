import { IMessageComposer } from '../../../../../../api';

export class EquipRPItemComposer implements IMessageComposer<[string]> {
    private _data: [string];

    constructor(name: string) {
        this._data = [name];
    }

    public getMessageArray() {
        return this._data;
    }

    public dispose(): void {
        return;
    }
}
