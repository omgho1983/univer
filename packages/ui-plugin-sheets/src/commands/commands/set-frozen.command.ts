// TODO@wzhudev: some logic here should be moved to the controller

import {
    ISetFrozenMutationParams,
    SelectionManagerService,
    SetFrozenMutation,
    SetFrozenMutationFactory,
} from '@univerjs/base-sheets';
import {
    CommandType,
    ICommand,
    ICommandService,
    IUndoRedoService,
    IUniverInstanceService,
    RANGE_TYPE,
} from '@univerjs/core';
import { IAccessor } from '@wendellhu/redi';

import { ScrollManagerService } from '../../services/scroll-manager.service';

export const SetSelectionFrozenCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.set-selection-frozen',
    handler: async (accessor: IAccessor) => {
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const workbookId = univerInstanceService.getCurrentUniverSheetInstance().getUnitId();
        const worksheetId = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet().getSheetId();
        const commandService = accessor.get(ICommandService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const selections = selectionManagerService.getSelections();
        if (!selections) {
            return false;
        }
        const currentSelection = selections[selections?.length - 1];
        const { range } = currentSelection;
        const scrollManagerService = accessor.get(ScrollManagerService);
        const { sheetViewStartRow = 0, sheetViewStartColumn = 0 } = scrollManagerService.getCurrentScroll() || {};
        let startRow;
        let startColumn;
        let ySplit;
        let xSplit;
        const { startRow: selectRow, startColumn: selectColumn, rangeType } = range;
        // Frozen to Row
        if (rangeType === RANGE_TYPE.ROW) {
            startRow = selectRow;
            ySplit = selectRow - sheetViewStartRow;
            startColumn = -1;
            xSplit = 0;
            // Frozen to Column
        } else if (rangeType === RANGE_TYPE.COLUMN) {
            startRow = -1;
            ySplit = 0;
            startColumn = selectColumn;
            xSplit = selectColumn - sheetViewStartColumn;
            // Frozen to Range
        } else if (rangeType === RANGE_TYPE.NORMAL) {
            startRow = selectRow;
            ySplit = selectRow - sheetViewStartRow;
            startColumn = selectColumn;
            xSplit = selectColumn - sheetViewStartColumn;
            // Unexpected value
        } else {
            return false;
        }
        const redoMutationParams: ISetFrozenMutationParams = {
            workbookId,
            worksheetId,
            startRow,
            startColumn,
            xSplit,
            ySplit,
        };
        const undoMutationParams: ISetFrozenMutationParams = SetFrozenMutationFactory(accessor, redoMutationParams);

        const result = commandService.syncExecuteCommand(SetFrozenMutation.id, redoMutationParams);
        if (result) {
            undoRedoService.pushUndoRedo({
                unitID: workbookId,
                undoMutations: [{ id: SetFrozenMutation.id, params: undoMutationParams }],
                redoMutations: [{ id: SetFrozenMutation.id, params: redoMutationParams }],
            });
            return true;
        }
        return true;
    },
};
