import { CommandType, ICommand, IStyleSheet, ThemeService } from '@univerjs/core';
import { IAccessor } from '@wendellhu/redi';

export interface IThemeCommandParams {
    value?: IStyleSheet;
}

export const ThemeOperation: ICommand = {
    id: 'debugger.operation.theme',
    type: CommandType.COMMAND,
    handler: async (accessor: IAccessor, params: IThemeCommandParams) => {
        const themeService = accessor.get(ThemeService);

        params.value && themeService.setTheme(params.value);
        return true;
    },
};
