import { IMessageComposer } from '../../../../../../api';

export class GetRPInventoryComposer implements IMessageComposer<[]> {
    private _data: [];

    constructor() {
        this._data = [];
    }

    public getMessageArray() {
        return this._data;
    }

    public dispose(): void {
        return;
    }
}
