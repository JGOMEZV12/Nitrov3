import { IMessageDataWrapper } from '../../../../../../api';
import { IRPInventoryItemData } from './IRPInventoryItemData';

export class RPInventoryItemParser implements IRPInventoryItemData {
    private _id: number;
    private _name: string;
    private _cantidad: number;
    private _tipo: string;
    private _equipable: boolean;
    private _equipado: boolean;

    constructor(wrapper: IMessageDataWrapper) {
        if(!wrapper) throw new Error('invalid_wrapper');

        this._id = wrapper.readInt();
        this._name = wrapper.readString();
        this._cantidad = wrapper.readInt();
        this._tipo = wrapper.readString();
        this._equipable = wrapper.readBoolean();
        this._equipado = wrapper.readBoolean();
    }

    public get id(): number { return this._id; }
    public get name(): string { return this._name; }
    public get cantidad(): number { return this._cantidad; }
    public get tipo(): string { return this._tipo; }
    public get equipable(): boolean { return this._equipable; }
    public get equipado(): boolean { return this._equipado; }

    public isEquipped(): boolean {
        return this._equipado;
    }
}
