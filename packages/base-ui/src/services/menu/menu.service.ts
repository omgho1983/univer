import { Disposable, toDisposable } from '@univerjs/core';
import { createIdentifier, IDisposable } from '@wendellhu/redi';
import { debounceTime, Observable, Subject } from 'rxjs';

import { IShortcutService } from '../shortcut/shortcut.service';
import { IDisplayMenuItem, IMenuItem, MenuPosition } from './menu';

export const IMenuService = createIdentifier<IMenuService>('univer.menu-service');

export interface IMenuService {
    menuChanged$: Observable<void>;

    addMenuItem(item: IMenuItem): IDisposable;

    /** Get menu items for display at a given position or a submenu. */
    getMenuItems(position: MenuPosition | string): Array<IDisplayMenuItem<IMenuItem>>;
    getMenuItem(id: string): IMenuItem | null;
}

export class DesktopMenuService extends Disposable implements IMenuService {
    private readonly _menuItemMap = new Map<string, IMenuItem>();

    private readonly _menuByPositions = new Map<MenuPosition | string, Array<[string, IMenuItem]>>();

    private _menuChanged$ = new Subject<void>();

    menuChanged$ = this._menuChanged$.asObservable().pipe(debounceTime(0));

    constructor(@IShortcutService private readonly _shortcutService: IShortcutService) {
        super();
    }

    override dispose(): void {
        this._menuItemMap.clear();
        this._menuChanged$.complete();
    }

    addMenuItem(item: IMenuItem): IDisposable {
        if (this._menuItemMap.has(item.id)) {
            throw new Error(`Menu item with the same id ${item.id} has already been added!`);
        }

        this._menuItemMap.set(item.id, item);

        if (Array.isArray(item.positions)) {
            item.positions.forEach((menu) => this.appendMenuToPosition(item, menu));
        } else {
            this.appendMenuToPosition(item, item.positions);
        }

        this._menuChanged$.next();

        return toDisposable(() => {
            this._menuItemMap.delete(item.id);

            if (Array.isArray(item.positions)) {
                item.positions.forEach((menu) => {
                    const menus = this._menuByPositions.get(menu);
                    if (!menus) {
                        return;
                    }

                    const index = menus.findIndex((m) => m[0] === item.id);
                    if (index > -1) {
                        menus.splice(index, 1);
                    }
                });
            } else {
                const menus = this._menuByPositions.get(item.positions);
                if (!menus) {
                    return;
                }

                const index = menus.findIndex((m) => m[0] === item.id);
                if (index > -1) {
                    menus.splice(index, 1);
                }
            }

            this._menuChanged$.next();
        });
    }

    getMenuItems(positions: MenuPosition | string): Array<IDisplayMenuItem<IMenuItem>> {
        // TODO: @wzhudev: compose shortcut to returned menu items.
        if (this._menuByPositions.has(positions)) {
            const menuItems = this._menuByPositions.get(positions);

            if (menuItems) {
                // const _this = this;
                // const result = menuItems.map(function walk([id, item]) {
                //     const menuItem = _this.getDisplayMenuItems(item);
                //
                //     const subMenu = _this._menuByPositions.get(id);
                //     if (subMenu) {
                //         menuItem.children = subMenu.map(walk);
                //         return menuItem;
                //     }
                //
                //     return menuItem;
                // });
                //
                // console.log(result);

                return [...menuItems.values()].map((menu) => this.getDisplayMenuItems(menu[1]));
            }
        }

        return [] as Array<IDisplayMenuItem<IMenuItem>>;
    }

    getMenuItem(id: string): IMenuItem | null {
        if (this._menuItemMap.has(id)) {
            return this._menuItemMap.get(id)!;
        }

        return null;
    }

    private getDisplayMenuItems(menuItem: IMenuItem): IDisplayMenuItem<IMenuItem> {
        const shortcut = this._shortcutService.getCommandShortcut(menuItem.id);
        if (!shortcut) {
            return menuItem;
        }

        return {
            ...menuItem,
            shortcut,
        };
    }

    private appendMenuToPosition(menu: IMenuItem, position: MenuPosition | string) {
        if (!this._menuByPositions.has(position)) {
            this._menuByPositions.set(position, []);
        }

        const menuList = this._menuByPositions.get(position)!;
        if (menuList.findIndex((m) => m[0] === menu.id) > -1) {
            throw new Error(`Menu item with the same id ${menu.id} has already been added!`);
        }

        menuList.push([menu.id, menu]);
    }
}
