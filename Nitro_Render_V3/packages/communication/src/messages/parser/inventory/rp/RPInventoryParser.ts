import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';
import { RPInventoryItemParser } from './RPInventoryItemParser';

export class RPInventoryParser implements IMessageParser {
    private _items: RPInventoryItemParser[];

    public flush(): boolean {
        this._items = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean {
        if(!wrapper) return false;

        this._items = [];
        let count = wrapper.readInt();
        while(count > 0) {
            this._items.push(new RPInventoryItemParser(wrapper));
            count--;
        }
        return true;
    }

    public get items(): RPInventoryItemParser[] {
        return this._items;
    }
}
