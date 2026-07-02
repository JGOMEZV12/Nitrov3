import { EquipRPItemComposer, GetRPInventoryComposer, IRPInventoryItemData, RPInventoryEvent, UnequipRPItemComposer } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

const useRPInventoryState = () =>
{
    const [ items, setItems ] = useState<IRPInventoryItemData[]>([]);
    const [ needsUpdate, setNeedsUpdate ] = useState(true);

    useMessageEvent<RPInventoryEvent>(RPInventoryEvent, event =>
    {
        const parser = event.getParser();

        setItems(parser.items.map(item => ({
            id: item.id,
            name: item.name,
            cantidad: item.cantidad,
            tipo: item.tipo,
            equipable: item.equipable,
            equipado_state: item.equipado,
            // satisfy user requirement for equipado() method
            equipado: function() { return this.equipado_state; }
        } as any)));
    });

    const updateInventory = useCallback(() =>
    {
        SendMessageComposer(new GetRPInventoryComposer());
    }, []);

    const equipItem = useCallback((item: IRPInventoryItemData) =>
    {
        SendMessageComposer(new EquipRPItemComposer(item.name));
        setItems(prevItems => prevItems.map(i => (i.id === item.id) ? { ...i, equipado_state: true } : i));
    }, []);

    const unequipItem = useCallback((item: IRPInventoryItemData) =>
    {
        SendMessageComposer(new UnequipRPItemComposer(item.name));
        setItems(prevItems => prevItems.map(i => (i.id === item.id) ? { ...i, equipado_state: false } : i));
    }, []);

    useEffect(() =>
    {
        if(needsUpdate)
        {
            updateInventory();
            setNeedsUpdate(false);
        }
    }, [ needsUpdate, updateInventory ]);

    return {
        items,
        setItems,
        updateInventory,
        equipItem,
        unequipItem,
        setNeedsUpdate
    };
}

export const useRPInventory = () => useBetween(useRPInventoryState);
