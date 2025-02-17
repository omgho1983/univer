import {
    AddMergeUndoMutationFactory,
    AddWorksheetMergeMutation,
    getAddMergeMutationRangeByType,
    IAddWorksheetMergeMutationParams,
    IRemoveWorksheetMergeMutationParams,
    ISetRangeValuesMutationParams,
    RemoveMergeUndoMutationFactory,
    RemoveWorksheetMergeMutation,
    SetRangeValuesMutation,
    SetRangeValuesUndoMutationFactory,
} from '@univerjs/base-sheets';
import { SetSelectionsOperation } from '@univerjs/base-sheets/commands/operations/selection.operation.js';
import {
    CommandType,
    ICellData,
    ICommand,
    ICommandInfo,
    ICommandService,
    IRange,
    IUndoRedoService,
    IUniverInstanceService,
    ObjectMatrix,
    ObjectMatrixPrimitiveType,
} from '@univerjs/core';
import { IAccessor } from '@wendellhu/redi';

export interface IAutoFillCommandParams {
    worksheetId?: string;
    workbookId?: string;
    applyRange: IRange;
    selectionRange: IRange;
    applyDatas: ICellData[][];
    applyMergeRanges?: IRange[];
}

export const AutoFillCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.auto-fill',
    // eslint-disable-next-line max-lines-per-function
    handler: async (accessor: IAccessor, params?: IAutoFillCommandParams) => {
        const commandService = accessor.get(ICommandService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const undoRedoService = accessor.get(IUndoRedoService);

        const {
            applyRange,
            selectionRange,
            applyDatas,
            workbookId = univerInstanceService.getCurrentUniverSheetInstance().getUnitId(),
            worksheetId = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet().getSheetId(),
            applyMergeRanges,
        } = params || {};
        if (!applyRange || !applyDatas || !selectionRange) {
            return false;
        }

        // set range value
        const cellValue = new ObjectMatrix<ICellData>();
        const { startRow, startColumn, endRow, endColumn } = applyRange;

        for (let r = 0; r <= endRow - startRow; r++) {
            for (let c = 0; c <= endColumn - startColumn; c++) {
                cellValue.setValue(r + startRow, c + startColumn, applyDatas[r][c]);
            }
        }

        const setRangeValuesMutationParams: ISetRangeValuesMutationParams = {
            worksheetId,
            workbookId,
            cellValue: cellValue.getMatrix(),
        };

        const undoSetRangeValuesMutationParams: ISetRangeValuesMutationParams = SetRangeValuesUndoMutationFactory(
            accessor,
            setRangeValuesMutationParams
        );

        const setRangeResult = commandService.syncExecuteCommand(
            SetRangeValuesMutation.id,
            setRangeValuesMutationParams
        );

        // set selection
        const selectionResult = commandService.syncExecuteCommand(SetSelectionsOperation.id, {
            selections: [
                {
                    primary: {
                        ...selectionRange,
                    },
                    range: {
                        ...selectionRange,
                    },
                },
            ],
            workbookId,
            worksheetId,
        });

        const undoSeq: ICommandInfo[] = [{ id: SetRangeValuesMutation.id, params: undoSetRangeValuesMutationParams }];
        const redoSeq: ICommandInfo[] = [{ id: SetRangeValuesMutation.id, params: setRangeValuesMutationParams }];

        let removeMergeResult = true;
        let addMergeResult = true;

        // add worksheet merge
        if (applyMergeRanges) {
            const ranges = getAddMergeMutationRangeByType(applyMergeRanges);
            const removeMergeMutationParams: IRemoveWorksheetMergeMutationParams = {
                workbookId,
                worksheetId,
                ranges,
            };
            const undoRemoveMergeMutationParams: IAddWorksheetMergeMutationParams = RemoveMergeUndoMutationFactory(
                accessor,
                removeMergeMutationParams
            );
            removeMergeResult = commandService.syncExecuteCommand(
                RemoveWorksheetMergeMutation.id,
                removeMergeMutationParams
            );
            const addMergeMutationParams: IAddWorksheetMergeMutationParams = {
                workbookId,
                worksheetId,
                ranges,
            };
            const undoRemoveMutationParams: IRemoveWorksheetMergeMutationParams = AddMergeUndoMutationFactory(
                accessor,
                addMergeMutationParams
            );
            addMergeResult = commandService.syncExecuteCommand(AddWorksheetMergeMutation.id, addMergeMutationParams);

            undoSeq.push({ id: AddWorksheetMergeMutation.id, params: undoRemoveMergeMutationParams });
            undoSeq.push({ id: RemoveWorksheetMergeMutation.id, params: undoRemoveMutationParams });
            redoSeq.push({ id: RemoveWorksheetMergeMutation.id, params: removeMergeMutationParams });
            redoSeq.push({ id: AddWorksheetMergeMutation.id, params: addMergeMutationParams });
        }

        if (setRangeResult && removeMergeResult && addMergeResult && selectionResult) {
            undoRedoService.pushUndoRedo({
                unitID: workbookId,
                undoMutations: undoSeq,
                redoMutations: redoSeq,
            });

            return true;
        }
        return true;
    },
};

export interface IAutoClearContentCommand {
    clearRange: IRange;
    selectionRange: IRange;
}

export const AutoClearContentCommand: ICommand = {
    id: 'sheet.command.auto-clear-content',
    type: CommandType.COMMAND,
    handler: async (accessor: IAccessor, params: IAutoClearContentCommand) => {
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);

        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const workbookId = workbook.getUnitId();
        const worksheet = workbook.getActiveSheet();
        const worksheetId = worksheet.getSheetId();
        const { clearRange, selectionRange } = params;

        const clearMutationParams: ISetRangeValuesMutationParams = {
            worksheetId,
            workbookId,
            cellValue: generateNullCellValue([clearRange]),
        };
        const undoClearMutationParams: ISetRangeValuesMutationParams = SetRangeValuesUndoMutationFactory(
            accessor,
            clearMutationParams
        );
        commandService.executeCommand(SetSelectionsOperation.id, {
            selections: [
                {
                    primary: {
                        ...selectionRange,
                    },
                    range: {
                        ...selectionRange,
                    },
                },
            ],
            workbookId,
            worksheetId,
        });

        const result = commandService.syncExecuteCommand(SetRangeValuesMutation.id, clearMutationParams);
        if (result) {
            undoRedoService.pushUndoRedo({
                // If there are multiple mutations that form an encapsulated project, they must be encapsulated in the same undo redo element.
                // Hooks can be used to hook the code of external controllers to add new actions.
                unitID: workbookId,
                undoMutations: [{ id: SetRangeValuesMutation.id, params: undoClearMutationParams }],
                redoMutations: [{ id: SetRangeValuesMutation.id, params: clearMutationParams }],
                undo() {
                    return commandService.syncExecuteCommand(SetRangeValuesMutation.id, undoClearMutationParams);
                },
                redo() {
                    return commandService.syncExecuteCommand(SetRangeValuesMutation.id, clearMutationParams);
                },
            });

            return true;
        }

        return false;
    },
};

// Generate cellValue from range and set v/m to null
function generateNullCellValue(range: IRange[]): ObjectMatrixPrimitiveType<ICellData> {
    const cellValue = new ObjectMatrix<ICellData>();
    range.forEach((r: IRange) => {
        const { startRow, startColumn, endRow, endColumn } = r;
        for (let i = startRow; i <= endRow; i++) {
            for (let j = startColumn; j <= endColumn; j++) {
                cellValue.setValue(i, j, {
                    v: null,
                    m: null,
                });
            }
        }
    });

    return cellValue.getData();
}
