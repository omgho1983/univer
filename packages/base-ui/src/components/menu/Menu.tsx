import { isRealNum } from '@univerjs/core';
import {
    Menu as DesignMenu,
    MenuItem as DesignMenuItem,
    MenuItemGroup as DesignMenuItemGroup,
    SubMenu as DesignSubMenu,
} from '@univerjs/design';
import { MoreSingle } from '@univerjs/icons';
import { useDependency } from '@wendellhu/redi/react-bindings';
import clsx from 'clsx';
import React, { useState } from 'react';
import { isObservable, of } from 'rxjs';

import { ComponentManager } from '../../Common';
import {
    ICustomComponentOption,
    IDisplayMenuItem,
    IMenuButtonItem,
    IMenuItem,
    IMenuSelectorItem,
    isValueOptions,
    IValueOption,
    MenuGroup,
    MenuItemDefaultValueType,
    MenuItemType,
} from '../../services/menu/menu';
import { IMenuService } from '../../services/menu/menu.service';
import { CustomLabel } from '../custom-label/CustomLabel';
import { useObservable } from '../hooks/observable';
import styles from './index.module.less';

// TODO: @jikkai disabled and hidden are not working

export interface IBaseMenuProps {
    parentKey?: string | number;
    menuType?: string | string[];

    value?: string | number;
    options?: Array<IValueOption | ICustomComponentOption>;

    onOptionSelect?: (option: IValueOption) => void;
}

function MenuWrapper(props: IBaseMenuProps) {
    const { menuType, onOptionSelect } = props;
    const menuService = useDependency(IMenuService);

    if (!menuType) return;

    if (Array.isArray(menuType)) {
        const menuTypes = menuType.map((type) => menuService.getMenuItems(type));

        const group = menuTypes.map((menuItems) =>
            menuItems.reduce(
                (acc, item: IDisplayMenuItem<IMenuItem>) => {
                    if (item.group) {
                        acc[item.group] = acc[item.group] ?? [];
                        acc[item.group].push(item);
                    } else {
                        acc[MenuGroup.CONTEXT_MENU_OTHERS] = acc[MenuGroup.CONTEXT_MENU_OTHERS] ?? [];
                        acc[MenuGroup.CONTEXT_MENU_OTHERS].push(item);
                    }
                    return acc;
                },
                {} as Record<MenuGroup, Array<IDisplayMenuItem<IMenuItem>>>
            )
        );

        return (
            <>
                {group.map((groupItem) =>
                    Object.keys(groupItem).map((groupKey: string) => (
                        <DesignMenuItemGroup key={groupKey} eventKey={groupKey}>
                            {groupItem[groupKey as unknown as MenuGroup].map((item: IDisplayMenuItem<IMenuItem>) => (
                                <MenuItem
                                    key={item.id}
                                    menuItem={item}
                                    onClick={(object: Partial<IValueOption>) => {
                                        onOptionSelect?.({ value: '', label: item.id, ...object });
                                    }}
                                />
                            ))}
                        </DesignMenuItemGroup>
                    ))
                )}
            </>
        );
    }

    const menuItems = menuService.getMenuItems(menuType);

    return menuItems.map((item: IDisplayMenuItem<IMenuItem>) => (
        <MenuItem
            key={item.id}
            menuItem={item}
            onClick={(object: Partial<IValueOption>) => {
                onOptionSelect?.({ value: '', label: item.id, ...object });
            }}
        />
    ));
}

function MenuOptionsWrapper(props: IBaseMenuProps) {
    const { options, value, onOptionSelect, parentKey } = props;

    const componentManager = useDependency(ComponentManager);

    return options?.map((option: IValueOption | ICustomComponentOption, index: number) => {
        const isValueOption = isValueOptions(option);
        const key = `${parentKey}-${isValueOption ? option.label : option.id}-${index}`;

        if (isValueOption) {
            return (
                <DesignMenuItem
                    key={key}
                    eventKey={key}
                    onClick={() => {
                        onOptionSelect?.({
                            ...option,
                        });
                    }}
                >
                    <span className={styles.menuItemContent}>
                        <CustomLabel
                            selected={String(value) === String(option.value)} // use √ for select
                            value={String(option.value)}
                            label={option.label}
                            title={typeof option.label === 'string' ? option.label : ''}
                            icon={option.icon}
                        />
                    </span>
                </DesignMenuItem>
            );
        }

        const CustomComponent = componentManager.get(option.id) as React.ComponentType<any>;

        return (
            <DesignMenuItem key={key} eventKey={key} className={clsx(styles.menuItemCustom)}>
                <CustomComponent
                    onValueChange={(v: string | number) => {
                        onOptionSelect?.({
                            value: v,
                            label: option.id,
                        });
                    }}
                />
            </DesignMenuItem>
        );
    });
}

