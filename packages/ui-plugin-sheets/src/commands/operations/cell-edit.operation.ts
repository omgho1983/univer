// This file provide operations to change selection of sheets.

import { CommandType, IOperation } from '@univerjs/core';

import { IEditorBridgeService, IEditorBridgeServiceVisibleParam } from '../../services/editor-bridge.service';

export const SetCellEditVisibleOperation: IOperation<IEditorBridgeServiceVisibleParam> = {
    id: 'sheet.operation.set-cell-edit-visible',
    type: CommandType.OPERATION,
    handler: (accessor, params) => {
        const editorBridgeService = accessor.get(IEditorBridgeService);

        if (params == null) {
            return false;
        }

        editorBridgeService.changeVisible(params);

        return true;
    },
};

export const SetCellEditVisibleArrowOperation: IOperation<IEditorBridgeServiceVisibleParam> = {
    id: 'sheet.operation.set-cell-edit-visible-arrow',
    type: CommandType.OPERATION,
    handler: (accessor, params) => true,
};
