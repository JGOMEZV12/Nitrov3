import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { RPInventoryParser } from '../../../parser/inventory/rp/RPInventoryParser';

export class RPInventoryEvent extends MessageEvent implements IMessageEvent {
    constructor(callBack: Function) {
        super(callBack, RPInventoryParser);
    }

    public getParser(): RPInventoryParser {
        return this.parser as RPInventoryParser;
    }
}