export const Menu = (props: IBaseMenuProps) => (
    <DesignMenu selectable={false}>
        <MenuOptionsWrapper {...props} />
        <MenuWrapper {...props} />
    </DesignMenu>
);

interface IMenuItemProps {
    menuItem: IDisplayMenuItem<IMenuItem>;
    onClick: (params: Partial<IValueOption>) => void;
}

function MenuItem({ menuItem, onClick }: IMenuItemProps) {
    const menuService = useDependency(IMenuService);

    const menuItems = menuItem.id ? menuService.getMenuItems(menuItem.id) : [];

    const disabled = useObservable<boolean>(menuItem.disabled$ || of(false), false, true);
    const hidden = useObservable(menuItem.hidden$ || of(false), false, true);
    const value = useObservable<MenuItemDefaultValueType>(menuItem.value$ || of(undefined), undefined, true);
    const [inputValue, setInputValue] = useState(value);

    /**
     * user input change value from CustomLabel
     * @param v
     */
    const onChange = (v: string | number) => {
        const newValue = isRealNum(v) && typeof v === 'string' ? parseInt(v) : v;
        setInputValue(newValue);
    };

    const renderButtonType = () => {
        const item = menuItem as IDisplayMenuItem<IMenuButtonItem>;
        const { title, label } = item;

        return (
            <DesignMenuItem
                key={item.id}
                eventKey={item.id}
                // disabled={disabled} // FIXME disabled is not working
                onClick={() => {
                    onClick({ value: inputValue, id: item.id }); // merge cell
                }}
            >
                <span className={styles.menuItemContent}>
                    <CustomLabel value={inputValue} title={title} label={label} icon={item.icon} onChange={onChange} />
                </span>
            </DesignMenuItem>
        );
    };

    const renderSelectorType = () => {
        const item = menuItem as IDisplayMenuItem<IMenuSelectorItem>;

        let selections: Array<IValueOption | ICustomComponentOption>;
        if (isObservable(item.selections)) {
            selections = useObservable<Array<IValueOption | ICustomComponentOption>>(
                item.selections || of([]),
                [],
                true
            );
        } else {
            selections = item.selections || [];
        }

        if (selections.length > 0) {
            return (
                <DesignSubMenu
                    key={item.id}
                    eventKey={item.id}
                    popupOffset={[18, 0]}
                    title={
                        <span className={styles.menuItemContent}>
                            <CustomLabel
                                title={item.title}
                                value={inputValue}
                                onChange={onChange}
                                icon={item.icon}
                                label={item.label}
                            />
                            {item.shortcut && ` (${item.shortcut})`}
                        </span>
                    }
                    expandIcon={<MoreSingle className={styles.menuItemMoreIcon} />}
                >
                    {selections.length > 0 && (
                        <MenuOptionsWrapper
                            parentKey={item.id}
                            menuType={item.id}
                            options={selections}
                            onOptionSelect={(v) => {
                                onClick({ value: v.value, id: item.id }); // border style don't trigger hide menu, set show true
                            }}
                        />
                    )}
                </DesignSubMenu>
            );
        }

        return (
            <DesignMenuItem key={item.id} eventKey={item.id}>
                <span className={styles.menuItemContent}>
                    <CustomLabel
                        title={item.title}
                        value={inputValue}
                        onChange={onChange}
                        icon={item.icon}
                        label={item.label}
                    />
                    {item.shortcut && ` (${item.shortcut})`}
                </span>
            </DesignMenuItem>
        );
    };

    const renderSubItemsType = () => {
        const item = menuItem as IDisplayMenuItem<IMenuSelectorItem>;

        return (
            <DesignSubMenu
                key={item.id}
                eventKey={item.id}
                popupOffset={[18, 0]}
                title={
                    <span className={styles.menuItemContent}>
                        <CustomLabel title={item.title} value={item.title} icon={item.icon} label={item.label} />
                    </span>
                }
                expandIcon={<MoreSingle className={styles.menuItemMoreIcon} />}
            >
                {menuItems.length && <MenuWrapper menuType={item.id} parentKey={item.id} onOptionSelect={onClick} />}
            </DesignSubMenu>
        );
    };

    if (hidden) {
        return null;
    }

    return (
        <>
            {menuItem.type === MenuItemType.SELECTOR && renderSelectorType()}
            {menuItem.type === MenuItemType.SUBITEMS && renderSubItemsType()}
            {menuItem.type === MenuItemType.BUTTON && renderButtonType()}
        </>
    );
}
