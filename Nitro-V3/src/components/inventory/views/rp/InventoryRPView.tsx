import
{
    IRPInventoryItemData,
    EquipRPItemComposer,
    AddLinkEventTracker,
    ILinkEventTracker,
    RemoveLinkEventTracker,
} from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue, LocalizeText, SendMessageComposer } from '../../../../api';
import { AutoGrid, Flex, LayoutGridItem, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useRPInventory } from '../../../../hooks';
import './InventoryRPView.scss';

export const InventoryRPView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { items = [], equipItem = null, unequipItem = null } = useRPInventory();

    const onClose = () => setIsVisible(false);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'inventory-rp/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const isEquipped = (item: any) => (typeof item.equipado === 'function' ? item.equipado() : item.equipado);

    const equippedWeapon = items.find(item => isEquipped(item) && item.tipo === 'weapon');
    const equippedArmor = items.find(item => isEquipped(item) && item.tipo === 'armor');

    const onItemClick = (item: IRPInventoryItemData) =>
    {
        if(item.tipo == 'others')
        {
            SendMessageComposer(new EquipRPItemComposer(item.name));
        }
        
        if(!item.equipable) return;

        if(isEquipped(item))
        {
            unequipItem(item);
        }
        else
        {
            equipItem(item);
        }
    }

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="rp-inventory" className="nitro-rp-inventory">
            <NitroCardHeaderView headerText={ LocalizeText('inventory.rp.title') } onCloseClick={ onClose } />
            <NitroCardContentView overflow="hidden">
                <Flex justifyContent="center" gap={ 2 } className="mb-2 equipped-slots">
                    <EquippedSlot item={ equippedWeapon } onClick={ () => equippedWeapon && unequipItem(equippedWeapon) } />
                    <EquippedSlot item={ equippedArmor } onClick={ () => equippedArmor && unequipItem(equippedArmor) } />
                </Flex>
                <AutoGrid gap={ 1 } columnCount={ 5 }>
                    { items.filter(item => !isEquipped(item)).map(item => (
                        <RPItemView key={ item.id } item={ item } onClick={ () => onItemClick(item) } />
                    )) }
                </AutoGrid>
            </NitroCardContentView>
        </NitroCardView>
    );
}

const EquippedSlot: FC<{ item: IRPInventoryItemData, onClick: () => void }> = ({ item, onClick }) =>
{
    return (
         <LayoutGridItem itemActive={ false } className="equipped-slot" onClick={ onClick } itemImage={ item ? GetConfigurationValue<string>('web.cdn.url') + `/images/consumibles/${ item.name }.png` : undefined } itemCount={ item?.cantidad || 0 } itemCountMinimum={ 1 }>
        </LayoutGridItem>
    );
}

const RPItemView: FC<{ item: IRPInventoryItemData, onClick: () => void }> = ({ item, onClick }) =>
{
    return (
        <LayoutGridItem itemActive={ false } onClick={ onClick } className="rp-item" itemImage={ GetConfigurationValue<string>('web.cdn.url') + `/images/consumibles/${ item.name }.png` } itemCount={ item.cantidad } />
    );
}
